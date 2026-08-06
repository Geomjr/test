import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/dashboard";
import { aiEnabled } from "@/lib/ai/client";
import { userGreeting, userToday } from "@/lib/today";
import { formatDate, isoToUTC, relativeFuture } from "@/lib/dates";
import { TodaysThree } from "@/components/home/TodaysThree";
import { Screen } from "@/components/ui/Screen";
import { Avatar } from "@/components/ui/Avatar";
import { ListRow, ListSection } from "@/components/ui/List";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import {
  BookIcon,
  CakeIcon,
  CalendarIcon,
  ChecklistIcon,
  ColumnsIcon,
  CupIcon,
  EllipsisCircleIcon,
  MicIcon,
  PeopleIcon,
  SwapIcon,
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
  const greeting = await userGreeting(user.name.split(" ")[0]);
  const aiOn = aiEnabled();
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
      title={greeting}
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
          {/* Today's three — the hero: one small ask, completable in place. */}
          {data.todaysThree.length > 0 ? (
            <section className="mt-2">
              <h2 className="px-1.5 pb-2.5 text-[19px] font-semibold tracking-[-0.015em]">
                {data.todaysThree.length === 1 ? "One for today" : "Today's three"}
              </h2>
              <TodaysThree moves={data.todaysThree} aiOn={aiOn} />
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

          {/* In your pocket — remembered details for today's people. */}
          {data.pocketHooks.length > 0 ? (
            <ListSection title="In your pocket">
              {data.pocketHooks.map((hook) => (
                <ListRow
                  key={hook.contactId}
                  href={`/contacts/${hook.contactId}`}
                  leading={
                    <Medallion bg="var(--accent-soft)" color="var(--label)">
                      <BookIcon size={19} />
                    </Medallion>
                  }
                  title={<span className="whitespace-normal font-medium">{hook.hook}</span>}
                  subtitle={`For ${hook.contactName}`}
                  subtitleLines={2}
                  chevron
                />
              ))}
            </ListSection>
          ) : null}

          {/* Thank-you queue — yesterday's conversations, thanked today. */}
          {data.thankYous.length > 0 ? (
            <ListSection title="Say thanks">
              {data.thankYous.map((item) => (
                <ListRow
                  key={item.contactId}
                  href={
                    aiOn
                      ? `/assistant?q=${encodeURIComponent(
                          `Draft a short thank-you note to ${item.contactName} for our conversation ${item.when}.`,
                        )}`
                      : `/contacts/${item.contactId}`
                  }
                  leading={
                    <Medallion bg="var(--orange-soft)" color="var(--orange)">
                      <CupIcon size={19} />
                    </Medallion>
                  }
                  title={<span className="font-medium">{item.contactName}</span>}
                  subtitle={`You talked ${item.when} — a quick thanks lands best within a day`}
                  subtitleLines={2}
                  value={
                    <span className="rounded-full bg-fill px-3 py-1.5 text-[13px] font-semibold text-label">
                      Say thanks
                    </span>
                  }
                />
              ))}
            </ListSection>
          ) : null}

          {/* Week pulse — a compact strip, deliberately quieter than the hero. */}
          <section className="mt-4">
            <div className="card flex items-center justify-between bg-surface-dark px-4 py-3 text-on-dark">
              <p className="text-[14px] font-medium text-on-dark-2">
                <span className="tnum pr-1.5 text-[20px] font-bold tracking-[-0.02em] text-on-dark">
                  {data.weekPulse.total}
                </span>
                {data.weekPulse.total === 0
                  ? "touches this week — one hello starts it"
                  : data.weekPulse.total === 1
                    ? "touch this week"
                    : "touches this week"}
              </p>
              <div className="flex items-end gap-[5px]">
                {data.weekPulse.byDay.map((count, i) => (
                  <div key={i} className="flex flex-col items-center gap-[3px]">
                    <div
                      className="w-[9px] rounded-[2.5px]"
                      style={{
                        height: `${4 + (count / pulseMax) * 18}px`,
                        background:
                          count > 0 ? "var(--accent)" : "rgba(246, 243, 234, 0.13)",
                      }}
                    />
                    <span className="text-[8px] font-medium leading-none text-on-dark-2">
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

          {/* Give first — an intro only you can make. */}
          {data.introMatch ? (
            <ListSection
              title="Be the connector"
              footer="Giving an intro beats asking for one — it's the opposite of transactional."
            >
              <ListRow
                href={
                  aiOn
                    ? `/assistant?q=${encodeURIComponent(
                        `Should I introduce ${data.introMatch.aName} and ${data.introMatch.bName}? Both are in ${data.introMatch.why}. If yes, draft a short double-opt-in message to each.`,
                      )}`
                    : `/contacts/${data.introMatch.aId}`
                }
                leading={
                  <Medallion bg="var(--teal-soft)" color="var(--teal)">
                    <SwapIcon size={19} />
                  </Medallion>
                }
                title={
                  <span className="font-medium">
                    {data.introMatch.aName} × {data.introMatch.bName}
                  </span>
                }
                subtitle={`Both in ${data.introMatch.why} — worth an intro?`}
                subtitleLines={2}
                chevron
              />
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

          {data.reconnects.filter((s) => !heroContactIds.has(s.id)).length > 0 ? (
            <ListSection
              title="Worth a hello"
              footer="People are gladder to hear from you than you'd expect."
            >
              {data.reconnects
                .filter((s) => !heroContactIds.has(s.id))
                .map((suggestion) => (
                  <ListRow
                    key={suggestion.id}
                    href={`/contacts/${suggestion.id}`}
                    leading={<Avatar name={suggestion.name} size={42} />}
                    title={<span className="font-medium">{suggestion.name}</span>}
                    value={
                      <span className="text-[15px] text-label-2">
                        {suggestion.daysSince >= 7
                          ? `${Math.floor(suggestion.daysSince / 7)} weeks ago`
                          : `${suggestion.daysSince} days ago`}
                      </span>
                    }
                    chevron
                  />
                ))}
            </ListSection>
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
