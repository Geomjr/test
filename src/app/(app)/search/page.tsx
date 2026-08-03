import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { aiEnabled } from "@/lib/ai/client";
import { Screen } from "@/components/ui/Screen";
import { SearchScreen } from "@/components/search/SearchScreen";

export const metadata = { title: "Search" };

export default async function SearchPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  return (
    <Screen title="Search">
      <SearchScreen aiOn={aiEnabled()} />
    </Screen>
  );
}
