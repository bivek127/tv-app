-- Notification preferences: one row per user.
CREATE TABLE IF NOT EXISTS notification_preferences (
    id              SERIAL PRIMARY KEY,
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email_enabled   BOOLEAN NOT NULL DEFAULT false,
    push_enabled    BOOLEAN NOT NULL DEFAULT false,
    remind_days_before INTEGER[] NOT NULL DEFAULT '{1}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id
    ON notification_preferences(user_id);

-- Push subscriptions: one user can have many devices.
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id         SERIAL PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint   TEXT NOT NULL UNIQUE,
    p256dh     TEXT NOT NULL,
    auth       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
    ON push_subscriptions(user_id);
