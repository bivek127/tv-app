-- Subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id     UUID        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title       TEXT        NOT NULL,
    completed   BOOLEAN     NOT NULL DEFAULT false,
    position    INTEGER     NOT NULL DEFAULT 0,
    created_at  TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
