-- Add thank you tracking to contributions
ALTER TABLE contributions
  ADD COLUMN IF NOT EXISTS thanked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS thank_you_note TEXT;
