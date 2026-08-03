import { Screen } from "@/components/ui/Screen";
import { ListRow, ListSection } from "@/components/ui/List";
import {
  ChartBarIcon,
  ChecklistIcon,
  GearIcon,
  ImportIcon,
  BookIcon,
  SparklesIcon,
} from "@/components/ui/icons";

export default function MorePage() {
  return (
    <Screen title="More">
      <ListSection>
        <ListRow
          href="/assistant"
          leading={<SparklesIcon size={22} className="text-purple" />}
          title="Assistant"
          subtitle="Ask anything about your network"
          chevron
        />
        <ListRow
          href="/tasks"
          leading={<ChecklistIcon size={22} className="text-tint" />}
          title="Tasks"
          chevron
        />
        <ListRow
          href="/analytics"
          leading={<ChartBarIcon size={22} className="text-green" />}
          title="Analytics"
          chevron
        />
        <ListRow
          href="/review"
          leading={<BookIcon size={22} className="text-orange" />}
          title="Weekly Review"
          chevron
        />
      </ListSection>
      <ListSection>
        <ListRow
          href="/import"
          leading={<ImportIcon size={22} className="text-teal" />}
          title="Import Contacts"
          subtitle="CSV, including LinkedIn exports"
          chevron
        />
        <ListRow
          href="/settings"
          leading={<GearIcon size={22} className="text-gray" />}
          title="Settings"
          chevron
        />
      </ListSection>
    </Screen>
  );
}
