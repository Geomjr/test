"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-api";
import { ActionSheet } from "@/components/ui/ActionSheet";
import { EllipsisIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/Toast";

export function ContactMenu({ contactId, name }: { contactId: string; name: string }) {
  const router = useRouter();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="More options"
        onClick={() => setMenuOpen(true)}
        className="pressable flex h-[44px] w-[44px] items-center justify-center text-tint"
      >
        <EllipsisIcon size={24} />
      </button>

      <ActionSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        actions={[
          { label: "Edit", onSelect: () => router.push(`/contacts/${contactId}/edit`) },
          {
            label: "Delete Person",
            destructive: true,
            onSelect: () => setConfirmOpen(true),
          },
        ]}
      />

      <ActionSheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`Delete ${name}? This removes their history, voice notes, and tasks. It can't be undone.`}
        actions={[
          {
            label: "Delete Person",
            destructive: true,
            onSelect: () => {
              void api(`/api/contacts/${contactId}`, { method: "DELETE" }).then(() => {
                toast("Deleted");
                router.push("/contacts");
                router.refresh();
              });
            },
          },
        ]}
      />
    </>
  );
}
