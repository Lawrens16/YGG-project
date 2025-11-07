-- Fix existing likes that might have wrong user_ids
-- Run this AFTER running 20240301000004_update_likes_to_user_profiles.sql
-- This ensures all likes are properly migrated

-- Check for any likes that still reference users table instead of user_profiles
-- and migrate them
UPDATE likes l
SET user_id = up.id
FROM users u
JOIN user_profiles up ON u.wallet_address = up.wallet_address
WHERE l.user_id = u.id
  AND EXISTS (SELECT 1 FROM users WHERE id = l.user_id)
  AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = l.user_id);

-- Verify: Check if there are any orphaned likes
-- SELECT COUNT(*) as orphaned_likes
-- FROM likes l
-- WHERE l.user_id NOT IN (SELECT id FROM user_profiles);

-- Delete any remaining orphaned likes (uncomment if needed)
-- DELETE FROM likes
-- WHERE user_id NOT IN (SELECT id FROM user_profiles);

