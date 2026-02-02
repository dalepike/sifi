"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationDropdown } from "./notification-dropdown";
import useSWR from "swr";
import type { NotificationWithItem } from "@/types/domain";

interface NotificationsResponse {
  notifications: NotificationWithItem[];
  unreadCount: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, mutate } = useSWR<NotificationsResponse>(
    "/api/notifications",
    fetcher,
    {
      refreshInterval: 30000, // Poll every 30 seconds
      revalidateOnFocus: true,
    }
  );

  const unreadCount = data?.unreadCount ?? 0;
  const notifications = data?.notifications ?? [];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    // Optimistic update
    mutate(
      {
        notifications: notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, unreadCount - 1),
      },
      false
    );

    try {
      const { markNotificationRead } = await import("@/actions/notifications");
      await markNotificationRead(id);
      mutate(); // Revalidate
    } catch (error) {
      mutate(); // Revert on error
    }
  };

  const handleMarkAllAsRead = async () => {
    // Optimistic update
    mutate(
      {
        notifications: notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      },
      false
    );

    try {
      const { markAllNotificationsRead } = await import("@/actions/notifications");
      await markAllNotificationsRead();
      mutate(); // Revalidate
    } catch (error) {
      mutate(); // Revert on error
    }
  };

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 h-5 min-w-5 px-1 text-xs"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <NotificationDropdown
          ref={dropdownRef}
          notifications={notifications.slice(0, 5)}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
