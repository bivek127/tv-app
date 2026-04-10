-- Remove unused completed column — status is the source of truth
ALTER TABLE tasks DROP COLUMN IF EXISTS completed;
