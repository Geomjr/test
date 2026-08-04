"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-api";
import { ActionSheet } from "@/components/ui/ActionSheet";
import { ListSection } from "@/components/ui/List";
import { Sheet } from "@/components/ui/Sheet";
import { FormCard, SelectField, TextField } from "@/components/ui/fields";
import { CakeIcon, CheckCircleIcon, CircleIcon, SwapIcon } from "@/components/ui/icons";
import { formatDate, relativeFuture } from "@/lib/dates";

/* ------------------------------- Tasks ---------------------------------- */

export type TaskRow = {
  id: string;
  title: string;
  dueDate: string | null;
  completedAt: number | null;
};

export function ContactTasks({
  contactId,
  tasks,
  today,
}: {
  contactId: string;
  tasks: TaskRow[];
  today: string;
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [menuFor, setMenuFor] = useState<TaskRow | null>(null);

  async function toggle(task: TaskRow) {
    await api(`/api/tasks/${task.id}`, {
      method: "PATCH",
      json: { completed: !task.completedAt },
    });
    router.refresh();
  }

  return (
    <ListSection
      title="Tasks"
      action={
        <button
          type="button"
          onClick={() => {
            setTitle("");
            setDue("");
            setAddOpen(true);
          }}
          className="pressable text-[14px] font-semibold text-tint"
        >
          Add
        </button>
      }
    >
      {tasks.length === 0 ? (
        <div className="px-4 py-4 text-[14px] text-label-2">No tasks.</div>
      ) : (
        tasks.map((task) => {
          const overdue = !task.completedAt && task.dueDate !== null && task.dueDate < today;
          return (
            <div
              key={task.id}
              className="hairline-b last:after:hidden flex min-h-[46px] items-center gap-3 px-4 py-1.5"
            >
              <button
                type="button"
                aria-label={task.completedAt ? "Mark incomplete" : "Mark complete"}
                onClick={() => void toggle(task)}
                className={`pressable shrink-0 ${task.completedAt ? "text-green" : "text-label-3"}`}
              >
                {task.completedAt ? <CheckCircleIcon size={23} /> : <CircleIcon size={23} />}
              </button>
              <button
                type="button"
                onClick={() => setMenuFor(task)}
                className="min-w-0 flex-1 py-1 text-left"
              >
                <span
                  className={`block text-[16px] ${
                    task.completedAt ? "text-label-3 line-through" : ""
                  }`}
                >
                  {task.title}
                </span>
                {task.dueDate ? (
                  <span className={`text-[13px] ${overdue ? "text-red" : "text-label-2"}`}>
                    {overdue
                      ? `Overdue · ${formatDate(task.dueDate, { year: false })}`
                      : relativeFuture(task.dueDate, today)}
                  </span>
                ) : null}
              </button>
            </div>
          );
        })
      )}

      <ActionSheet
        open={menuFor !== null}
        onClose={() => setMenuFor(null)}
        title={menuFor?.title}
        actions={[
          {
            label: "Delete Task",
            destructive: true,
            onSelect: () => {
              if (!menuFor) return;
              void api(`/api/tasks/${menuFor.id}`, { method: "DELETE" }).then(() =>
                router.refresh(),
              );
            },
          },
        ]}
      />

      <Sheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="New Task"
        right={
          <button
            type="button"
            disabled={!title.trim()}
            className="pressable px-3 text-[17px] font-semibold text-tint disabled:opacity-40"
            onClick={() => {
              void api("/api/tasks", {
                json: { title, contactId, dueDate: due || null },
              }).then(() => {
                setAddOpen(false);
                router.refresh();
              });
            }}
          >
            Add
          </button>
        }
      >
        <FormCard>
          <TextField
            label="Task"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Send her the case prep doc"
            autoFocus
          />
          <TextField label="Due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </FormCard>
      </Sheet>
    </ListSection>
  );
}

/* --------------------------- Important dates ----------------------------- */

export type DateRow = {
  id: string;
  label: string;
  date: string;
  recurring: number;
};

export function ContactDates({
  contactId,
  dates,
  birthday,
}: {
  contactId: string;
  dates: DateRow[];
  birthday: string | null;
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [date, setDate] = useState("");
  const [recurring, setRecurring] = useState(true);
  const [menuFor, setMenuFor] = useState<DateRow | null>(null);

  if (dates.length === 0 && !birthday) {
    // Birthday lives on the contact record; only render the section when
    // there is something to show or the user opens the add sheet from here.
  }

  return (
    <ListSection
      title="Important Dates"
      action={
        <button
          type="button"
          onClick={() => {
            setLabel("");
            setDate("");
            setRecurring(true);
            setAddOpen(true);
          }}
          className="pressable text-[14px] font-semibold text-tint"
        >
          Add
        </button>
      }
    >
      {birthday ? (
        <div className="hairline-b last:after:hidden flex min-h-[46px] items-center justify-between px-4 py-2">
          <span className="flex items-center gap-2.5 text-[16px]">
            <CakeIcon size={18} className="text-pink" />
            Birthday
          </span>
          <span className="text-[15px] text-label-2">{formatDate(birthday)}</span>
        </div>
      ) : null}
      {dates.length === 0 && !birthday ? (
        <div className="px-4 py-4 text-[14px] text-label-2">No dates.</div>
      ) : (
        dates.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => setMenuFor(row)}
            className="hairline-b last:after:hidden pressable-bg flex min-h-[46px] w-full items-center justify-between px-4 py-2 text-left"
          >
            <span className="text-[16px]">{row.label}</span>
            <span className="text-[15px] text-label-2">
              {formatDate(row.date, { year: !row.recurring })}
              {row.recurring ? " · yearly" : ""}
            </span>
          </button>
        ))
      )}

      <ActionSheet
        open={menuFor !== null}
        onClose={() => setMenuFor(null)}
        title={menuFor?.label}
        actions={[
          {
            label: "Delete Date",
            destructive: true,
            onSelect: () => {
              if (!menuFor) return;
              void api(`/api/important-dates/${menuFor.id}`, { method: "DELETE" }).then(() =>
                router.refresh(),
              );
            },
          },
        ]}
      />

      <Sheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="New Date"
        right={
          <button
            type="button"
            disabled={!label.trim() || !date}
            className="pressable px-3 text-[17px] font-semibold text-tint disabled:opacity-40"
            onClick={() => {
              void api("/api/important-dates", {
                json: { contactId, label, date, recurring },
              }).then(() => {
                setAddOpen(false);
                router.refresh();
              });
            }}
          >
            Add
          </button>
        }
      >
        <FormCard>
          <TextField
            label="Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Wedding, internship starts…"
            autoFocus
          />
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <SelectField
            label="Repeats"
            value={recurring ? "yearly" : "once"}
            onChange={(e) => setRecurring(e.target.value === "yearly")}
          >
            <option value="yearly">Every year</option>
            <option value="once">One-time</option>
          </SelectField>
        </FormCard>
      </Sheet>
    </ListSection>
  );
}

/* ------------------------------- Intros ---------------------------------- */

export type IntroRow = {
  id: string;
  kind: "received" | "made";
  fromContactId: string;
  toContactId: string;
  fromName: string;
  toName: string;
};

export function ContactIntros({
  contactId,
  contactName,
  intros,
  otherContacts,
}: {
  contactId: string;
  contactName: string;
  intros: IntroRow[];
  otherContacts: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [kind, setKind] = useState<"received" | "made">("received");
  const [otherId, setOtherId] = useState("");
  const [menuFor, setMenuFor] = useState<IntroRow | null>(null);

  function describe(intro: IntroRow): string {
    if (intro.kind === "received") {
      return intro.fromContactId === contactId
        ? `${intro.fromName} introduced you to ${intro.toName}`
        : `${intro.fromName} introduced you to ${intro.toName}`;
    }
    return `You introduced ${intro.fromName} and ${intro.toName}`;
  }

  return (
    <ListSection
      title="Introductions"
      action={
        <button
          type="button"
          onClick={() => {
            setKind("received");
            setOtherId("");
            setAddOpen(true);
          }}
          className="pressable text-[14px] font-semibold text-tint"
        >
          Add
        </button>
      }
    >
      {intros.length === 0 ? (
        <div className="px-4 py-4 text-[14px] text-label-2">No introductions recorded yet.</div>
      ) : (
        intros.map((intro) => (
          <button
            key={intro.id}
            type="button"
            onClick={() => setMenuFor(intro)}
            className="hairline-b last:after:hidden pressable-bg flex min-h-[46px] w-full items-center gap-3 px-4 py-2 text-left"
          >
            <SwapIcon size={18} className="shrink-0 text-teal" />
            <span className="text-[15px]">{describe(intro)}</span>
          </button>
        ))
      )}

      <ActionSheet
        open={menuFor !== null}
        onClose={() => setMenuFor(null)}
        actions={[
          {
            label: "Delete Introduction",
            destructive: true,
            onSelect: () => {
              if (!menuFor) return;
              void api(`/api/intros/${menuFor.id}`, { method: "DELETE" }).then(() =>
                router.refresh(),
              );
            },
          },
        ]}
      />

      <Sheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="New Introduction"
        right={
          <button
            type="button"
            disabled={!otherId}
            className="pressable px-3 text-[17px] font-semibold text-tint disabled:opacity-40"
            onClick={() => {
              const payload =
                kind === "received"
                  ? { kind, fromContactId: contactId, toContactId: otherId }
                  : { kind, fromContactId: contactId, toContactId: otherId };
              void api("/api/intros", { json: payload }).then(() => {
                setAddOpen(false);
                router.refresh();
              });
            }}
          >
            Add
          </button>
        }
      >
        <FormCard>
          <SelectField
            label="What happened"
            value={kind}
            onChange={(e) => setKind(e.target.value as "received" | "made")}
          >
            <option value="received">{contactName} introduced me to someone</option>
            <option value="made">I connected {contactName} with someone</option>
          </SelectField>
          <SelectField
            label={kind === "received" ? "To whom" : "With whom"}
            value={otherId}
            onChange={(e) => setOtherId(e.target.value)}
          >
            <option value="">Choose a person…</option>
            {otherContacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))}
          </SelectField>
        </FormCard>
      </Sheet>
    </ListSection>
  );
}
