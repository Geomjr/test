import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { listContacts } from "@/lib/data/contacts";
import { aiEnabled } from "@/lib/ai/client";
import { userToday } from "@/lib/today";
import { Screen } from "@/components/ui/Screen";
import { CaptureScreen } from "@/components/capture/CaptureScreen";

export const metadata = { title: "Capture" };

export default async function CapturePage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const today = await userToday();
  const contacts = listContacts(user.id).map((c) => ({
    id: c.id,
    name: c.name,
    detail: [c.role, c.company].filter(Boolean).join(" · "),
  }));

  return (
    <Screen title="Capture">
      <CaptureScreen contacts={contacts} today={today} aiOn={aiEnabled()} />
    </Screen>
  );
}
