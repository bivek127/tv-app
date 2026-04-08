-- Create activity_logs table for tracking user actions
CREATE TABLE IF NOT EXISTS activity_logs (
    id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID      REFERENCES users(id) ON DELETE CASCADE,
    action      TEXT      NOT NULL,
    entity_type TEXT,
    entity_id   UUID,
    metadata    JSONB,
    created_at  TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
