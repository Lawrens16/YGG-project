export interface UserProfile {
  id: string;
  wallet_address: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  school_name: string | null;
  course_name: string | null;
  privacy_level: 'private' | 'friends' | 'public';
  skill_points: number;
  level: number;
  is_organizer: boolean;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  category: 'academic' | 'leadership' | 'technology' | 'community' | 'sports' | 'arts';
  title: string;
  description: string | null;
  image_url: string | null;
  proof_hash: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  timestamp: string;
  status: 'pending' | 'verified' | 'rejected';
  verified_at: string | null;
  verifier_address: string | null;
  sui_transaction_id: string | null;
  sui_object_id: string | null;
  points_awarded: number;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  user_profiles?: UserProfile;
}

export interface PeerTag {
  id: string;
  achievement_id: string;
  tagger_id: string;
  tagged_id: string;
  tagger_gps_latitude: number | null;
  tagger_gps_longitude: number | null;
  tagged_gps_latitude: number | null;
  tagged_gps_longitude: number | null;
  status: 'pending' | 'confirmed' | 'rejected';
  confirmed_at: string | null;
  created_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  achievement_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_profiles?: UserProfile;
}

export interface Reaction {
  id: string;
  achievement_id: string;
  user_id: string;
  reaction_type: 'like' | 'celebrate' | 'support';
  created_at: string;
  user_profiles?: UserProfile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'friend_request' | 'achievement_verified' | 'peer_tag' | 'comment' | 'reaction';
  reference_id: string | null;
  title: string;
  message: string | null;
  read: boolean;
  created_at: string;
}

