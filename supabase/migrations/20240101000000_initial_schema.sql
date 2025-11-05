-- Run this in Supabase SQL Editor
-- Go to: Dashboard → SQL Editor → New Query

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  school_name TEXT,
  course_name TEXT,
  privacy_level TEXT DEFAULT 'friends' CHECK (privacy_level IN ('private', 'friends', 'public')),
  skill_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  is_organizer BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements Table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Peer Tags Table
CREATE TABLE peer_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  tagger_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  tagged_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  tagger_gps_latitude DECIMAL(10, 8),
  tagger_gps_longitude DECIMAL(11, 8),
  tagged_gps_latitude DECIMAL(10, 8),
  tagged_gps_longitude DECIMAL(11, 8),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friendships Table
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

-- Comments Table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reactions Table
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  reaction_type TEXT DEFAULT 'like' CHECK (reaction_type IN ('like', 'celebrate', 'support')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(achievement_id, user_id)
);

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('friend_request', 'achievement_verified', 'peer_tag', 'comment', 'reaction')),
  reference_id UUID,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX idx_achievements_user_id ON achievements(user_id);
CREATE INDEX idx_achievements_status ON achievements(status);
CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_peer_tags_tagged_id ON peer_tags(tagged_id);
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_comments_achievement_id ON comments(achievement_id);
CREATE INDEX idx_reactions_achievement_id ON reactions(achievement_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_achievements_updated_at 
  BEFORE UPDATE ON achievements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at 
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at 
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies for development
-- NOTE: These are VERY permissive policies for testing!
-- You should restrict these in production based on your auth setup

CREATE POLICY "Enable all for user_profiles" ON user_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for achievements" ON achievements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for peer_tags" ON peer_tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for friendships" ON friendships FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for comments" ON comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for reactions" ON reactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);