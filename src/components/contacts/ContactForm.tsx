"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/client-api";
import { Button } from "@/components/ui/Button";
import { FormCard, SelectField, TextAreaField, TextField } from "@/components/ui/fields";
import { TagChip } from "@/components/ui/badges";
import { XMarkIcon } from "@/components/ui/icons";
import { TIER_META, TIER_ORDER } from "@/lib/tiers";
import type { Tier } from "@/lib/db/schema";

export type ContactFormValues = {
  name: string;
  company: string;
  role: string;
  industry: string;
  city: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  howWeMet: string;
  tier: Tier;
  cadenceDays: number | null;
  birthday: string;
  notes: string;
  tags: string[];
};

const CADENCE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "No reminder" },
  { value: "7", label: "Every week" },
  { value: "14", label: "Every 2 weeks" },
  { value: "21", label: "Every 3 weeks" },
  { value: "30", label: "Every month" },
  { value: "45", label: "Every 6 weeks" },
  { value: "60", label: "Every 2 months" },
  { value: "90", label: "Every 3 months" },
  { value: "180", label: "Twice a year" },
];

export function ContactForm({
  contactId,
  initial,
  suggestedTags,
}: {
  contactId?: string;
  initial?: Partial<ContactFormValues>;
  suggestedTags: string[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<ContactFormValues>({
    name: initial?.name ?? "",
    company: initial?.company ?? "",
    role: initial?.role ?? "",
    industry: initial?.industry ?? "",
    city: initial?.city ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    linkedinUrl: initial?.linkedinUrl ?? "",
    howWeMet: initial?.howWeMet ?? "",
    tier: initial?.tier ?? "new",
    cadenceDays: initial?.cadenceDays ?? null,
    // date inputs can't represent "--MM-DD"; shown empty, preserved on save
    birthday: initial?.birthday?.startsWith("--") ? "" : (initial?.birthday ?? ""),
    notes: initial?.notes ?? "",
    tags: initial?.tags ?? [],
  });
  const [tagDraft, setTagDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof ContactFormValues>(key: K, value: ContactFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  function addTag(name: string) {
    const clean = name.trim();
    if (!clean || values.tags.includes(clean)) return;
    set("tags", [...values.tags, clean]);
    setTagDraft("");
  }

  // A year-less "--MM-DD" birthday can't render in <input type="date">; if the
  // user never touched the (empty-looking) field, preserve the stored value
  // instead of silently erasing it on save.
  const yearlessBirthday =
    initial?.birthday?.startsWith("--") === true ? initial.birthday : null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      name: values.name,
      company: values.company,
      role: values.role,
      industry: values.industry,
      city: values.city,
      email: values.email,
      phone: values.phone,
      linkedinUrl: values.linkedinUrl,
      howWeMet: values.howWeMet,
      tier: values.tier,
      cadenceDays: values.cadenceDays,
      birthday: values.birthday || yearlessBirthday,
      notes: values.notes,
      tags: values.tags,
    };
    try {
      if (contactId) {
        await api(`/api/contacts/${contactId}`, { method: "PATCH", json: payload });
        router.push(`/contacts/${contactId}`);
      } else {
        const res = await api<{ contact: { id: string } }>("/api/contacts", { json: payload });
        router.push(`/contacts/${res.contact.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save. Try again.");
      setBusy(false);
    }
  }

  const tagSuggestions = suggestedTags.filter(
    (t) => !values.tags.includes(t) && t.toLowerCase().includes(tagDraft.toLowerCase()),
  );

  return (
    <form onSubmit={submit} className="pb-6">
      <FormCard>
        <TextField
          label="Name"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Full name"
          required
        />
        <TextField
          label="Company"
          value={values.company}
          onChange={(e) => set("company", e.target.value)}
          placeholder="Where they work"
        />
        <TextField
          label="Role"
          value={values.role}
          onChange={(e) => set("role", e.target.value)}
          placeholder="What they do"
        />
        <TextField
          label="Industry"
          value={values.industry}
          onChange={(e) => set("industry", e.target.value)}
          placeholder="Consulting, PE, Tech…"
        />
        <TextField
          label="City"
          value={values.city}
          onChange={(e) => set("city", e.target.value)}
          placeholder="Where they live"
        />
      </FormCard>

      <FormCard footer="Orbit nudges you on Today when a reminder cadence lapses.">
        <SelectField
          label="Tier"
          value={values.tier}
          onChange={(e) => {
            const tier = e.target.value as Tier;
            setValues((v) => ({
              ...v,
              tier,
              cadenceDays:
                v.cadenceDays === null ? TIER_META[tier].suggestedCadence : v.cadenceDays,
            }));
          }}
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {TIER_META[tier].label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Keep in touch"
          value={values.cadenceDays === null ? "" : String(values.cadenceDays)}
          onChange={(e) => set("cadenceDays", e.target.value ? Number(e.target.value) : null)}
        >
          {CADENCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Birthday"
          type="date"
          value={values.birthday}
          onChange={(e) => set("birthday", e.target.value)}
        />
      </FormCard>

      <FormCard>
        <TextField
          label="Email"
          type="email"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="Optional"
          autoCapitalize="none"
        />
        <TextField
          label="Phone"
          type="tel"
          value={values.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="Optional"
        />
        <TextField
          label="LinkedIn"
          type="url"
          value={values.linkedinUrl}
          onChange={(e) => set("linkedinUrl", e.target.value)}
          placeholder="Profile URL"
          autoCapitalize="none"
        />
      </FormCard>

      <FormCard>
        <TextAreaField
          label="How you met"
          value={values.howWeMet}
          onChange={(e) => set("howWeMet", e.target.value)}
          placeholder="Section A orientation, intro from Sarah…"
          rows={2}
        />
        <TextAreaField
          label="Notes"
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Anything worth remembering"
          rows={4}
        />
      </FormCard>

      <FormCard footer="Tags power filters and analytics — sections, clubs, industries, cities.">
        <div className="px-4 py-3">
          {values.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pb-2.5">
              {values.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => set("tags", values.tags.filter((t) => t !== tag))}
                  className="pressable inline-flex items-center gap-1"
                  aria-label={`Remove tag ${tag}`}
                >
                  <TagChip name={tag} />
                  <XMarkIcon size={12} className="text-label-3" />
                </button>
              ))}
            </div>
          ) : null}
          <input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(tagDraft);
              }
            }}
            placeholder="Add a tag and press return"
            className="w-full bg-transparent text-[16px] outline-none placeholder:text-label-3"
          />
          {tagDraft && tagSuggestions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {tagSuggestions.slice(0, 6).map((tag) => (
                <button key={tag} type="button" onClick={() => addTag(tag)} className="pressable">
                  <TagChip name={`+ ${tag}`} />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </FormCard>

      {error ? <p className="px-2 pt-3 text-[14px] text-red">{error}</p> : null}

      <div className="pt-6">
        <Button type="submit" block loading={busy}>
          {contactId ? "Save Changes" : "Add Person"}
        </Button>
      </div>
    </form>
  );
}
