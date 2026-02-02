-- Migration: Add recurrence support to notifications
-- Date: 2026-02-02

-- Add recurrence fields to notifications table
ALTER TABLE notifications ADD COLUMN recurrence_type TEXT
  CHECK (recurrence_type IN ('one-time', 'daily', 'weekly', 'monthly', 'yearly'))
  DEFAULT 'one-time';

ALTER TABLE notifications ADD COLUMN recurrence_end_date TIMESTAMPTZ;

-- CRITICAL: Drop existing unique index that blocks recurring notifications
-- The existing (item_id, type, trigger_date) constraint prevents multiple instances
DROP INDEX IF EXISTS notifications_item_type_date_idx;

-- Index for cron job efficiency (pending notifications)
CREATE INDEX IF NOT EXISTS idx_notifications_pending
  ON notifications(trigger_date, is_read)
  WHERE is_read = false;

-- Index for getItemReminders(itemId) query
CREATE INDEX IF NOT EXISTS idx_notifications_item_id
  ON notifications(item_id)
  WHERE item_id IS NOT NULL;

-- Index for recurring notification processing
CREATE INDEX IF NOT EXISTS idx_notifications_recurring_due
  ON notifications(trigger_date, recurrence_type)
  WHERE recurrence_type != 'one-time';
