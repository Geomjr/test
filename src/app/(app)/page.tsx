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
import {
  CakeIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChecklistIcon,
  ColumnsIcon,
  EllipsisCircleIcon,
  PeopleIcon,
} from "@/components/ui/icons";
import { STAGE_META } from "@/lib/pipeline-meta";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function Medallion({
  children,
  bg,
  color,
}: {
  children: React.ReactNode;
  bg: string;
  color?: string;
}) {
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[19px]"
      style={{ background: bg, color }}
    >
      {children}
    </span>
  );
}

export default async function TodayPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const today = await userToday();
  const data = getDashboardData(user.id, today);
  const weekday = WEEKDAYS[new Date(isoToUTC(today)).getUTCDay()];

  return (
    <Screen
      title="Today"
      eyebrow={`${weekday}, ${formatDate(today, { year: false })}`}
      right={
        <Link
          href="/more"
          aria-label="More"
          className="pressable flex h-[44px] w-[38px] items-center justify-center text-tint lg:hidden"
        >
          <EllipsisCircleIcon size={24} />
        </Link>
      }
    >
      {data.contactCount === 0 ? (
        <div className="card mt-4">
          <EmptyState
            icon={<PeopleIcon size={34} />}
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
            <ListSection title="Reach out" count={data.overdue.length}>
              {data.overdue.slice(0, 6).map((entry) => (
                <ListRow
                  key={entry.id}
                  href={`/contacts/${entry.id}`}
                  leading={<Avatar name={entry.name} size={42} />}
                  title={<span className="font-medium">{entry.name}</span>}
                  subtitle={`Every ${entry.cadenceDays}d · last touch ${entry.daysSince}d ago`}
                  subtitleLines={2}
                  value={
                    entry.daysOverdue === 0 ? (
                      <span className="rounded-full bg-orange-soft px-2.5 py-1 text-[12px] font-bold text-orange">
                        Due today
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-soft px-2.5 py-1 text-[12px] font-bold text-red">
                        {entry.daysOverdue}d late
                      </span>
                    )
                  }
                  chevron
                />
              ))}
            </ListSection>
          ) : (
            <ListSection title="Reach out">
              <div className="flex items-center gap-3.5 px-4 py-4">
                <Medallion bg="var(--green-soft)" color="var(--green)">
                  <CheckCircleIcon size={22} />
                </Medallion>
                <div>
                  <p className="text-[16px] font-medium">All caught up</p>
                  <p className="text-[13.5px] text-label-2">
                    Nobody is past their cadence right now.
                  </p>
                </div>
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
                      <Medallion bg="var(--pink-soft)" color="var(--pink)">
                        <CakeIcon size={20} />
                      </Medallion>
                    ) : (
                      <Medallion bg="var(--orange-soft)" color="var(--orange)">
                        <CalendarIcon size={20} />
                      </Medallion>
                    )
                  }
                  title={<span className="font-medium">{event.contactName}</span>}
                  subtitle={event.label}
                  value={
                    <span className="font-semibold text-label">
                      {relativeFuture(event.occursOn, today)}
                    </span>
                  }
                  chevron
                />
              ))}
            </ListSection>
          ) : null}

          {data.dueTasks.length > 0 ? (
            <ListSection
              title="Tasks due"
              action={
                <Link href="/tasks" className="pressable text-[15px] font-semibold text-tint">
                  All tasks
                </Link>
              }
            >
              {data.dueTasks.slice(0, 5).map((task) => (
                <ListRow
                  key={task.id}
                  href={task.contactId ? `/contacts/${task.contactId}` : "/tasks"}
                  leading={
                    <Medallion bg="var(--tint-soft)" color="var(--tint)">
                      <ChecklistIcon size={20} />
                    </Medallion>
                  }
                  title={<span className="whitespace-normal font-medium">{task.title}</span>}
                  subtitle={task.contactName ?? undefined}
                  subtitleLines={2}
                  value={
                    task.dueDate && task.dueDate < today ? (
                      <span className="rounded-full bg-red-soft px-2.5 py-1 text-[12px] font-bold text-red">
                        Overdue
                      </span>
                    ) : task.dueDate ? (
                      <span className="font-semibold text-label">
                        {relativeFuture(task.dueDate, today)}
                      </span>
                    ) : undefined
                  }
                  chevron
                />
              ))}
            </ListSection>
          ) : null}

          {data.stalePipeline.length > 0 ? (
            <ListSection title="Pipeline needs a push">
              {data.stalePipeline.slice(0, 4).map((item) => (
                <ListRow
                  key={item.id}
                  href={`/contacts/${item.contact.id}`}
                  leading={
                    <Medallion bg="var(--teal-soft)" color="var(--teal)">
                      <ColumnsIcon size={20} />
                    </Medallion>
                  }
                  title={<span className="font-medium">{item.contact.name}</span>}
                  subtitle={STAGE_META[item.stage].label}
                  chevron
                />
              ))}
            </ListSection>
          ) : null}

          {data.reconnects.length > 0 ? (
            <section className="mt-8">
              <h2 className="px-1.5 pb-2.5 text-[19px] font-semibold tracking-[-0.015em]">
                Worth a hello
              </h2>
              <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
                {data.reconnects.map((suggestion) => (
                  <Link
                    key={suggestion.id}
                    href={`/contacts/${suggestion.id}`}
                    className="card pressable flex w-[148px] shrink-0 flex-col items-center gap-2.5 px-3 py-5 text-center"
                  >
                    <Avatar name={suggestion.name} size={56} />
                    <span className="line-clamp-1 text-[15px] font-semibold">
                      {suggestion.name}
                    </span>
                    <span className="text-[13px] text-label-2">
                      {suggestion.daysSince >= 7
                        ? `${Math.floor(suggestion.daysSince / 7)} weeks ago`
                        : `${suggestion.daysSince} days ago`}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </Screen>
  );
}
