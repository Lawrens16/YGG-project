import { supabase } from './supabase';
import type { Achievement, UserProfile, PeerTag } from '../types';

// User API
export async function getUserByWallet(walletAddress: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createUserProfile(profile: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert(profile)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Achievements API
export async function createAchievement(achievement: Partial<Achievement>) {
  const { data, error } = await supabase
    .from('achievements')
    .insert(achievement)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getAchievements(filters?: {
  userId?: string;
  status?: string;
  category?: string;
  limit?: number;
}) {
  let query = supabase
    .from('achievements')
    .select('*, user_profiles(*)')
    .order('created_at', { ascending: false });

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function verifyAchievement(achievementId: string, verifierAddress: string, suiTxId?: string) {
  const { data, error } = await supabase
    .from('achievements')
    .update({
      status: 'verified',
      verified_at: new Date().toISOString(),
      verifier_address: verifierAddress,
      sui_transaction_id: suiTxId,
      points_awarded: 10, // Award points for verification
    })
    .eq('id', achievementId)
    .select()
    .single();
  
  if (error) throw error;

  // Update user skill points
  if (data.user_id) {
    const user = await getUserProfile(data.user_id);
    await updateUserProfile(data.user_id, {
      skill_points: (user.skill_points || 0) + 10,
    });
  }

  return data;
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

// Feed API (get achievements from friends)
export async function getFeedAchievements(userId: string, limit = 20) {
  // Get accepted friendships
  const { data: friendships, error: friendsError } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq('status', 'accepted');

  if (friendsError) throw friendsError;

  const friendIds = friendships?.flatMap(f => 
    f.requester_id === userId ? [f.addressee_id] : [f.requester_id]
  ) || [];

  // Get achievements from friends (public or friends-only)
  const { data, error } = await supabase
    .from('achievements')
    .select('*, user_profiles(*)')
    .in('user_id', friendIds.length > 0 ? friendIds : ['00000000-0000-0000-0000-000000000000'])
    .in('status', ['verified'])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// Peer Tags API
export async function createPeerTag(tag: Partial<PeerTag>) {
  const { data, error } = await supabase
    .from('peer_tags')
    .insert(tag)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function confirmPeerTag(tagId: string) {
  const { data, error } = await supabase
    .from('peer_tags')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', tagId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getPeerTagsForUser(userId: string) {
  const { data, error } = await supabase
    .from('peer_tags')
    .select('*, achievement:achievements(*), tagger:user_profiles!peer_tags_tagger_id_fkey(*)')
    .eq('tagged_id', userId)
    .eq('status', 'pending');
  
  if (error) throw error;
  return data || [];
}

// Friendships API
export async function sendFriendRequest(requesterId: string, addresseeId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .insert({
      requester_id: requesterId,
      addressee_id: addresseeId,
      status: 'pending',
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function acceptFriendRequest(friendshipId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Comments API
export async function addComment(achievementId: string, userId: string, content: string) {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      achievement_id: achievementId,
      user_id: userId,
      content,
    })
    .select('*, user_profiles(*)')
    .single();
  
  if (error) throw error;
  return data;
}

export async function getComments(achievementId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select('*, user_profiles(*)')
    .eq('achievement_id', achievementId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// Reactions API
export async function toggleReaction(achievementId: string, userId: string, reactionType = 'like') {
  // Check if reaction exists
  const { data: existing } = await supabase
    .from('reactions')
    .select('*')
    .eq('achievement_id', achievementId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Delete reaction
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
    return null;
  } else {
    // Create reaction
    const { data, error } = await supabase
      .from('reactions')
      .insert({
        achievement_id: achievementId,
        user_id: userId,
        reaction_type: reactionType,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function getReactions(achievementId: string) {
  const { data, error } = await supabase
    .from('reactions')
    .select('*, user_profiles(*)')
    .eq('achievement_id', achievementId);
  
  if (error) throw error;
  return data || [];
}

