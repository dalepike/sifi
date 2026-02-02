import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getNotifications, getUnreadCount } from "@/lib/db/notifications";
import { NotificationsList } from "./notifications-list";

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [notifications, unreadCount] = await Promise.all([
    getNotifications(session.user.id, { limit: 50 }),
    getUnreadCount(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "You're all caught up"}
          </p>
        </div>
      </div>

      <NotificationsList initialNotifications={notifications} />
    </div>
  );
}
