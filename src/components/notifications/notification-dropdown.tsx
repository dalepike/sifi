"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NotificationWithItem } from "@/types/domain";

interface NotificationDropdownProps {
  notifications: NotificationWithItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

export const NotificationDropdown = forwardRef<
  HTMLDivElement,
  NotificationDropdownProps
>(function NotificationDropdown(
  { notifications, onMarkAsRead, onMarkAllAsRead, onClose },
  ref
) {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border bg-popover shadow-lg"
    >
      <div className="flex items-center justify-between border-b p-3">
        <h3 className="font-semibold">Notifications</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllAsRead}
            className="h-7 text-xs"
          >
            <Check className="mr-1 h-3 w-3" />
            Mark all read
          </Button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
            <Bell className="h-8 w-8 opacity-50" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={() => onMarkAsRead(notification.id)}
              onClose={onClose}
            />
          ))
        )}
      </div>

      <div className="border-t p-2">
        <Link
          href="/notifications"
          onClick={onClose}
          className="flex w-full items-center justify-center gap-1 rounded-md py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          View all notifications
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
});

function NotificationItem({
  notification,
  onMarkAsRead,
  onClose,
}: {
  notification: NotificationWithItem;
  onMarkAsRead: () => void;
  onClose: () => void;
}) {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  return (
    <div
      className={cn(
        "flex items-start gap-3 border-b p-3 last:border-b-0",
        !notification.isRead && "bg-accent/30"
      )}
    >
      <div className="flex-1 min-w-0">
        {notification.item ? (
          <Link
            href={`/items/${notification.item.id}`}
            onClick={() => {
              if (!notification.isRead) onMarkAsRead();
              onClose();
            }}
            className="block"
          >
            <p className="font-medium text-sm truncate">{notification.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {notification.item.name}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
          </Link>
        ) : (
          <div>
            <p className="font-medium text-sm">{notification.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
          </div>
        )}
      </div>

      {!notification.isRead && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onMarkAsRead}
          className="shrink-0"
          aria-label="Mark as read"
        >
          <Check className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
