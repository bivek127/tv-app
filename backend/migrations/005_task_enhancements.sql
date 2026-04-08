-- Add priority, status, and due_date columns to tasks table
ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium',
    ADD COLUMN IF NOT EXISTS status   TEXT NOT NULL DEFAULT 'todo',
    ADD COLUMN IF NOT EXISTS due_date DATE;

CREATE INDEX IF NOT EXISTS idx_tasks_status   ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
