"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/actions/notifications";
import type { NotificationWithItem } from "@/types/domain";

interface NotificationsListProps {
  initialNotifications: NotificationWithItem[];
}

export function NotificationsList({
  initialNotifications,
}: NotificationsListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );

    const result = await markNotificationRead(id);
    if (!result.success) {
      // Revert on error
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    const previousNotifications = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    const result = await markAllNotificationsRead();
    if (!result.success) {
      setNotifications(previousNotifications);
    }
  };

  const handleDelete = async (id: string) => {
    const previousNotifications = notifications;
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    const result = await deleteNotification(id);
    if (!result.success) {
      setNotifications(previousNotifications);
    }
  };

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Bell className="h-12 w-12 text-muted-foreground opacity-50" />
          <div className="text-center">
            <p className="font-medium">No notifications</p>
            <p className="text-sm text-muted-foreground">
              You'll see reminders about warranties and maintenance here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <Check className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onMarkAsRead={() => handleMarkAsRead(notification.id)}
            onDelete={() => handleDelete(notification.id)}
          />
        ))}
      </div>
    </div>
  );
}

function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: NotificationWithItem;
  onMarkAsRead: () => void;
  onDelete: () => void;
}) {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  const typeLabels: Record<string, string> = {
    warranty_expiration: "Warranty",
    maintenance_due: "Maintenance",
    custom_reminder: "Reminder",
  };

  return (
    <Card
      className={cn(
        "transition-colors",
        !notification.isRead && "border-accent bg-accent/5"
      )}
    >
      <CardContent className="flex items-start gap-4 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={notification.isRead ? "secondary" : "accent"}>
              {typeLabels[notification.type] || notification.type}
            </Badge>
            {!notification.isRead && (
              <span className="h-2 w-2 rounded-full bg-accent" />
            )}
          </div>

          {notification.item ? (
            <Link
              href={`/items/${notification.item.id}`}
              onClick={() => !notification.isRead && onMarkAsRead()}
              className="block hover:underline"
            >
              <p className="font-medium">{notification.title}</p>
              <p className="text-sm text-muted-foreground">
                {notification.item.name}
              </p>
            </Link>
          ) : (
            <p className="font-medium">{notification.title}</p>
          )}

          {notification.message && (
            <p className="text-sm text-muted-foreground mt-1">
              {notification.message}
            </p>
          )}

          <p className="text-xs text-muted-foreground mt-2">{timeAgo}</p>
        </div>

        <div className="flex items-center gap-1">
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onMarkAsRead}
              aria-label="Mark as read"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label="Delete notification"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
