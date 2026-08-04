import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { listTasks } from "@/lib/data/tasks";
import { listContacts } from "@/lib/data/contacts";
import { userToday } from "@/lib/today";
import { Screen } from "@/components/ui/Screen";
import { TasksScreen } from "@/components/tasks/TasksScreen";

export const metadata = { title: "Tasks" };

export default async function TasksPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const today = await userToday();
  const tasks = listTasks(user.id).map((t) => ({
    id: t.id,
    title: t.title,
    dueDate: t.dueDate,
    completedAt: t.completedAt,
    contactId: t.contactId,
    contactName: t.contactName,
  }));
  const contacts = listContacts(user.id).map((c) => ({ id: c.id, name: c.name }));

  return (
    <Screen title="Tasks">
      <TasksScreen tasks={tasks} today={today} contacts={contacts} />
    </Screen>
  );
}
