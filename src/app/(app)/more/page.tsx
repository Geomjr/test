import { Screen } from "@/components/ui/Screen";
import { ListRow, ListSection } from "@/components/ui/List";
import {
  ChartBarIcon,
  ColumnsIcon,
  GearIcon,
  ImportIcon,
  BookIcon,
  SearchIcon,
} from "@/components/ui/icons";

export default function MorePage() {
  return (
    <Screen title="More">
      <ListSection>
        <ListRow
          href="/pipeline"
          leading={<ColumnsIcon size={22} className="text-teal" />}
          title="Pipeline"
          subtitle="Recruiting conversations, stage by stage"
          chevron
        />
        <ListRow
          href="/search"
          leading={<SearchIcon size={22} className="text-tint" />}
          title="Search"
          subtitle="Notes, transcripts, and people"
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
