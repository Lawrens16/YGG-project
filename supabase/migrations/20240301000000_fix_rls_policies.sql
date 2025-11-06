-- Fix RLS Policies for Wallet-Based Authentication
-- This migration fixes RLS policies to work with wallet-based auth (not Supabase Auth)
-- Run this in Supabase SQL Editor

-- IMPORTANT: If you're still getting RLS errors after this, try running:
-- supabase/migrations/20240301000002_fix_rls_comprehensive.sql
-- which uses a more aggressive approach

-- Drop existing policies if they exist (to avoid conflicts)
-- Only drop policies for tables that exist

DO $$
BEGIN
  -- User Profiles
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    DROP POLICY IF EXISTS "Enable all for user_profiles" ON user_profiles;
    DROP POLICY IF EXISTS "Allow all operations on user_profiles" ON user_profiles;
  END IF;

  -- Achievements
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'achievements') THEN
    DROP POLICY IF EXISTS "Enable all for achievements" ON achievements;
    DROP POLICY IF EXISTS "Allow all operations on achievements" ON achievements;
  END IF;

  -- Peer Tags
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'peer_tags') THEN
    DROP POLICY IF EXISTS "Enable all for peer_tags" ON peer_tags;
    DROP POLICY IF EXISTS "Allow all operations on peer_tags" ON peer_tags;
  END IF;

  -- Friendships
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'friendships') THEN
    DROP POLICY IF EXISTS "Enable all for friendships" ON friendships;
    DROP POLICY IF EXISTS "Allow all operations on friendships" ON friendships;
  END IF;

  -- Comments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
    DROP POLICY IF EXISTS "Enable all for comments" ON comments;
    DROP POLICY IF EXISTS "Allow all operations on comments" ON comments;
  END IF;

  -- Reactions (table doesn't exist in your schema, so skip)
  -- IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reactions') THEN
  --   DROP POLICY IF EXISTS "Enable all for reactions" ON reactions;
  --   DROP POLICY IF EXISTS "Allow all operations on reactions" ON reactions;
  -- END IF;

  -- Events
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
    DROP POLICY IF EXISTS "Enable all for events" ON events;
    DROP POLICY IF EXISTS "Allow all operations on events" ON events;
  END IF;

  -- Event Registrations
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_registrations') THEN
    DROP POLICY IF EXISTS "Enable all for event_registrations" ON event_registrations;
    DROP POLICY IF EXISTS "Allow all operations on event_registrations" ON event_registrations;
  END IF;

  -- Followers
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'followers') THEN
    DROP POLICY IF EXISTS "Enable all for followers" ON followers;
    DROP POLICY IF EXISTS "Allow all operations on followers" ON followers;
  END IF;

  -- Badge Templates
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'badge_templates') THEN
    DROP POLICY IF EXISTS "Enable all for badge_templates" ON badge_templates;
    DROP POLICY IF EXISTS "Allow all operations on badge_templates" ON badge_templates;
  END IF;

  -- Attendees
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendees') THEN
    DROP POLICY IF EXISTS "Enable all for attendees" ON attendees;
    DROP POLICY IF EXISTS "Allow all operations on attendees" ON attendees;
  END IF;

  -- Badges
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'badges') THEN
    DROP POLICY IF EXISTS "Enable all for badges" ON badges;
    DROP POLICY IF EXISTS "Allow all operations on badges" ON badges;
  END IF;

  -- Likes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'likes') THEN
    DROP POLICY IF EXISTS "Enable all for likes" ON likes;
    DROP POLICY IF EXISTS "Allow all operations on likes" ON likes;
  END IF;

  -- Follows
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'follows') THEN
    DROP POLICY IF EXISTS "Enable all for follows" ON follows;
    DROP POLICY IF EXISTS "Allow all operations on follows" ON follows;
  END IF;

  -- Organizers
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizers') THEN
    DROP POLICY IF EXISTS "Enable all for organizers" ON organizers;
    DROP POLICY IF EXISTS "Allow all operations on organizers" ON organizers;
  END IF;

  -- Notifications
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    DROP POLICY IF EXISTS "Enable all for notifications" ON notifications;
    DROP POLICY IF EXISTS "Allow all operations on notifications" ON notifications;
  END IF;
END $$;

-- Create permissive RLS policies for wallet-based authentication
-- These allow all operations since we're using wallet addresses, not Supabase Auth
-- In production, you may want to add more restrictive policies based on wallet_address

-- User Profiles: Allow all operations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    CREATE POLICY "Allow all operations on user_profiles" 
      ON user_profiles 
      FOR ALL 
      USING (true) 
      WITH CHECK (true);
  END IF;
END $$;

-- Achievements: Allow all operations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'achievements') THEN
    CREATE POLICY "Allow all operations on achievements" 
      ON achievements 
      FOR ALL 
      USING (true) 
      WITH CHECK (true);
  END IF;
END $$;

-- Peer Tags: Allow all operations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'peer_tags') THEN
    CREATE POLICY "Allow all operations on peer_tags" 
      ON peer_tags 
      FOR ALL 
      USING (true) 
      WITH CHECK (true);
  END IF;
END $$;

-- Friendships: Allow all operations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'friendships') THEN
    CREATE POLICY "Allow all operations on friendships" 
      ON friendships 
      FOR ALL 
      USING (true) 
      WITH CHECK (true);
  END IF;
END $$;

-- Comments: Allow all operations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
    CREATE POLICY "Allow all operations on comments" 
      ON comments 
      FOR ALL 
      USING (true) 
      WITH CHECK (true);
  END IF;
END $$;

-- Reactions: Table doesn't exist in your schema, so skip
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reactions') THEN
--     CREATE POLICY "Allow all operations on reactions" 
--       ON reactions 
--       FOR ALL 
--       USING (true) 
--       WITH CHECK (true);
--   END IF;
-- END $$;

-- Events: Allow all operations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
    CREATE POLICY "Allow all operations on events" 
      ON events 
      FOR ALL 
      USING (true) 
      WITH CHECK (true);
  END IF;
END $$;

-- Event Registrations: Allow all operations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_registrations') THEN
    CREATE POLICY "Allow all operations on event_registrations" 
      ON event_registrations 
      FOR ALL 
      USING (true) 
      WITH CHECK (true);
  END IF;
END $$;

-- Followers: Allow all operations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'followers') THEN
    CREATE POLICY "Allow all operations on followers" 
      ON followers 
      FOR ALL 
      USING (true) 
      WITH CHECK (true);
  END IF;
END $$;

-- Badge Templates: Allow all operations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'badge_templates') THEN
    CREATE POLICY "Allow all operations on badge_templates" 
      ON badge_templates 
      FOR ALL 
      USING (true) 
      WITH CHECK (true);
  END IF;
END $$;

-- Attendees: Allow all operations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendees') THEN
    CREATE POLICY "Allow all operations on attendees" 
      ON attendees 
      FOR ALL 
      USING (true) 
      WITH CHECK (true);
  END IF;
END $$;

-- Badges: Allow all operations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'badges') THEN
    CREATE POLICY "Allow all operations on badges" 
      ON badges 
      FOR ALL 
      USING (true) 
      WITH CHECK (true);
  END IF;
END $$;

-- Likes: Allow all operations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'likes') THEN
    CREATE POLICY "Allow all operations on likes" 
      ON likes 
      FOR ALL 
      USING (true) 
      WITH CHECK (true);
  END IF;
END $$;

-- Follows: Allow all operations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'follows') THEN
    CREATE POLICY "Allow all operations on follows" 
      ON follows 
      FOR ALL 
      USING (true) 
      WITH CHECK (true);
  END IF;
END $$;

-- Organizers: Allow all operations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizers') THEN
    CREATE POLICY "Allow all operations on organizers" 
      ON organizers 
      FOR ALL 
      USING (true) 
      WITH CHECK (true);
  END IF;
END $$;

-- Notifications: Allow all operations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    CREATE POLICY "Allow all operations on notifications" 
      ON notifications 
      FOR ALL 
      USING (true) 
      WITH CHECK (true);
  END IF;
END $$;

-- Storage Bucket Policies
-- IMPORTANT: Storage policies must be configured in Supabase Dashboard
-- 
-- Steps to set up storage buckets:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Create bucket named "avatars" (make it PUBLIC)
-- 3. Create bucket named "banners" (make it PUBLIC)
-- 
-- For public buckets, no additional policies are needed.
-- If you want private buckets, you'll need to create policies in the Dashboard:
-- Storage → Policies → New Policy → Allow public read, authenticated insert

