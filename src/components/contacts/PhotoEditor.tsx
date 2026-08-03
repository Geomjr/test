"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { api } from "@/lib/client-api";

export function PhotoEditor({
  contactId,
  name,
  hasPhoto,
}: {
  contactId: string;
  name: string;
  hasPhoto: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [version, setVersion] = useState(0);
  const [photoPresent, setPhotoPresent] = useState(hasPhoto);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      await api(`/api/contacts/${contactId}/photo`, { form });
      setPhotoPresent(true);
      setVersion((v) => v + 1);
      router.refresh();
    } catch {
      // keep prior state
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api(`/api/contacts/${contactId}/photo`, { method: "DELETE" });
      setPhotoPresent(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 pb-5 pt-1">
      <Avatar
        name={name}
        photoUrl={photoPresent ? `/api/contacts/${contactId}/photo?v=${version}` : null}
        size={88}
      />
      <div className="flex gap-4 text-[15px] font-medium">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="pressable text-tint disabled:opacity-40"
        >
          {photoPresent ? "Change Photo" : "Add Photo"}
        </button>
        {photoPresent ? (
          <button
            type="button"
            disabled={busy}
            onClick={remove}
            className="pressable text-red disabled:opacity-40"
          >
            Remove
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
