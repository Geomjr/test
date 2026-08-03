"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-api";
import { ActionSheet } from "@/components/ui/ActionSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sheet } from "@/components/ui/Sheet";
import { FormCard, SelectField, TextField } from "@/components/ui/fields";
import { CheckCircleIcon, ChecklistIcon, CircleIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/dates";

export type TaskItem = {
  id: string;
  title: string;
  dueDate: string | null;
  completedAt: number | null;
  contactId: string | null;
  contactName: string | null;
};

export function TasksScreen({
  tasks,
  today,
  contacts,
}: {
  tasks: TaskItem[];
  today: string;
  contacts: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [menuFor, setMenuFor] = useState<TaskItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [contactId, setContactId] = useState("");
  const [showDone, setShowDone] = useState(false);

  const open = tasks.filter((t) => !t.completedAt);
  const done = tasks.filter((t) => t.completedAt);

  const sections: { label: string; items: TaskItem[] }[] = [
    { label: "Overdue", items: open.filter((t) => t.dueDate !== null && t.dueDate < today) },
    { label: "Today", items: open.filter((t) => t.dueDate === today) },
    { label: "Upcoming", items: open.filter((t) => t.dueDate !== null && t.dueDate > today) },
    { label: "Someday", items: open.filter((t) => t.dueDate === null) },
  ].filter((section) => section.items.length > 0);

  async function toggle(task: TaskItem) {
    await api(`/api/tasks/${task.id}`, {
      method: "PATCH",
      json: { completed: !task.completedAt },
    });
    router.refresh();
  }

  return (
    <div>
      {tasks.length === 0 ? (
        <EmptyState
          icon={<ChecklistIcon size={44} />}
          title="No tasks"
          subtitle="Capture follow-ups — “send the deck”, “intro Jenny to Daniel” — with due dates so they surface on Today."
        />
      ) : (
        <>
          {sections.map((section) => (
            <section key={section.label} className="mt-6 first:mt-1">
              <h2
                className={`px-4 pb-1.5 text-[13px] font-medium uppercase tracking-[0.04em] ${
                  section.label === "Overdue" ? "text-red" : "text-label-2"
                }`}
              >
                {section.label}
              </h2>
              <div className="overflow-hidden rounded-[10px] bg-card">
                {section.items.map((task) => (
                  <TaskRowView
                    key={task.id}
                    task={task}
                    today={today}
                    onToggle={() => void toggle(task)}
                    onMenu={() => setMenuFor(task)}
                  />
                ))}
              </div>
            </section>
          ))}

          {done.length > 0 ? (
            <section className="mt-6">
              <button
                type="button"
                onClick={() => setShowDone((v) => !v)}
                className="pressable px-4 pb-1.5 text-[13px] font-medium uppercase tracking-[0.04em] text-label-2"
              >
                Completed · {done.length} {showDone ? "▾" : "▸"}
              </button>
              {showDone ? (
                <div className="overflow-hidden rounded-[10px] bg-card">
                  {done.map((task) => (
                    <TaskRowView
                      key={task.id}
                      task={task}
                      today={today}
                      onToggle={() => void toggle(task)}
                      onMenu={() => setMenuFor(task)}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}
        </>
      )}

      {/* floating add button (mobile) */}
      <button
        type="button"
        aria-label="New task"
        onClick={() => {
          setTitle("");
          setDue("");
          setContactId("");
          setAddOpen(true);
        }}
        className="pressable fixed right-5 z-40 flex h-[54px] w-[54px] items-center justify-center rounded-full bg-tint text-white shadow-lg lg:right-10"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 66px)" }}
      >
        <span className="text-[28px] leading-none">＋</span>
      </button>

      <ActionSheet
        open={menuFor !== null}
        onClose={() => setMenuFor(null)}
        title={menuFor?.title}
        actions={[
          ...(menuFor?.contactId
            ? [
                {
                  label: `Open ${menuFor.contactName ?? "contact"}`,
                  onSelect: () => router.push(`/contacts/${menuFor.contactId}`),
                },
              ]
            : []),
          {
            label: "Delete Task",
            destructive: true,
            onSelect: () => {
              if (!menuFor) return;
              void api(`/api/tasks/${menuFor.id}`, { method: "DELETE" }).then(() =>
                router.refresh(),
              );
            },
          },
        ]}
      />

      <Sheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="New Task"
        right={
          <button
            type="button"
            disabled={!title.trim()}
            className="pressable px-3 text-[17px] font-semibold text-tint disabled:opacity-40"
            onClick={() => {
              void api("/api/tasks", {
                json: { title, dueDate: due || null, contactId: contactId || null },
              }).then(() => {
                setAddOpen(false);
                router.refresh();
              });
            }}
          >
            Add
          </button>
        }
      >
        <FormCard>
          <TextField
            label="Task"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs doing?"
            autoFocus
          />
          <TextField label="Due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          <SelectField
            label="Person"
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
          >
            <option value="">Nobody specific</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))}
          </SelectField>
        </FormCard>
      </Sheet>
    </div>
  );
}

function TaskRowView({
  task,
  today,
  onToggle,
  onMenu,
}: {
  task: TaskItem;
  today: string;
  onToggle: () => void;
  onMenu: () => void;
}) {
  const overdue = !task.completedAt && task.dueDate !== null && task.dueDate < today;
  return (
    <div className="hairline-b last:after:hidden flex min-h-[48px] items-center gap-3 px-4 py-1.5">
      <button
        type="button"
        aria-label={task.completedAt ? "Mark incomplete" : "Mark complete"}
        onClick={onToggle}
        className={`pressable shrink-0 ${task.completedAt ? "text-green" : "text-label-3"}`}
      >
        {task.completedAt ? <CheckCircleIcon size={23} /> : <CircleIcon size={23} />}
      </button>
      <button type="button" onClick={onMenu} className="min-w-0 flex-1 py-1 text-left">
        <span
          className={`block text-[16px] ${task.completedAt ? "text-label-3 line-through" : ""}`}
        >
          {task.title}
        </span>
        <span className="flex gap-2 text-[13px] text-label-2">
          {task.contactName ? (
            <Link
              href={`/contacts/${task.contactId}`}
              onClick={(e) => e.stopPropagation()}
              className="text-tint"
            >
              {task.contactName}
            </Link>
          ) : null}
          {task.dueDate ? (
            <span className={overdue ? "text-red" : ""}>
              {formatDate(task.dueDate, { year: false })}
            </span>
          ) : null}
        </span>
      </button>
    </div>
  );
}
