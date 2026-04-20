-- Add project_id to tasks.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- Backfill existing tasks into each user's default project. Depends on
-- ensureDefaultProject having been run (or the projects migration 013 + a
-- login/register cycle) for every user who owns tasks.
UPDATE tasks t
SET project_id = (
    SELECT p.id FROM projects p
    WHERE p.user_id = t.user_id
      AND p.is_default = true
    LIMIT 1
)
WHERE t.project_id IS NULL;

-- Enforce the invariant now that all existing rows are backfilled.
ALTER TABLE tasks ALTER COLUMN project_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
