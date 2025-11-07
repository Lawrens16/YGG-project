-- Update likes table to reference user_profiles instead of users
-- This migration changes the foreign key constraint on likes.user_id
-- Run this in Supabase SQL Editor

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE likes 
  DROP CONSTRAINT IF EXISTS likes_user_id_fkey;

-- Step 2: Update existing likes records to use user_profiles.id instead of users.id
-- This matches users to user_profiles by wallet_address
-- First, update likes that reference users table
UPDATE likes l
SET user_id = up.id
FROM users u
JOIN user_profiles up ON u.wallet_address = up.wallet_address
WHERE l.user_id = u.id
  AND l.user_id != up.id; -- Only update if they're different

-- Also handle any likes that might already be using user_profiles.id but need verification
-- (This is a no-op if they're already correct, but ensures consistency)

-- Step 3: Delete any likes that don't have a matching user_profile
-- (These would be orphaned records)
DELETE FROM likes
WHERE user_id NOT IN (SELECT id FROM user_profiles);

-- Step 4: Add new foreign key constraint to user_profiles
ALTER TABLE likes
  ADD CONSTRAINT likes_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(id) 
  ON DELETE CASCADE;

-- Step 5: Verify the change
-- You can run this to check:
-- SELECT 
--   tc.constraint_name, 
--   tc.table_name, 
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name 
-- FROM information_schema.table_constraints AS tc 
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.table_name = 'likes' AND tc.constraint_type = 'FOREIGN KEY';

