"use client";

import { Archive } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getIconComponent } from "./activity-form-dialog";
import type { Activity } from "@/types/domain";

interface ActivityCardProps {
  activity: Activity;
  isSelected?: boolean;
  onClick?: () => void;
}

export function ActivityCard({ activity, isSelected, onClick }: ActivityCardProps) {
  const ActivityIconComponent = getIconComponent(activity.icon);

  return (
    <Card
      className={cn(
        "cursor-pointer transition-colors hover:bg-accent",
        isSelected && "ring-2 ring-primary",
        activity.status === "archived" && "opacity-60"
      )}
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-3 py-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: activity.color }}
        >
          {activity.status === "archived" ? (
            <Archive className="h-5 w-5 text-white" />
          ) : (
            <ActivityIconComponent className="h-5 w-5 text-white" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{activity.name}</p>
            {activity.status === "archived" && (
              <Badge variant="secondary" className="shrink-0">
                Archived
              </Badge>
            )}
          </div>
          {activity.description && (
            <p className="truncate text-sm text-muted-foreground">
              {activity.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
