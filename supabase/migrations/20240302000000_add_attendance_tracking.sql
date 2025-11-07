-- Add attendance_day column to achievements table
ALTER TABLE achievements 
  ADD COLUMN IF NOT EXISTS attendance_day DATE;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_achievements_event_attendance 
  ON achievements(event_id, user_id, attendance_day) 
  WHERE event_id IS NOT NULL;

-- Add unique constraint to prevent duplicate attendance per day
-- Note: This will fail if there are existing duplicates. Handle those first if needed.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_daily_attendance'
  ) THEN
    ALTER TABLE achievements
      ADD CONSTRAINT unique_daily_attendance 
      UNIQUE (event_id, user_id, attendance_day);
  END IF;
END $$;

