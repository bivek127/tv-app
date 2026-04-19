-- Projects table: users organize tasks into projects.
CREATE TABLE IF NOT EXISTS projects (
    id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT      NOT NULL,
    description TEXT,
    color       TEXT      NOT NULL DEFAULT '#6366f1',
    icon        TEXT,
    is_default  BOOLEAN   NOT NULL DEFAULT false,
    position    INTEGER   NOT NULL DEFAULT 0,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
