-- SpotMe Migration: Transform Achievement Wallet to SpotMe
-- Run this in Supabase SQL Editor after the initial schema

-- 1. Update user_profiles table
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS organizer_application_status TEXT DEFAULT NULL 
    CHECK (organizer_application_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  DROP COLUMN IF EXISTS level;

-- 2. Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  venue_address TEXT NOT NULL,
  venue_latitude DECIMAL(10, 8),
  venue_longitude DECIMAL(11, 8),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  contact_info TEXT,
  email TEXT,
  capacity INTEGER,
  banner_url TEXT,
  qr_code_url TEXT,
  event_code TEXT UNIQUE NOT NULL, -- 6-character code
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_code ON events(event_code);

-- 3. Create event_registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  verification_status TEXT DEFAULT 'registered' 
    CHECK (verification_status IN ('registered', 'verified', 'rejected')),
  verification_photo_url TEXT,
  verification_timestamp TIMESTAMPTZ,
  verification_gps_latitude DECIMAL(10, 8),
  verification_gps_longitude DECIMAL(11, 8),
  badge_issued BOOLEAN DEFAULT false,
  sui_object_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON event_registrations(verification_status);

-- 4. Update achievements table
ALTER TABLE achievements 
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_achievements_event ON achievements(event_id);

-- 5. Rename friendships to followers and simplify
CREATE TABLE IF NOT EXISTS followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  followed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, followed_id),
  CHECK (follower_id != followed_id)
);

CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_followed ON followers(followed_id);

-- Migrate existing friendships data (if any)
-- Note: This assumes pending/accepted friendships become follows
INSERT INTO followers (follower_id, followed_id, followed_at)
SELECT requester_id, addressee_id, created_at
FROM friendships
WHERE status IN ('accepted', 'pending')
ON CONFLICT (follower_id, followed_id) DO NOTHING;

-- Also add reverse follows for mutual friendships
INSERT INTO followers (follower_id, followed_id, followed_at)
SELECT addressee_id, requester_id, created_at
FROM friendships
WHERE status = 'accepted'
ON CONFLICT (follower_id, followed_id) DO NOTHING;

-- Drop old friendships table (commented out for safety - uncomment after verifying migration)
-- DROP TABLE IF EXISTS friendships;

-- 6. Create badge_templates table
CREATE TABLE IF NOT EXISTS badge_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  metadata_uri TEXT,
  image_url TEXT,
  created_by UUID REFERENCES user_profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_badge_templates_created_by ON badge_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_badge_templates_active ON badge_templates(is_active);

-- 7. Update notifications table to include new event-related types
ALTER TABLE notifications 
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications 
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('friend_request', 'achievement_verified', 'peer_tag', 'comment', 'reaction', 'event_registration', 'event_verified', 'badge_issued', 'organizer_approved', 'organizer_rejected'));

-- 8. Add trigger for events updated_at
CREATE TRIGGER update_events_updated_at 
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Function to auto-update event status
CREATE OR REPLACE FUNCTION update_event_status()
RETURNS void AS $$
BEGIN
  UPDATE events
  SET status = 'ongoing'
  WHERE status = 'upcoming' 
    AND start_date <= NOW() 
    AND end_date >= NOW();
  
  UPDATE events
  SET status = 'completed'
  WHERE status IN ('upcoming', 'ongoing')
    AND end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- 10. Function to generate unique 6-character event code
CREATE OR REPLACE FUNCTION generate_event_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM events WHERE event_code = result) THEN
      RETURN result;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 11. Enable RLS on new tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_templates ENABLE ROW LEVEL SECURITY;

-- 12. Basic RLS policies (adjust based on your security requirements)
-- Events: Public read, organizer write
CREATE POLICY "Events are viewable by everyone" ON events
  FOR SELECT USING (true);

CREATE POLICY "Organizers can create events" ON events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = organizer_id 
      AND (is_organizer = true OR organizer_application_status = 'approved')
    )
  );

CREATE POLICY "Organizers can update their own events" ON events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = organizer_id 
      AND (is_organizer = true OR organizer_application_status = 'approved')
    )
  );

-- Event Registrations: Users can view their own, organizers can view for their events
CREATE POLICY "Users can view their own registrations" ON event_registrations
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Organizers can view registrations for their events" ON event_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN user_profiles up ON e.organizer_id = up.id
      WHERE e.id = event_registrations.event_id
      AND (up.is_organizer = true OR up.organizer_application_status = 'approved')
    )
  );

CREATE POLICY "Users can register for events" ON event_registrations
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Followers: Public read, authenticated write
CREATE POLICY "Followers are viewable by everyone" ON followers
  FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON followers
  FOR INSERT WITH CHECK (auth.uid()::text = follower_id::text);

CREATE POLICY "Users can unfollow" ON followers
  FOR DELETE USING (auth.uid()::text = follower_id::text);

-- Badge Templates: Public read, admin write
CREATE POLICY "Badge templates are viewable by everyone" ON badge_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can create badge templates" ON badge_templates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = created_by 
      AND is_admin = true
    )
  );

