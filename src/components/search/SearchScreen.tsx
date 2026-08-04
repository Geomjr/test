"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSection } from "@/components/ui/List";
import { Avatar } from "@/components/ui/Avatar";
import {
  BubbleIcon,
  ChecklistIcon,
  ChevronRightIcon,
  SearchIcon,
  SparklesIcon,
  WaveformIcon,
} from "@/components/ui/icons";
import { SNIPPET_CLOSE, SNIPPET_OPEN } from "@/lib/search";
import type { SearchHit } from "@/lib/data/search";

function Highlighted({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let rest = text;
  let key = 0;
  for (;;) {
    const open = rest.indexOf(SNIPPET_OPEN);
    if (open === -1) break;
    const close = rest.indexOf(SNIPPET_CLOSE, open);
    if (close === -1) break;
    if (open > 0) parts.push(<span key={key++}>{rest.slice(0, open)}</span>);
    parts.push(
      <mark key={key++} className="rounded-[3px] bg-yellow/40 px-0.5 text-inherit">
        {rest.slice(open + 1, close)}
      </mark>,
    );
    rest = rest.slice(close + 1);
  }
  if (rest) parts.push(<span key={key++}>{rest}</span>);
  return <>{parts}</>;
}

const GROUPS: { type: SearchHit["entityType"]; title: string }[] = [
  { type: "contact", title: "People" },
  { type: "interaction", title: "Conversations" },
  { type: "voice_note", title: "Voice Notes" },
  { type: "task", title: "Tasks" },
];

export function SearchScreen({ aiOn }: { aiOn: boolean }) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searched, setSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setHits([]);
      setSearched(false);
      return;
    }
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : { hits: [] }))
        .then((data: { hits: SearchHit[] }) => {
          setHits(data.hits);
          setSearched(true);
        })
        .catch(() => {});
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div>
      <SearchBar
        value={query}
        onValueChange={setQuery}
        placeholder="People, notes, transcripts…"
        autoFocus
      />

      {aiOn && query.trim() ? (
        <Link
          href={`/assistant?q=${encodeURIComponent(query.trim())}`}
          className="pressable mt-3 flex items-center gap-3 card px-4 py-3"
        >
          <SparklesIcon size={20} className="text-purple" />
          <span className="flex-1 text-[15px]">
            Ask AI: <span className="font-medium">“{query.trim()}”</span>
          </span>
          <ChevronRightIcon size={16} className="text-label-3" />
        </Link>
      ) : null}

      {!query.trim() ? (
        <EmptyState
          icon={<SearchIcon size={44} />}
          title="Search everything"
          subtitle="Names, companies, notes, interaction logs, voice-note transcripts — “who mentioned Patagonia?”"
        />
      ) : searched && hits.length === 0 ? (
        <EmptyState title="No results" subtitle={`Nothing matched “${query.trim()}”.`} />
      ) : (
        GROUPS.map((group) => {
          const groupHits = hits.filter((h) => h.entityType === group.type);
          if (groupHits.length === 0) return null;
          return (
            <ListSection key={group.type} title={group.title}>
              {groupHits.map((hit) => (
                <Link
                  key={`${hit.entityType}-${hit.entityId}`}
                  href={hit.href}
                  className="hairline-b last:after:hidden pressable-bg flex items-center gap-3 px-4 py-2.5"
                >
                  {hit.entityType === "contact" ? (
                    <Avatar name={hit.title} size={36} />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fill text-label-2">
                      {hit.entityType === "interaction" ? (
                        <BubbleIcon size={18} />
                      ) : hit.entityType === "voice_note" ? (
                        <WaveformIcon size={18} />
                      ) : (
                        <ChecklistIcon size={18} />
                      )}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-medium">
                      <Highlighted text={hit.title} />
                    </span>
                    {hit.snippet ? (
                      <span className="line-clamp-2 text-[13px] leading-snug text-label-2">
                        <Highlighted text={hit.snippet} />
                      </span>
                    ) : hit.subtitle ? (
                      <span className="block truncate text-[13px] text-label-2">
                        {hit.subtitle}
                      </span>
                    ) : null}
                  </span>
                  <ChevronRightIcon size={16} className="shrink-0 text-label-3" />
                </Link>
              ))}
            </ListSection>
          );
        })
      )}
    </div>
  );
}
