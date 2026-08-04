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
  ChecklistIcon,
  ColumnsIcon,
  EllipsisCircleIcon,
  MicIcon,
  PeopleIcon,
} from "@/components/ui/icons";
import { STAGE_META } from "@/lib/pipeline-meta";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

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
  const todayUTC = new Date(isoToUTC(today));
  const weekday = WEEKDAYS[todayUTC.getUTCDay()];

  const heroContactIds = new Set(data.todaysThree.map((m) => m.contactId));
  const heroTaskIds = new Set(
    data.todaysThree.flatMap((m) => (m.kind === "promise" && m.taskId ? [m.taskId] : [])),
  );
  const overdueRest = data.overdue.filter((e) => !heroContactIds.has(e.id));
  const tasksRest = data.dueTasks.filter((t) => !heroTaskIds.has(t.id));
  const upcomingRest = data.upcoming.filter(
    (e) => !(e.label === "Birthday" && heroContactIds.has(e.contactId)),
  );

  const pulseMax = Math.max(...data.weekPulse.byDay, 1);
  // Day letters for the trailing week, ending today.
  const dayLetters = data.weekPulse.byDay.map(
    (_, i) => DAY_LETTERS[(todayUTC.getUTCDay() - 6 + i + 7) % 7],
  );

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
          {/* Today's three — one small, clear ask. */}
          {data.todaysThree.length > 0 ? (
            <section className="mt-2">
              <h2 className="px-1.5 pb-2.5 text-[19px] font-semibold tracking-[-0.015em]">
                {data.todaysThree.length === 1 ? "One for today" : "Today's three"}
              </h2>
              <div className="card overflow-hidden">
                {data.todaysThree.map((move) => (
                  <ListRow
                    key={`${move.kind}-${move.contactId}`}
                    href={`/contacts/${move.contactId}`}
                    leading={<Avatar name={move.contactName} size={42} />}
                    title={<span className="font-medium">{move.contactName}</span>}
                    subtitle={move.reason}
                    subtitleLines={2}
                    value={
                      move.kind === "birthday" ? (
                        <CakeIcon size={18} className="text-pink" />
                      ) : move.kind === "promise" ? (
                        <ChecklistIcon size={18} className="text-label-3" />
                      ) : undefined
                    }
                    chevron
                  />
                ))}
              </div>
            </section>
          ) : (
            <ListSection title="Today">
              <div className="flex items-center gap-3.5 px-4 py-4">
                <Medallion bg="var(--accent-soft)" color="var(--label)">
                  ✓
                </Medallion>
                <div>
                  <p className="text-[16px] font-medium">Nothing waiting on you</p>
                  <p className="text-[13.5px] text-label-2">Your orbit is quiet today.</p>
                </div>
              </div>
            </ListSection>
          )}

          {/* Week pulse — progress, framed as momentum, never as debt. */}
          <section className="mt-5">
            <div className="card flex items-center justify-between bg-surface-dark px-5 py-4 text-on-dark">
              <div>
                <p className="tnum text-[30px] font-bold leading-none tracking-[-0.02em]">
                  {data.weekPulse.total}
                </p>
                <p className="pt-1.5 text-[13px] font-medium text-on-dark-2">
                  {data.weekPulse.total === 0
                    ? "touches this week — one hello starts it"
                    : data.weekPulse.total === 1
                      ? "touch this week"
                      : "touches this week"}
                </p>
              </div>
              <div className="flex items-end gap-[6px]">
                {data.weekPulse.byDay.map((count, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className="w-[11px] rounded-[3px]"
                      style={{
                        height: `${6 + (count / pulseMax) * 30}px`,
                        background:
                          count > 0 ? "var(--accent)" : "rgba(246, 243, 234, 0.13)",
                      }}
                    />
                    <span className="text-[9px] font-medium leading-none text-on-dark-2">
                      {dayLetters[i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {upcomingRest.length > 0 ? (
            <ListSection title="Coming up">
              {upcomingRest.map((event) => (
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

          {overdueRest.length > 0 ? (
            <ListSection title="More good moments">
              {overdueRest.slice(0, 4).map((entry) => (
                <ListRow
                  key={entry.id}
                  href={`/contacts/${entry.id}`}
                  leading={<Avatar name={entry.name} size={42} />}
                  title={<span className="font-medium">{entry.name}</span>}
                  subtitle={`Every ${entry.cadenceDays}d rhythm`}
                  value={
                    <span className="tnum text-[15px] text-label-2">{entry.daysSince}d</span>
                  }
                  chevron
                />
              ))}
            </ListSection>
          ) : null}

          {tasksRest.length > 0 ? (
            <ListSection
              title="Open loops"
              action={
                <Link href="/tasks" className="pressable text-[15px] font-semibold text-tint">
                  All tasks
                </Link>
              }
            >
              {tasksRest.slice(0, 3).map((task) => (
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
                      <span className="text-[14px] text-label-2">
                        {formatDate(task.dueDate, { year: false })}
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
              <p className="px-1.5 pt-2 text-[13px] text-label-2">
                People are gladder to hear from you than you&apos;d expect.
              </p>
            </section>
          ) : null}

          {/* Post-chat capture cue — the habit anchor. */}
          <section className="mt-8">
            <Link
              href="/capture"
              className="card pressable flex items-center gap-3.5 px-4 py-4"
            >
              <Medallion bg="var(--accent)" color="var(--on-accent)">
                <MicIcon size={19} />
              </Medallion>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-medium">Just talked to someone?</p>
                <p className="text-[13.5px] text-label-2">
                  Thirty seconds now saves the details for good.
                </p>
              </div>
            </Link>
          </section>
        </>
      )}
    </Screen>
  );
}
