"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { TierBadge } from "@/components/ui/badges";
import { SearchBar } from "@/components/ui/SearchBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListRow } from "@/components/ui/List";
import { PeopleIcon } from "@/components/ui/icons";
import { TIER_META, TIER_ORDER } from "@/lib/tiers";
import type { Tier } from "@/lib/db/schema";

export type ContactRow = {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  tier: Tier;
  /** updatedAt when a photo exists (cache-buster), null otherwise */
  photoVersion: number | null;
  tags: string[];
  lastInteractionDate: string | null;
};

export function ContactsList({ contacts }: { contacts: ContactRow[] }) {
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<Tier | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts.filter((contact) => {
      if (tierFilter !== "all" && contact.tier !== tierFilter) return false;
      if (!q) return true;
      const haystack = [contact.name, contact.company, contact.role, ...contact.tags]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return q.split(/\s+/).every((term) => haystack.includes(term));
    });
  }, [contacts, query, tierFilter]);

  const groups = useMemo(() => {
    const map = new Map<string, ContactRow[]>();
    for (const contact of filtered) {
      const first = contact.name[0]?.toUpperCase() ?? "#";
      const letter = /[A-Z]/.test(first) ? first : "#";
      const list = map.get(letter) ?? [];
      list.push(contact);
      map.set(letter, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div>
      <SearchBar value={query} onValueChange={setQuery} placeholder="Search people" />

      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        <FilterChip
          label={`All · ${contacts.length}`}
          active={tierFilter === "all"}
          onClick={() => setTierFilter("all")}
        />
        {TIER_ORDER.map((tier) => {
          const n = contacts.filter((c) => c.tier === tier).length;
          if (n === 0) return null;
          return (
            <FilterChip
              key={tier}
              label={`${TIER_META[tier].label} · ${n}`}
              active={tierFilter === tier}
              color={TIER_META[tier].color}
              onClick={() => setTierFilter(tierFilter === tier ? "all" : tier)}
            />
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<PeopleIcon size={44} />}
          title={contacts.length === 0 ? "No people yet" : "No matches"}
          subtitle={
            contacts.length === 0
              ? "Add your first contact or import your LinkedIn connections."
              : "Try a different search or clear the tier filter."
          }
        />
      ) : (
        groups.map(([letter, rows]) => (
          <section key={letter} className="mt-4">
            <p className="px-1.5 pb-1.5 text-[15px] font-semibold text-label-2">{letter}</p>
            <div className="card overflow-hidden">
              {rows.map((contact) => (
                <ListRow
                  key={contact.id}
                  href={`/contacts/${contact.id}`}
                  leading={
                    <Avatar
                      name={contact.name}
                      photoUrl={
                        contact.photoVersion !== null
                          ? `/api/contacts/${contact.id}/photo?v=${contact.photoVersion}`
                          : null
                      }
                      size={40}
                    />
                  }
                  title={<span className="font-medium">{contact.name}</span>}
                  subtitle={[contact.role, contact.company].filter(Boolean).join(" · ") || undefined}
                  value={<TierBadge tier={contact.tier} />}
                  chevron
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pressable shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold ${
        active ? "text-white" : "bg-fill text-label-2"
      }`}
      style={active ? { background: color ?? "var(--tint)" } : undefined}
    >
      {label}
    </button>
  );
}
