"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api } from "@/lib/client-api";
import { Button } from "@/components/ui/Button";
import { ListSection } from "@/components/ui/List";
import { Spinner } from "@/components/ui/Spinner";
import { CheckCircleIcon, CircleIcon, ImportIcon } from "@/components/ui/icons";

type PreviewRow = {
  name: string;
  email: string | null;
  company: string | null;
  role: string | null;
  linkedinUrl: string | null;
  city: string | null;
  phone: string | null;
  connectedOn: string | null;
  status: "new" | "duplicate";
  matchId?: string;
};

type Preview = {
  headers: string[];
  skippedPreamble: number;
  total: number;
  rows: PreviewRow[];
};

export function ImportWizard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [included, setIncluded] = useState<boolean[]>([]);
  const [createdCount, setCreatedCount] = useState<number | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const data = await api<Preview>("/api/import/csv", { form });
      setPreview(data);
      setIncluded(data.rows.map((row) => row.status === "new"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that file.");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!preview) return;
    setBusy(true);
    setError(null);
    try {
      const rows = preview.rows
        .filter((_, i) => included[i])
        .map(({ status: _s, matchId: _m, ...row }) => row);
      const result = await api<{ created: number }>("/api/import/csv/commit", {
        json: { rows },
      });
      setCreatedCount(result.created);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  if (createdCount !== null) {
    return (
      <div className="flex flex-col items-center gap-3 pt-12 text-center">
        <CheckCircleIcon size={52} className="text-green" />
        <p className="text-[22px] font-bold">
          {createdCount} {createdCount === 1 ? "person" : "people"} imported
        </p>
        <p className="max-w-[300px] text-[14px] text-label-2">
          They're tagged “Imported” so you can find and tidy them up in one place.
        </p>
        <Link href="/contacts" className="pt-2">
          <Button>Open People</Button>
        </Link>
      </div>
    );
  }

  if (!preview) {
    return (
      <div>
        <div className="flex flex-col items-center gap-3 rounded-[16px] bg-card px-6 py-10 text-center">
          <ImportIcon size={44} className="text-tint" />
          <p className="text-[18px] font-semibold">Import a CSV</p>
          <p className="max-w-[320px] text-[14px] text-label-2">
            Works with LinkedIn's connections export or any CSV with a name
            column. Orbit maps columns and skips duplicates automatically.
          </p>
          <Button loading={busy} onClick={() => inputRef.current?.click()}>
            Choose File
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />
        </div>
        {error ? <p className="px-2 pt-3 text-center text-[14px] text-red">{error}</p> : null}
        <ListSection
          title="Getting your LinkedIn connections"
          footer="LinkedIn emails you the export — usually within ~10 minutes."
        >
          <div className="px-4 py-3 text-[14px] leading-relaxed text-label-2">
            LinkedIn → Settings & Privacy → <b>Data privacy</b> → Get a copy of
            your data → select <b>Connections</b> → Request archive.
          </div>
        </ListSection>
      </div>
    );
  }

  const newCount = preview.rows.filter((row) => row.status === "new").length;
  const dupCount = preview.rows.length - newCount;
  const selectedCount = included.filter(Boolean).length;

  return (
    <div>
      <div className="rounded-[14px] bg-card px-4 py-3.5">
        <p className="text-[16px] font-semibold">
          {preview.total} {preview.total === 1 ? "row" : "rows"} found
        </p>
        <p className="text-[13px] text-label-2">
          {newCount} new · {dupCount} already in Orbit
          {preview.total > preview.rows.length
            ? ` · showing first ${preview.rows.length}`
            : ""}
        </p>
        <div className="flex gap-2 pt-3">
          <Button
            small
            variant="gray"
            onClick={() => {
              setPreview(null);
              setError(null);
            }}
          >
            Different file
          </Button>
          <Button
            small
            variant="tinted"
            onClick={() => {
              const allOn = included.every(Boolean);
              setIncluded(included.map(() => !allOn));
            }}
          >
            {included.every(Boolean) ? "Select none" : "Select all"}
          </Button>
        </div>
      </div>

      <ListSection title="Rows">
        {preview.rows.map((row, i) => (
          <button
            key={i}
            type="button"
            onClick={() =>
              setIncluded((prev) => prev.map((v, j) => (j === i ? !v : v)))
            }
            className="hairline-b last:after:hidden pressable-bg flex w-full items-center gap-3 px-4 py-2.5 text-left"
          >
            <span className={included[i] ? "text-tint" : "text-label-3"}>
              {included[i] ? <CheckCircleIcon size={22} /> : <CircleIcon size={22} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[16px] font-medium">{row.name}</span>
              <span className="block truncate text-[13px] text-label-2">
                {[row.role, row.company].filter(Boolean).join(" · ") || row.email || "—"}
              </span>
            </span>
            {row.status === "duplicate" ? (
              <span className="shrink-0 rounded-full bg-orange-soft px-2 py-0.5 text-[11px] font-semibold text-orange">
                Duplicate
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-green-soft px-2 py-0.5 text-[11px] font-semibold text-green">
                New
              </span>
            )}
          </button>
        ))}
      </ListSection>

      {error ? <p className="px-2 pt-3 text-center text-[14px] text-red">{error}</p> : null}

      <div className="sticky bottom-0 -mx-4 px-4 pb-3 pt-3"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 56px)" }}
      >
        <Button block loading={busy} disabled={selectedCount === 0} onClick={() => void commit()}>
          {busy ? <Spinner size={16} /> : null}
          Import {selectedCount} {selectedCount === 1 ? "person" : "people"}
        </Button>
      </div>
    </div>
  );
}
