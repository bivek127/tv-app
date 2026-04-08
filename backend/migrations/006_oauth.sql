-- Unique index on (provider, provider_id) for fast OAuth user lookup
-- Excludes local users where provider_id is null
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider_provider_id
    ON users (provider, provider_id)
    WHERE provider_id IS NOT NULL;
