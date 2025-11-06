-- Migration: Update likes and comments to reference achievements table
-- Run this in Supabase SQL Editor

-- Step 0: Create achievements table if it doesn't exist
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

-- Step 1: Update likes table to use achievement_id instead of post_id
-- First, drop the existing foreign key constraint if it exists
ALTER TABLE likes 
  DROP CONSTRAINT IF EXISTS likes_post_id_fkey;

-- Check if post_id column exists, if so rename it
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'likes' AND column_name = 'post_id'
  ) THEN
    ALTER TABLE likes RENAME COLUMN post_id TO achievement_id;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'likes' AND column_name = 'achievement_id'
  ) THEN
    -- If neither exists, add achievement_id column
    ALTER TABLE likes ADD COLUMN achievement_id UUID;
  END IF;
END $$;

-- Add foreign key constraint to achievements table
ALTER TABLE likes
  DROP CONSTRAINT IF EXISTS likes_achievement_id_fkey;

ALTER TABLE likes
  ADD CONSTRAINT likes_achievement_id_fkey 
  FOREIGN KEY (achievement_id) 
  REFERENCES achievements(id) 
  ON DELETE CASCADE;

-- Update the unique constraint to use achievement_id
ALTER TABLE likes
  DROP CONSTRAINT IF EXISTS likes_post_id_user_id_key;

ALTER TABLE likes
  DROP CONSTRAINT IF EXISTS likes_achievement_id_user_id_key;

ALTER TABLE likes
  ADD CONSTRAINT likes_achievement_id_user_id_key 
  UNIQUE (achievement_id, user_id);

-- Step 2: Update comments table to use achievement_id instead of post_id
-- Drop the existing foreign key constraint if it exists
ALTER TABLE comments 
  DROP CONSTRAINT IF EXISTS comments_post_id_fkey;

-- Check if post_id column exists, if so rename it
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'post_id'
  ) THEN
    ALTER TABLE comments RENAME COLUMN post_id TO achievement_id;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'achievement_id'
  ) THEN
    -- If neither exists, add achievement_id column
    ALTER TABLE comments ADD COLUMN achievement_id UUID;
  END IF;
END $$;

-- Add foreign key constraint to achievements table
ALTER TABLE comments
  DROP CONSTRAINT IF EXISTS comments_achievement_id_fkey;

ALTER TABLE comments
  ADD CONSTRAINT comments_achievement_id_fkey 
  FOREIGN KEY (achievement_id) 
  REFERENCES achievements(id) 
  ON DELETE CASCADE;

-- Step 3: Drop unused/redundant tables
-- Drop the posts table (redundant with achievements)
DROP TABLE IF EXISTS posts CASCADE;

-- Drop reactions table if it exists (redundant with likes)
DROP TABLE IF EXISTS reactions CASCADE;

