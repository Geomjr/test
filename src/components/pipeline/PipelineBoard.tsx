"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/client-api";
import { ActionSheet, type SheetAction } from "@/components/ui/ActionSheet";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sheet } from "@/components/ui/Sheet";
import { SearchBar } from "@/components/ui/SearchBar";
import { useToast } from "@/components/ui/Toast";
import { ColumnsIcon } from "@/components/ui/icons";
import { STAGE_META, STAGE_ORDER } from "@/lib/pipeline-meta";
import type { PipelineStage } from "@/lib/db/schema";

export type BoardCard = {
  id: string;
  stage: PipelineStage;
  note: string | null;
  position: number;
  contact: {
    id: string;
    name: string;
    company: string | null;
    role: string | null;
    photoVersion: number | null;
  };
};

export function PipelineBoard({
  items,
  candidates,
}: {
  items: BoardCard[];
  candidates: { id: string; name: string; company: string | null }[];
}) {
  const router = useRouter();
  const toast = useToast();

  // Optimistic local copy, refreshed whenever the server payload changes.
  const [cards, setCards] = useState(items);
  useEffect(() => setCards(items), [items]);

  const [menuFor, setMenuFor] = useState<BoardCard | null>(null);
  const [noteFor, setNoteFor] = useState<BoardCard | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  const byStage = useMemo(() => {
    const map = new Map<PipelineStage, BoardCard[]>();
    for (const stage of STAGE_ORDER) map.set(stage, []);
    for (const card of [...cards].sort((a, b) => a.position - b.position)) {
      map.get(card.stage)?.push(card);
    }
    return map;
  }, [cards]);

  function moveCard(card: BoardCard, stage: PipelineStage) {
    if (card.stage === stage) return;
    setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, stage } : c)));
    void api(`/api/pipeline/${card.id}`, { method: "PATCH", json: { stage } })
      .then(() => router.refresh())
      .catch(() => {
        setCards(items); // roll back
        toast("Couldn't move card");
      });
  }

  const onBoard = new Set(cards.map((c) => c.contact.id));
  const addable = candidates.filter(
    (c) =>
      !onBoard.has(c.id) &&
      (!addQuery.trim() || c.name.toLowerCase().includes(addQuery.trim().toLowerCase())),
  );

  return (
    <div>
      {cards.length === 0 ? (
        <EmptyState
          icon={<ColumnsIcon size={44} />}
          title="Pipeline is empty"
          subtitle="Track networking chats like a recruiter would — from first outreach to thank-you note."
        />
      ) : null}

      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 lg:snap-none">
        {STAGE_ORDER.map((stage) => {
          const columnCards = byStage.get(stage) ?? [];
          const meta = STAGE_META[stage];
          return (
            <div
              key={stage}
              className={`w-[272px] shrink-0 snap-start rounded-[14px] p-2 transition-colors ${
                dragOverStage === stage ? "bg-tint-soft" : "bg-fill-2"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStage(stage);
              }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverStage(null);
                const card = cards.find((c) => c.id === dragId);
                if (card) moveCard(card, stage);
                setDragId(null);
              }}
            >
              <div className="flex items-center gap-2 px-2 pb-2 pt-1">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: meta.color }}
                />
                <span className="text-[14px] font-semibold">{meta.label}</span>
                <span className="tnum text-[13px] text-label-3">{columnCards.length}</span>
              </div>

              <div className="flex min-h-[60px] flex-col gap-2">
                {columnCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    draggable
                    onDragStart={() => setDragId(card.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setDragOverStage(null);
                    }}
                    onClick={() => setMenuFor(card)}
                    className={`pressable w-full rounded-[12px] bg-card p-3 text-left shadow-sm ${
                      dragId === card.id ? "opacity-40" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Avatar
                        name={card.contact.name}
                        photoUrl={
                          card.contact.photoVersion !== null
                            ? `/api/contacts/${card.contact.id}/photo?v=${card.contact.photoVersion}`
                            : null
                        }
                        size={32}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-semibold">
                          {card.contact.name}
                        </span>
                        <span className="block truncate text-[12px] text-label-2">
                          {[card.contact.role, card.contact.company].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </span>
                    {card.note ? (
                      <span className="mt-2 block rounded-[8px] bg-fill-2 px-2 py-1.5 text-[12px] leading-snug text-label-2">
                        {card.note}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Card actions */}
      <ActionSheet
        open={menuFor !== null}
        onClose={() => setMenuFor(null)}
        title={menuFor?.contact.name}
        actions={
          menuFor
            ? ([
                {
                  label: "Open Profile",
                  onSelect: () => router.push(`/contacts/${menuFor.contact.id}`),
                },
                ...STAGE_ORDER.filter((s) => s !== menuFor.stage).map<SheetAction>((stage) => ({
                  label: `Move to ${STAGE_META[stage].label}`,
                  onSelect: () => moveCard(menuFor, stage),
                })),
                {
                  label: menuFor.note ? "Edit Note" : "Add Note",
                  onSelect: () => {
                    setNoteDraft(menuFor.note ?? "");
                    setNoteFor(menuFor);
                  },
                },
                {
                  label: "Remove from Board",
                  destructive: true,
                  onSelect: () => {
                    void api(`/api/pipeline/${menuFor.id}`, { method: "DELETE" }).then(() =>
                      router.refresh(),
                    );
                  },
                },
              ] satisfies SheetAction[])
            : []
        }
      />

      {/* Note editor */}
      <Sheet
        open={noteFor !== null}
        onClose={() => setNoteFor(null)}
        title="Card Note"
        right={
          <button
            type="button"
            className="pressable px-3 text-[17px] font-semibold text-tint"
            onClick={() => {
              if (!noteFor) return;
              void api(`/api/pipeline/${noteFor.id}`, {
                method: "PATCH",
                json: { note: noteDraft || null },
              }).then(() => {
                setNoteFor(null);
                router.refresh();
              });
            }}
          >
            Save
          </button>
        }
      >
        <textarea
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          rows={4}
          autoFocus
          placeholder="Next step, context, who referred you…"
          className="w-full rounded-[10px] bg-card p-3 text-[16px] outline-none"
        />
      </Sheet>

      {/* Add person */}
      <button
        type="button"
        aria-label="Add person to pipeline"
        onClick={() => {
          setAddQuery("");
          setAddOpen(true);
        }}
        className="pressable fixed right-5 z-40 flex h-[54px] w-[54px] items-center justify-center rounded-full bg-tint text-white shadow-lg lg:right-10"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 66px)" }}
      >
        <span className="text-[28px] leading-none">＋</span>
      </button>

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Add to Pipeline">
        <SearchBar value={addQuery} onValueChange={setAddQuery} placeholder="Find a person" />
        <div className="mt-3 overflow-hidden rounded-[10px] bg-card">
          {addable.length === 0 ? (
            <p className="px-4 py-4 text-[14px] text-label-2">
              {candidates.length === onBoard.size
                ? "Everyone is already on the board."
                : "No matches."}
            </p>
          ) : (
            addable.slice(0, 30).map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => {
                  void api("/api/pipeline", {
                    json: { contactId: contact.id, stage: "to_reach_out" },
                  }).then(() => {
                    setAddOpen(false);
                    toast("Added to pipeline");
                    router.refresh();
                  });
                }}
                className="hairline-b last:after:hidden pressable-bg flex w-full items-center gap-3 px-4 py-2.5 text-left"
              >
                <Avatar name={contact.name} size={34} />
                <span className="min-w-0">
                  <span className="block truncate text-[16px] font-medium">{contact.name}</span>
                  {contact.company ? (
                    <span className="block truncate text-[13px] text-label-2">
                      {contact.company}
                    </span>
                  ) : null}
                </span>
              </button>
            ))
          )}
        </div>
      </Sheet>
    </div>
  );
}
