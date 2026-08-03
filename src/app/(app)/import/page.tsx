import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { Screen } from "@/components/ui/Screen";
import { ImportWizard } from "@/components/import/ImportWizard";

export const metadata = { title: "Import" };

export default async function ImportPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  return (
    <Screen title="Import" back={{ href: "/more", label: "More" }}>
      <ImportWizard />
    </Screen>
  );
}
