-- Per-task reminders. `reminder_at` is when to notify the user. Once fired,
-- we stamp `reminder_sent_at` so the same reminder never fires twice. When
-- the user changes `reminder_at`, the app resets `reminder_sent_at` to NULL.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_at      TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- The scheduler scans for "due" reminders every 15 minutes. This index
-- keeps the scan cheap even with many tasks.
CREATE INDEX IF NOT EXISTS idx_tasks_reminder_pending
    ON tasks (reminder_at)
    WHERE reminder_at IS NOT NULL AND reminder_sent_at IS NULL;
