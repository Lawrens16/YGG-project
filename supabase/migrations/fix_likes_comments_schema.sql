-- Migration: Fix likes and comments tables to use achievement_id
-- Run this in Supabase SQL Editor
-- This will work regardless of current table structure

-- Step 1: Ensure achievements table exists
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('academic', 'leadership', 'technology', 'community', 'sports', 'arts')),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  proof_hash TEXT,
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_at TIMESTAMPTZ,
  verifier_address TEXT,
  sui_transaction_id TEXT,
  sui_object_id TEXT,
  points_awarded INTEGER DEFAULT 0,
  tags TEXT[],
  event_id UUID REFERENCES events(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Fix likes table
-- Drop old constraints
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_post_id_fkey;
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_post_id_user_id_key;
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_achievement_id_user_id_key;

-- Add achievement_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'likes' AND column_name = 'achievement_id'
  ) THEN
    ALTER TABLE likes ADD COLUMN achievement_id UUID;
  END IF;
END $$;

-- If post_id exists and achievement_id is empty, copy data (optional - only if you want to migrate existing data)
-- This is commented out - uncomment if you have existing post_id data to migrate
-- UPDATE likes SET achievement_id = post_id WHERE achievement_id IS NULL AND post_id IS NOT NULL;

-- Drop post_id column if it exists (after ensuring achievement_id is set)
-- ALTER TABLE likes DROP COLUMN IF EXISTS post_id;

-- Add foreign key constraint
ALTER TABLE likes
  DROP CONSTRAINT IF EXISTS likes_achievement_id_fkey;

ALTER TABLE likes
  ADD CONSTRAINT likes_achievement_id_fkey 
  FOREIGN KEY (achievement_id) 
  REFERENCES achievements(id) 
  ON DELETE CASCADE;

-- Add unique constraint
ALTER TABLE likes
  ADD CONSTRAINT likes_achievement_id_user_id_key 
  UNIQUE (achievement_id, user_id);

-- Step 3: Fix comments table
-- Drop old constraints
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_post_id_fkey;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_achievement_id_fkey;

-- Add achievement_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'achievement_id'
  ) THEN
    ALTER TABLE comments ADD COLUMN achievement_id UUID;
  END IF;
END $$;

-- If post_id exists and achievement_id is empty, copy data (optional)
-- UPDATE comments SET achievement_id = post_id WHERE achievement_id IS NULL AND post_id IS NOT NULL;

-- Drop post_id column if it exists
-- ALTER TABLE comments DROP COLUMN IF EXISTS post_id;

-- Add foreign key constraint
ALTER TABLE comments
  ADD CONSTRAINT comments_achievement_id_fkey 
  FOREIGN KEY (achievement_id) 
  REFERENCES achievements(id) 
  ON DELETE CASCADE;

-- Step 4: Drop unused tables
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS reactions CASCADE;

