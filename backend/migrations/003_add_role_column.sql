-- Add role column to users table for RBAC
-- Default is 'user'; admins must be promoted manually via SQL
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
