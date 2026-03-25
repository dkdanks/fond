-- Add extra columns to guests table
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Migrate existing name data: split on first space
UPDATE guests
SET
  first_name = CASE WHEN position(' ' IN name) > 0 THEN left(name, position(' ' IN name) - 1) ELSE name END,
  last_name = CASE WHEN position(' ' IN name) > 0 THEN right(name, length(name) - position(' ' IN name)) ELSE '' END
WHERE first_name IS NULL;
