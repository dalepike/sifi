"use client";

import { useState, useMemo } from "react";
import { Bell, Plus, Pencil, Trash2, Settings, Wrench, Repeat } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReminderFormDialog } from "./reminder-form-dialog";
import { deleteItemReminder } from "@/actions/notifications";
import type { Notification } from "@/types/domain";

interface ReminderListProps {
  itemId: string;
  reminders: Notification[];
  onRemindersChange: () => void;
}

export function ReminderList({
  itemId,
  reminders,
  onRemindersChange,
}: ReminderListProps) {
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Notification | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Memoize formatted reminders
  const formattedReminders = useMemo(() =>
    reminders.map(r => ({
      ...r,
      formattedDate: format(new Date(r.triggerDate), "MMM d, yyyy"),
      formattedTime: format(new Date(r.triggerDate), "h:mm a"),
      isCustom: r.type === "custom_reminder",
      isRecurring: r.recurrenceType !== "one-time",
    })),
    [reminders]
  );

  const handleEdit = (reminder: Notification) => {
    setEditingReminder(reminder);
    setFormDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    const result = await deleteItemReminder(deletingId);
    setDeleting(false);
    setDeleteDialogOpen(false);
    setDeletingId(null);
    if (result.success) {
      onRemindersChange();
    }
  };

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleFormSuccess = () => {
    setFormDialogOpen(false);
    setEditingReminder(null);
    onRemindersChange();
  };

  const handleFormClose = (open: boolean) => {
    setFormDialogOpen(open);
    if (!open) {
      setEditingReminder(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "custom_reminder":
        return <Bell className="h-4 w-4 text-primary" />;
      case "warranty_expiration":
        return <Settings className="h-4 w-4 text-muted-foreground" />;
      case "maintenance_due":
        return <Wrench className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRecurrenceLabel = (recurrenceType: string) => {
    switch (recurrenceType) {
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      case "monthly":
        return "Monthly";
      case "yearly":
        return "Yearly";
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Bell className="h-4 w-4" />
          Reminders
          {reminders.length > 0 && (
            <span className="text-muted-foreground">({reminders.length})</span>
          )}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFormDialogOpen(true)}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Reminder list */}
      {formattedReminders.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
          No reminders set.
          <br />
          <span className="text-xs">
            Add reminders for maintenance, warranty expiration, or custom alerts.
          </span>
        </p>
      ) : (
        <div className="space-y-2">
          {formattedReminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center gap-3 rounded-md border p-3 hover:bg-accent/50 transition-colors"
            >
              {/* Type icon */}
              {getTypeIcon(reminder.type)}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{reminder.title}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{reminder.formattedDate}</span>
                  <span className="text-xs">{reminder.formattedTime}</span>
                  {reminder.isRecurring && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Repeat className="h-3 w-3" />
                      {getRecurrenceLabel(reminder.recurrenceType)}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Type badge for auto-generated */}
              {!reminder.isCustom && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  Auto
                </Badge>
              )}

              {/* Actions - only for custom reminders */}
              {reminder.isCustom && (
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(reminder)}
                    title="Edit reminder"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => confirmDelete(reminder.id)}
                    title="Delete reminder"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form dialog for create/edit */}
      <ReminderFormDialog
        open={formDialogOpen}
        onOpenChange={handleFormClose}
        itemId={itemId}
        reminder={editingReminder}
        onSuccess={handleFormSuccess}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reminder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reminder? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
