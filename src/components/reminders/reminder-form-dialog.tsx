"use client";

import { useState, useEffect } from "react";
import { format, addDays, addWeeks, addMonths } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { createCustomReminder, updateItemReminder } from "@/actions/notifications";
import type { Notification, RecurrenceConfig, RecurrenceFrequency } from "@/types/domain";

interface ReminderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  reminder?: Notification | null;
  onSuccess: () => void;
}

// Quick preset options
const quickPresets = [
  { label: "Tomorrow", getValue: () => addDays(new Date(), 1) },
  { label: "Next week", getValue: () => addWeeks(new Date(), 1) },
  { label: "In 2 weeks", getValue: () => addWeeks(new Date(), 2) },
  { label: "Next month", getValue: () => addMonths(new Date(), 1) },
];

export function ReminderFormDialog({
  open,
  onOpenChange,
  itemId,
  reminder,
  onSuccess,
}: ReminderFormDialogProps) {
  const isEditing = !!reminder;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("09:00");
  const [recurrenceType, setRecurrenceType] = useState<"one-time" | RecurrenceFrequency>("one-time");
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Reset form when dialog opens/closes or reminder changes
  useEffect(() => {
    if (open) {
      if (reminder) {
        setTitle(reminder.title);
        setMessage(reminder.message || "");
        const triggerDate = new Date(reminder.triggerDate);
        setDate(triggerDate);
        setTime(format(triggerDate, "HH:mm"));
        // Convert database format back to form format
        if (reminder.recurrenceType === "one-time") {
          setRecurrenceType("one-time");
        } else {
          setRecurrenceType(reminder.recurrenceType as RecurrenceFrequency);
        }
        setEndDate(reminder.recurrenceEndDate ? new Date(reminder.recurrenceEndDate) : undefined);
      } else {
        setTitle("");
        setMessage("");
        setDate(undefined);
        setTime("09:00");
        setRecurrenceType("one-time");
        setEndDate(undefined);
      }
      setError(null);
    }
  }, [open, reminder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!date) {
      setError("Date is required");
      return;
    }

    // Combine date and time
    const [hours, minutes] = time.split(":").map(Number);
    const triggerDate = new Date(date);
    triggerDate.setHours(hours ?? 9, minutes ?? 0, 0, 0);

    // Validate future date
    if (triggerDate <= new Date()) {
      setError("Reminder date must be in the future");
      return;
    }

    // Build recurrence config
    const recurrence: RecurrenceConfig = recurrenceType === "one-time"
      ? { type: "one-time" }
      : { type: "recurring", frequency: recurrenceType, endDate: endDate?.toISOString() ?? null };

    setSaving(true);

    try {
      if (isEditing && reminder) {
        const result = await updateItemReminder({
          id: reminder.id,
          title: title.trim(),
          message: message.trim() || undefined,
          triggerDate: triggerDate.toISOString(),
          recurrence,
        });

        if (!result.success) {
          setError(result.error);
          setSaving(false);
          return;
        }
      } else {
        const result = await createCustomReminder({
          itemId,
          title: title.trim(),
          message: message.trim() || undefined,
          triggerDate: triggerDate.toISOString(),
          recurrence,
        });

        if (!result.success) {
          setError(result.error);
          setSaving(false);
          return;
        }
      }

      setSaving(false);
      onSuccess();
    } catch {
      setError("An unexpected error occurred");
      setSaving(false);
    }
  };

  const handleQuickPreset = (getValue: () => Date) => {
    const presetDate = getValue();
    setDate(presetDate);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Reminder" : "Add Reminder"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your reminder details below."
              : "Create a reminder for this item. You'll be notified when it's due."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Check furnace filter"
              autoFocus
            />
          </div>

          {/* Message (optional) */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Additional details..."
              rows={2}
            />
          </div>

          {/* Quick presets */}
          {!isEditing && (
            <div className="space-y-2">
              <Label>Quick Select</Label>
              <div className="flex flex-wrap gap-2">
                {quickPresets.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickPreset(preset.getValue)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Date picker */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time picker */}
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>

          {/* Recurrence */}
          <div className="space-y-2">
            <Label>Repeat</Label>
            <Select
              value={recurrenceType}
              onValueChange={(value) => setRecurrenceType(value as typeof recurrenceType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one-time">Does not repeat</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* End date for recurring */}
          {recurrenceType !== "one-time" && (
            <div className="space-y-2">
              <Label>End Date (optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "No end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(d) => d < (date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {endDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEndDate(undefined)}
                  className="text-xs"
                >
                  Clear end date
                </Button>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Reminder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
