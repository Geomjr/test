"use client";

import { ListRow } from "@/components/ui/List";

export function SignOutButton() {
  return (
    <ListRow
      centerTitle
      title="Sign Out"
      onClick={async () => {
        await fetch("/api/auth/sign-out", { method: "POST" });
        window.location.assign("/sign-in");
      }}
    />
  );
}
