"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateNotificationPreferences } from "@/actions/notifications";
import type { NotificationPreferences } from "@/types/domain";

interface NotificationSettingsProps {
  initialPreferences: NotificationPreferences;
}

export function NotificationSettings({
  initialPreferences,
}: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    const formData = new FormData();
    formData.set(
      "warrantyReminderDays",
      String(preferences.warrantyReminderDays)
    );
    formData.set(
      "maintenanceReminderDays",
      String(preferences.maintenanceReminderDays)
    );
    formData.set(
      "notificationsEnabled",
      String(preferences.notificationsEnabled)
    );

    const result = await updateNotificationPreferences(formData);

    if (result.success) {
      setMessage({ type: "success", text: "Settings saved" });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: "error", text: result.error });
    }

    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="notifications-enabled">Enable notifications</Label>
          <p className="text-sm text-muted-foreground">
            Receive reminders about warranties and maintenance
          </p>
        </div>
        <Switch
          id="notifications-enabled"
          checked={preferences.notificationsEnabled}
          onCheckedChange={(checked) =>
            setPreferences((prev) => ({
              ...prev,
              notificationsEnabled: checked,
            }))
          }
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="warranty-days">Warranty reminder</Label>
          <div className="flex items-center gap-2">
            <Input
              id="warranty-days"
              type="number"
              min={1}
              max={365}
              value={preferences.warrantyReminderDays}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  warrantyReminderDays: Math.max(
                    1,
                    Math.min(365, parseInt(e.target.value) || 30)
                  ),
                }))
              }
              className="w-24"
              disabled={!preferences.notificationsEnabled}
            />
            <span className="text-sm text-muted-foreground">
              days before expiration
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maintenance-days">Maintenance reminder</Label>
          <div className="flex items-center gap-2">
            <Input
              id="maintenance-days"
              type="number"
              min={1}
              max={365}
              value={preferences.maintenanceReminderDays}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  maintenanceReminderDays: Math.max(
                    1,
                    Math.min(365, parseInt(e.target.value) || 7)
                  ),
                }))
              }
              className="w-24"
              disabled={!preferences.notificationsEnabled}
            />
            <span className="text-sm text-muted-foreground">
              days before due
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save settings"}
        </Button>
        {message && (
          <p
            className={`text-sm ${
              message.type === "success"
                ? "text-green-600 dark:text-green-400"
                : "text-destructive"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
