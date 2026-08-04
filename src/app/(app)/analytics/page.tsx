import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { getAnalytics } from "@/lib/data/analytics";
import { userToday } from "@/lib/today";
import { Screen } from "@/components/ui/Screen";
import { Avatar } from "@/components/ui/Avatar";
import { ListRow, ListSection } from "@/components/ui/List";
import { BarList } from "@/components/charts/BarList";
import { WeeklyBars } from "@/components/charts/WeeklyBars";
import { Breakdown } from "@/components/charts/Breakdown";
import { BubbleIcon, PeopleIcon } from "@/components/ui/icons";
import { TIER_META } from "@/lib/tiers";
import type { Tier } from "@/lib/db/schema";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const today = await userToday();
  const data = getAnalytics(user.id, today);

  return (
    <Screen title="Analytics" back={{ href: "/more", label: "More" }}>
      <div className="grid grid-cols-2 gap-3">
        <div className="card flex items-start justify-between px-4 py-4">
          <div>
            <p className="tnum text-[32px] font-bold leading-none tracking-[-0.02em]">
              {data.totalContacts}
            </p>
            <p className="pt-1.5 text-[13px] font-medium text-label-2">people in your orbit</p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tint-soft text-tint">
            <PeopleIcon size={19} />
          </span>
        </div>
        <div className="card flex items-start justify-between px-4 py-4">
          <div>
            <p className="tnum text-[32px] font-bold leading-none tracking-[-0.02em]">
              {data.totalInteractions}
            </p>
            <p className="pt-1.5 text-[13px] font-medium text-label-2">interactions logged</p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-soft text-purple">
            <BubbleIcon size={19} />
          </span>
        </div>
      </div>

      <ListSection title="Momentum" footer="Interactions per week, trailing 12 weeks.">
        <WeeklyBars buckets={data.weekly} />
      </ListSection>

      <ListSection title="Where your network lives">
        <Breakdown byIndustry={data.byIndustry} byCompany={data.byCompany} />
      </ListSection>

      <ListSection title="Closeness">
        <BarList
          data={data.byTier.map((row) => ({
            label: row.label,
            count: row.count,
            color: TIER_META[row.tier as Tier].color,
          }))}
        />
      </ListSection>

      {data.mostContacted.length > 0 ? (
        <ListSection title="Most contacted">
          {data.mostContacted.map((row) => (
            <ListRow
              key={row.id}
              href={`/contacts/${row.id}`}
              leading={<Avatar name={row.name} size={34} />}
              title={row.name}
              value={`${row.count}×`}
              chevron
            />
          ))}
        </ListSection>
      ) : null}

      {data.neglected.length > 0 ? (
        <ListSection
          title="Drifting away"
          footer="People you've marked as close — or set cadences for — with the longest silence."
        >
          {data.neglected.map((row) => (
            <ListRow
              key={row.id}
              href={`/contacts/${row.id}`}
              leading={<Avatar name={row.name} size={34} />}
              title={row.name}
              subtitle={TIER_META[row.tier as Tier].label}
              value={
                <span className={row.daysSince > 45 ? "text-red" : ""}>
                  {row.daysSince >= 7 ? `${Math.floor(row.daysSince / 7)}w` : `${row.daysSince}d`}
                </span>
              }
              chevron
            />
          ))}
        </ListSection>
      ) : null}
    </Screen>
  );
}
