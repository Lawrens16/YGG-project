export interface UserProfile {
  id: string;
  wallet_address: string;
  display_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  school_name: string | null;
  course_name: string | null;
  privacy_level: 'private' | 'friends' | 'public';
  skill_points: number;
  is_organizer: boolean;
  is_admin: boolean;
  organizer_application_status: 'pending' | 'approved' | 'rejected' | null;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  event_id: string | null;
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
  attendance_day: string | null;
  created_at: string;
  updated_at: string;
  user_profiles?: UserProfile;
  events?: Event;
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

export interface Follower {
  id: string;
  follower_id: string;
  followed_id: string;
  followed_at: string;
  follower?: UserProfile;
  followed?: UserProfile;
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
  type: 'friend_request' | 'achievement_verified' | 'peer_tag' | 'comment' | 'reaction' | 'event_registration' | 'event_verified' | 'badge_issued' | 'organizer_approved' | 'organizer_rejected';
  reference_id: string | null;
  title: string;
  message: string | null;
  read: boolean;
  created_at: string;
}

export interface Event {
  id: string;
  organizer_id: string;
  name: string;
  description: string | null;
  venue_address: string;
  venue_latitude: number | null;
  venue_longitude: number | null;
  start_date: string;
  end_date: string;
  contact_info: string | null;
  email: string | null;
  capacity: number | null;
  banner_url: string | null;
  qr_code_url: string | null;
  event_code: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  user_profiles?: UserProfile;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  verification_status: 'registered' | 'verified' | 'rejected';
  verification_photo_url: string | null;
  verification_timestamp: string | null;
  verification_gps_latitude: number | null;
  verification_gps_longitude: number | null;
  badge_issued: boolean;
  sui_object_id: string | null;
  created_at: string;
  verified_at: string | null;
  events?: Event;
  user_profiles?: UserProfile;
}

export interface BadgeTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  metadata_uri: string | null;
  image_url: string | null;
  created_by: string | null;
  is_active: boolean;
  created_at: string;
  user_profiles?: UserProfile;
}

