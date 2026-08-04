import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/dashboard";
import { userToday } from "@/lib/today";
import { aiEnabled } from "@/lib/ai/client";
import { relativeFuture } from "@/lib/dates";
import { Screen } from "@/components/ui/Screen";
import { Avatar } from "@/components/ui/Avatar";
import { ListRow, ListSection } from "@/components/ui/List";
import { WeeklySummary } from "@/components/review/WeeklySummary";
import { CakeIcon, CalendarIcon, ChecklistIcon, ColumnsIcon } from "@/components/ui/icons";
import { STAGE_META } from "@/lib/pipeline-meta";

export const metadata = { title: "Weekly Review" };

export default async function ReviewPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const today = await userToday();
  const data = getDashboardData(user.id, today);

  return (
    <Screen title="Weekly Review" back={{ href: "/more", label: "More" }}>
      <WeeklySummary aiOn={aiEnabled()} />

      <ListSection title="Overdue follow-ups" count={data.overdue.length}>
        {data.overdue.length === 0 ? (
          <div className="px-4 py-3 text-[15px] text-label-2">All clear</div>
        ) : (
          data.overdue.map((entry) => (
            <ListRow
              key={entry.id}
              href={`/contacts/${entry.id}`}
              leading={<Avatar name={entry.name} size={36} />}
              title={entry.name}
              subtitle={`${entry.daysSince}d since last touch · cadence ${entry.cadenceDays}d`}
              chevron
            />
          ))
        )}
      </ListSection>

      <ListSection title="Coming up" count={data.upcoming.length}>
        {data.upcoming.length === 0 ? (
          <div className="px-4 py-3 text-[15px] text-label-2">No dates in the next two weeks.</div>
        ) : (
          data.upcoming.map((event) => (
            <ListRow
              key={`${event.contactId}-${event.label}-${event.occursOn}`}
              href={`/contacts/${event.contactId}`}
              leading={
                event.label === "Birthday" ? (
                  <CakeIcon size={20} className="text-pink" />
                ) : (
                  <CalendarIcon size={20} className="text-orange" />
                )
              }
              title={event.contactName}
              subtitle={event.label}
              value={relativeFuture(event.occursOn, today)}
              chevron
            />
          ))
        )}
      </ListSection>

      <ListSection title="Pipeline needing action" count={data.stalePipeline.length}>
        {data.stalePipeline.length === 0 ? (
          <div className="px-4 py-3 text-[15px] text-label-2">Nothing is stuck.</div>
        ) : (
          data.stalePipeline.map((item) => (
            <ListRow
              key={item.id}
              href={`/contacts/${item.contact.id}`}
              leading={<ColumnsIcon size={20} className="text-teal" />}
              title={item.contact.name}
              subtitle={`${STAGE_META[item.stage].label}${item.note ? ` · ${item.note}` : ""}`}
              chevron
            />
          ))
        )}
      </ListSection>

      <ListSection title="Open tasks due soon" count={data.dueTasks.length}>
        {data.dueTasks.length === 0 ? (
          <div className="px-4 py-3 text-[15px] text-label-2">No deadlines this week.</div>
        ) : (
          data.dueTasks.map((task) => (
            <ListRow
              key={task.id}
              href={task.contactId ? `/contacts/${task.contactId}` : "/tasks"}
              leading={<ChecklistIcon size={20} className="text-tint" />}
              title={task.title}
              subtitle={task.contactName ?? undefined}
              value={task.dueDate ? relativeFuture(task.dueDate, today) : undefined}
              chevron
            />
          ))
        )}
      </ListSection>
    </Screen>
  );
}
