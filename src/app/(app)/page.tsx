import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/dashboard";
import { userToday } from "@/lib/today";
import { formatDate, isoToUTC, relativeFuture } from "@/lib/dates";
import { Screen } from "@/components/ui/Screen";
import { Avatar } from "@/components/ui/Avatar";
import { ListRow, ListSection } from "@/components/ui/List";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { TierBadge } from "@/components/ui/badges";
import {
  BellIcon,
  CalendarIcon,
  ChecklistIcon,
  ColumnsIcon,
  PeopleIcon,
} from "@/components/ui/icons";
import { STAGE_META } from "@/lib/pipeline-meta";
import type { Tier } from "@/lib/db/schema";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function TodayPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const today = await userToday();
  const data = getDashboardData(user.id, today);
  const weekday = WEEKDAYS[new Date(isoToUTC(today)).getUTCDay()];
  const firstName = user.name.split(" ")[0] ?? user.name;

  return (
    <Screen title="Today">
      <p className="-mt-2 pb-2 text-[15px] font-medium text-label-2">
        {weekday}, {formatDate(today, { year: false })} · Hi {firstName}
      </p>

      {data.contactCount === 0 ? (
        <div className="mt-6 rounded-[16px] bg-card">
          <EmptyState
            icon={<PeopleIcon size={46} />}
            title="Welcome to Orbit"
            subtitle="Add the people who matter — classmates, alumni, recruiters, friends — and Orbit makes sure nobody drifts away."
            action={
              <div className="flex gap-2">
                <Link href="/contacts/new">
                  <Button small>Add a person</Button>
                </Link>
                <Link href="/import">
                  <Button small variant="tinted">
                    Import CSV
                  </Button>
                </Link>
              </div>
            }
          />
        </div>
      ) : (
        <>
          {data.overdue.length > 0 ? (
            <ListSection
              title="Reach out"
              footer="People past the keep-in-touch cadence you set for them."
            >
              {data.overdue.slice(0, 6).map((entry) => (
                <ListRow
                  key={entry.id}
                  href={`/contacts/${entry.id}`}
                  leading={<Avatar name={entry.name} size={40} />}
                  title={<span className="font-medium">{entry.name}</span>}
                  subtitle={
                    <span className={entry.daysOverdue > 0 ? "text-red" : "text-orange"}>
                      {entry.daysOverdue === 0
                        ? "Due today"
                        : `${entry.daysOverdue}d overdue`}{" "}
                      · {entry.daysSince}d since last touch
                    </span>
                  }
                  value={<TierBadge tier={entry.tier as Tier} />}
                  chevron
                />
              ))}
            </ListSection>
          ) : (
            <ListSection title="Reach out">
              <div className="flex items-center gap-3 px-4 py-4">
                <BellIcon size={22} className="text-green" />
                <p className="text-[15px] text-label-2">
                  All caught up — nobody is past their cadence. 🎉
                </p>
              </div>
            </ListSection>
          )}

          {data.upcoming.length > 0 ? (
            <ListSection title="Coming up">
              {data.upcoming.map((event) => (
                <ListRow
                  key={`${event.contactId}-${event.label}-${event.occursOn}`}
                  href={`/contacts/${event.contactId}`}
                  leading={
                    event.label === "Birthday" ? (
                      <span className="text-[20px]">🎂</span>
                    ) : (
                      <CalendarIcon size={20} className="text-orange" />
                    )
                  }
                  title={event.contactName}
                  subtitle={event.label}
                  value={relativeFuture(event.occursOn, today)}
                  chevron
                />
              ))}
            </ListSection>
          ) : null}

          {data.dueTasks.length > 0 ? (
            <ListSection title="Tasks due" action={<Link href="/tasks" className="text-[14px] font-semibold text-tint">All tasks</Link>}>
              {data.dueTasks.slice(0, 5).map((task) => (
                <ListRow
                  key={task.id}
                  href={task.contactId ? `/contacts/${task.contactId}` : "/tasks"}
                  leading={<ChecklistIcon size={20} className="text-tint" />}
                  title={task.title}
                  subtitle={task.contactName ?? undefined}
                  value={
                    task.dueDate && task.dueDate < today ? (
                      <span className="font-medium text-red">Overdue</span>
                    ) : task.dueDate ? (
                      relativeFuture(task.dueDate, today)
                    ) : undefined
                  }
                  chevron
                />
              ))}
            </ListSection>
          ) : null}

          {data.stalePipeline.length > 0 ? (
            <ListSection
              title="Pipeline needs a push"
              footer="Sitting in the same stage for over a week."
            >
              {data.stalePipeline.slice(0, 4).map((item) => (
                <ListRow
                  key={item.id}
                  href={`/contacts/${item.contact.id}`}
                  leading={<ColumnsIcon size={20} className="text-teal" />}
                  title={item.contact.name}
                  subtitle={STAGE_META[item.stage].label}
                  chevron
                />
              ))}
            </ListSection>
          ) : null}

          {data.reconnects.length > 0 ? (
            <section className="mt-7">
              <h2 className="px-4 pb-1.5 text-[13px] font-medium uppercase tracking-[0.04em] text-label-2">
                Worth a hello
              </h2>
              <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4">
                {data.reconnects.map((suggestion) => (
                  <Link
                    key={suggestion.id}
                    href={`/contacts/${suggestion.id}`}
                    className="pressable flex w-[140px] shrink-0 flex-col items-center gap-2 rounded-[14px] bg-card px-3 py-4 text-center"
                  >
                    <Avatar name={suggestion.name} size={52} />
                    <span className="line-clamp-1 text-[14px] font-semibold">
                      {suggestion.name}
                    </span>
                    <span className="text-[12px] text-label-2">
                      {suggestion.daysSince >= 7
                        ? `${Math.floor(suggestion.daysSince / 7)}w quiet`
                        : `${suggestion.daysSince}d quiet`}
                    </span>
                  </Link>
                ))}
              </div>
              <p className="px-4 pt-1.5 text-[13px] text-label-2">
                Gentle nudges beyond your cadences — a quick hello goes far.
              </p>
            </section>
          ) : null}
        </>
      )}
    </Screen>
  );
}
