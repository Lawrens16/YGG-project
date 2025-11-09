-- Add pinned_milestones column to user_profiles table
-- This stores an array of milestone IDs that the user has pinned to their profile

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS pinned_milestones TEXT[] DEFAULT '{}';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_pinned_milestones 
  ON user_profiles USING GIN (pinned_milestones);

