import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { Screen } from "@/components/ui/Screen";
import { ListRow, ListSection } from "@/components/ui/List";
import { Avatar } from "@/components/ui/Avatar";
import { ExportIcon, SparklesIcon } from "@/components/ui/icons";
import { SignOutButton } from "@/components/SignOutButton";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");
  const aiOn = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <Screen title="Settings" back={{ href: "/more", label: "More" }}>
      <ListSection>
        <ListRow
          leading={<Avatar name={user.name} size={44} />}
          title={<span className="font-semibold">{user.name}</span>}
          subtitle={user.email}
        />
      </ListSection>

      <ListSection
        title="AI"
        footer={
          aiOn
            ? "AI features are powered by Claude and only ever read your own data."
            : "Set ANTHROPIC_API_KEY on the server to enable the assistant, pre-meeting briefs, drafts, and weekly summaries."
        }
      >
        <ListRow
          leading={<SparklesIcon size={22} className="text-purple" />}
          title="AI Features"
          value={
            <span className={aiOn ? "text-green font-medium" : ""}>
              {aiOn ? "On" : "Not configured"}
            </span>
          }
        />
      </ListSection>

      <ListSection
        title="Your data"
        footer="Downloads every contact as a CSV you can open in Excel or re-import elsewhere."
      >
        <ListRow
          leading={<ExportIcon size={22} className="text-tint" />}
          title={<a href="/api/export/csv">Export Contacts (CSV)</a>}
          chevron
        />
      </ListSection>

      <ListSection>
        <SignOutButton />
      </ListSection>

      <p className="pt-8 text-center text-[13px] text-label-3">Orbit 0.1.0</p>
    </Screen>
  );
}
