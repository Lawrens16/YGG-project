import { supabase } from './supabase';
import type { Achievement, UserProfile, PeerTag, Event, EventRegistration, BadgeTemplate, Follower } from '../types';

// --- Lightweight client-side mock fallback when Supabase isn't configured ---
const ALLOW_MOCK = import.meta.env.VITE_SUPABASE_ALLOW_MOCK === 'true';

function isSupabaseConfigured(): boolean {
  try {
    // Accessing a property will throw if not configured (due to Proxy)
    if (import.meta.env.VITE_SUPABASE_FORCE_MOCK === 'true') return false;
    return !!(supabase as any)?.from;
  } catch {
    return false;
  }
}

function shouldMockOnError(error: any): boolean {
  if (!ALLOW_MOCK) return false;
  if (!error) return false;
  // Fallback to mock for common connectivity/schema errors
  const status = error.status || error.code;
  return (
    status === 404 ||
    status === 400 ||
    status === 'PGRST301' || // schema/table missing
    status === 'PGRST100' || // bad request
    !!error.message // generic network or other errors
  );
}

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function uuid(): string {
  // Simple UUID v4-ish fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Keys for localStorage mocks
const LS_USERS = 'aw_user_profiles';
const LS_ACHIEVEMENTS = 'aw_achievements';
const LS_COMMENTS = 'aw_comments';
const LS_REACTIONS = 'aw_reactions';
const LS_FOLLOWERS = 'aw_followers';
// const LS_FRIENDSHIPS = 'aw_friendships';

// User API
export async function getUserByWallet(walletAddress: string) {
  if (!isSupabaseConfigured()) {
    const users = lsGet<UserProfile[]>(LS_USERS, []);
    return users.find((u) => u.wallet_address === walletAddress) || null;
  }
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();
    if (error && error.code !== 'PGRST116') {
      if (shouldMockOnError(error)) {
        const users = lsGet<UserProfile[]>(LS_USERS, []);
        return users.find((u) => u.wallet_address === walletAddress) || null;
      }
      throw error;
    }
    return data;
  } catch (e: any) {
    if (shouldMockOnError(e)) {
      const users = lsGet<UserProfile[]>(LS_USERS, []);
      return users.find((u) => u.wallet_address === walletAddress) || null;
    }
    throw e;
  }
}

export async function createUserProfile(profile: Partial<UserProfile>) {
  if (!isSupabaseConfigured()) {
    const users = lsGet<UserProfile[]>(LS_USERS, []);
    const now = new Date().toISOString();
    const user: UserProfile = {
      id: uuid(),
      wallet_address: profile.wallet_address || '0x',
      display_name: profile.display_name || null,
      avatar_url: profile.avatar_url || null,
      banner_url: profile.banner_url || null,
      bio: profile.bio || null,
      school_name: profile.school_name || null,
      course_name: profile.course_name || null,
      privacy_level: (profile.privacy_level as any) || 'friends',
      skill_points: profile.skill_points ?? 0,
      is_organizer: profile.is_organizer ?? false,
      is_admin: profile.is_admin ?? false,
      organizer_application_status: profile.organizer_application_status ?? null,
      created_at: now,
      updated_at: now,
    };
    users.push(user);
    lsSet(LS_USERS, users);
    return user;
  }
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profile)
      .select()
      .single();
    if (error) {
      if (shouldMockOnError(error)) {
        const users = lsGet<UserProfile[]>(LS_USERS, []);
        const now = new Date().toISOString();
        const user: UserProfile = {
          id: uuid(),
          wallet_address: profile.wallet_address || '0x',
          display_name: profile.display_name || null,
          avatar_url: profile.avatar_url || null,
          bio: profile.bio || null,
          school_name: profile.school_name || null,
          course_name: profile.course_name || null,
          privacy_level: (profile.privacy_level as any) || 'friends',
          skill_points: profile.skill_points ?? 0,
          level: profile.level ?? 1,
          is_organizer: profile.is_organizer ?? false,
          created_at: now,
          updated_at: now,
        };
        users.push(user);
        lsSet(LS_USERS, users);
        return user;
      }
      throw error;
    }
    return data;
  } catch (e: any) {
    if (shouldMockOnError(e)) {
      const users = lsGet<UserProfile[]>(LS_USERS, []);
      const now = new Date().toISOString();
      const user: UserProfile = {
        id: uuid(),
        wallet_address: profile.wallet_address || '0x',
        display_name: profile.display_name || null,
        avatar_url: profile.avatar_url || null,
        bio: profile.bio || null,
        school_name: profile.school_name || null,
        course_name: profile.course_name || null,
        privacy_level: (profile.privacy_level as any) || 'friends',
        skill_points: profile.skill_points ?? 0,
        level: profile.level ?? 1,
        is_organizer: profile.is_organizer ?? false,
        created_at: now,
        updated_at: now,
      };
      users.push(user);
      lsSet(LS_USERS, users);
      return user;
    }
    throw e;
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  if (!isSupabaseConfigured()) {
    const users = lsGet<UserProfile[]>(LS_USERS, []);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error('User not found');
    users[idx] = { ...users[idx], ...updates, updated_at: new Date().toISOString() } as UserProfile;
    lsSet(LS_USERS, users);
    return users[idx];
  }
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) {
      if (shouldMockOnError(error)) {
        const users = lsGet<UserProfile[]>(LS_USERS, []);
        const idx = users.findIndex((u) => u.id === userId);
        if (idx === -1) throw new Error('User not found');
        users[idx] = { ...users[idx], ...updates, updated_at: new Date().toISOString() } as UserProfile;
        lsSet(LS_USERS, users);
        return users[idx];
      }
      throw error;
    }
    return data;
  } catch (e: any) {
    if (shouldMockOnError(e)) {
      const users = lsGet<UserProfile[]>(LS_USERS, []);
      const idx = users.findIndex((u) => u.id === userId);
      if (idx === -1) throw new Error('User not found');
      users[idx] = { ...users[idx], ...updates, updated_at: new Date().toISOString() } as UserProfile;
      lsSet(LS_USERS, users);
      return users[idx];
    }
    throw e;
  }
}

// Achievements API
export async function createAchievement(achievement: Partial<Achievement>) {
  if (!isSupabaseConfigured()) {
    const list = lsGet<Achievement[]>(LS_ACHIEVEMENTS, []);
    const now = new Date().toISOString();
    const item: Achievement = {
      id: uuid(),
      user_id: achievement.user_id as string,
      event_id: achievement.event_id || null,
      category: (achievement.category as any) || 'academic',
      title: achievement.title as string,
      description: achievement.description || null,
      image_url: achievement.image_url || null,
      proof_hash: achievement.proof_hash || null,
      gps_latitude: achievement.gps_latitude ?? null,
      gps_longitude: achievement.gps_longitude ?? null,
      timestamp: achievement.timestamp || now,
      status: (achievement.status as any) || 'pending',
      verified_at: null,
      verifier_address: null,
      sui_transaction_id: null,
      sui_object_id: null,
      points_awarded: 0,
      tags: [],
      created_at: now,
      updated_at: now,
      user_profiles: undefined,
    };
    list.unshift(item);
    lsSet(LS_ACHIEVEMENTS, list);
    return item;
  }
  try {
    const { data, error } = await supabase
      .from('achievements')
      .insert(achievement)
      .select()
      .single();
    if (error) {
      if (shouldMockOnError(error)) {
        const list = lsGet<Achievement[]>(LS_ACHIEVEMENTS, []);
        const now = new Date().toISOString();
        const item: Achievement = {
          id: uuid(),
          user_id: achievement.user_id as string,
          category: (achievement.category as any) || 'academic',
          title: achievement.title as string,
          description: achievement.description || null,
          image_url: achievement.image_url || null,
          proof_hash: achievement.proof_hash || null,
          gps_latitude: achievement.gps_latitude ?? null,
          gps_longitude: achievement.gps_longitude ?? null,
          timestamp: achievement.timestamp || now,
          status: (achievement.status as any) || 'pending',
          verified_at: null,
          verifier_address: null,
          sui_transaction_id: null,
          sui_object_id: null,
          points_awarded: 0,
          tags: [],
          created_at: now,
          updated_at: now,
          user_profiles: undefined,
        };
        list.unshift(item);
        lsSet(LS_ACHIEVEMENTS, list);
        return item;
      }
      throw error;
    }
    return data;
  } catch (e: any) {
    if (shouldMockOnError(e)) {
      const list = lsGet<Achievement[]>(LS_ACHIEVEMENTS, []);
      const now = new Date().toISOString();
      const item: Achievement = {
        id: uuid(),
        user_id: achievement.user_id as string,
        category: (achievement.category as any) || 'academic',
        title: achievement.title as string,
        description: achievement.description || null,
        image_url: achievement.image_url || null,
        proof_hash: achievement.proof_hash || null,
        gps_latitude: achievement.gps_latitude ?? null,
        gps_longitude: achievement.gps_longitude ?? null,
        timestamp: achievement.timestamp || now,
        status: (achievement.status as any) || 'pending',
        verified_at: null,
        verifier_address: null,
        sui_transaction_id: null,
        sui_object_id: null,
        points_awarded: 0,
        tags: [],
        created_at: now,
        updated_at: now,
        user_profiles: undefined,
      };
      list.unshift(item);
      lsSet(LS_ACHIEVEMENTS, list);
      return item;
    }
    throw e;
  }
}

export async function getAchievements(filters?: {
  userId?: string;
  status?: string;
  category?: string;
  limit?: number;
}) {
  if (!isSupabaseConfigured()) {
    let list = lsGet<Achievement[]>(LS_ACHIEVEMENTS, []);
    if (filters?.userId) list = list.filter((a) => a.user_id === filters.userId);
    if (filters?.status) list = list.filter((a) => a.status === filters.status);
    if (filters?.category) list = list.filter((a) => a.category === filters.category);
    list = list.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
    if (filters?.limit) list = list.slice(0, filters.limit);
    // hydrate basic user_profiles from mock users
    const users = lsGet<UserProfile[]>(LS_USERS, []);
    return list.map((a) => ({ ...a, user_profiles: users.find((u) => u.id === a.user_id) }));
  }
  try {
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
    if (error) {
      if (shouldMockOnError(error)) {
        let list = lsGet<Achievement[]>(LS_ACHIEVEMENTS, []);
        if (filters?.userId) list = list.filter((a) => a.user_id === filters.userId);
        if (filters?.status) list = list.filter((a) => a.status === filters.status);
        if (filters?.category) list = list.filter((a) => a.category === filters.category);
        list = list.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
        if (filters?.limit) list = list.slice(0, filters.limit);
        const users = lsGet<UserProfile[]>(LS_USERS, []);
        return list.map((a) => ({ ...a, user_profiles: users.find((u) => u.id === a.user_id) }));
      }
      throw error;
    }
    // Transform the data to ensure user_profiles is correctly mapped
    // Supabase returns the relation as user_profiles (array), but we need a single object
    if (data) {
      return data.map((achievement: any) => ({
        ...achievement,
        user_profiles: Array.isArray(achievement.user_profiles) 
          ? achievement.user_profiles[0] 
          : achievement.user_profiles
      }));
    }
    return data;
  } catch (e: any) {
    if (shouldMockOnError(e)) {
      let list = lsGet<Achievement[]>(LS_ACHIEVEMENTS, []);
      if (filters?.userId) list = list.filter((a) => a.user_id === filters.userId);
      if (filters?.status) list = list.filter((a) => a.status === filters.status);
      if (filters?.category) list = list.filter((a) => a.category === filters.category);
      list = list.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
      if (filters?.limit) list = list.slice(0, filters.limit);
      const users = lsGet<UserProfile[]>(LS_USERS, []);
      return list.map((a) => ({ ...a, user_profiles: users.find((u) => u.id === a.user_id) }));
    }
    throw e;
  }
}

export async function verifyAchievement(achievementId: string, verifierAddress: string, suiTxId?: string, suiObjectId?: string) {
  if (!isSupabaseConfigured()) {
    const list = lsGet<Achievement[]>(LS_ACHIEVEMENTS, []);
    const idx = list.findIndex((a) => a.id === achievementId);
    if (idx === -1) throw new Error('Achievement not found');
    list[idx] = {
      ...list[idx],
      status: 'verified',
      verified_at: new Date().toISOString(),
      verifier_address: verifierAddress,
      sui_transaction_id: suiTxId || null,
      sui_object_id: suiObjectId || list[idx].sui_object_id || null,
      points_awarded: 10,
      updated_at: new Date().toISOString(),
    };
    lsSet(LS_ACHIEVEMENTS, list);
    // Award points
    const users = lsGet<UserProfile[]>(LS_USERS, []);
    const uidx = users.findIndex((u) => u.id === list[idx].user_id);
    if (uidx !== -1) {
      users[uidx] = { ...users[uidx], skill_points: (users[uidx].skill_points || 0) + 10 } as UserProfile;
      lsSet(LS_USERS, users);
    }
    return list[idx];
  }
  try {
    const { data, error } = await supabase
      .from('achievements')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
        verifier_address: verifierAddress,
        sui_transaction_id: suiTxId,
        sui_object_id: suiObjectId,
        points_awarded: 10, // Award points for verification
      })
      .eq('id', achievementId)
      .select()
      .single();
    if (error) {
      if (shouldMockOnError(error)) {
        const list = lsGet<Achievement[]>(LS_ACHIEVEMENTS, []);
        const idx = list.findIndex((a) => a.id === achievementId);
        if (idx === -1) throw new Error('Achievement not found');
        list[idx] = {
          ...list[idx],
          status: 'verified',
          verified_at: new Date().toISOString(),
          verifier_address: verifierAddress,
          sui_transaction_id: suiTxId || null,
          sui_object_id: suiObjectId || list[idx].sui_object_id || null,
          points_awarded: 10,
          updated_at: new Date().toISOString(),
        };
        lsSet(LS_ACHIEVEMENTS, list);
        const users = lsGet<UserProfile[]>(LS_USERS, []);
        const uidx = users.findIndex((u) => u.id === list[idx].user_id);
        if (uidx !== -1) {
          users[uidx] = { ...users[uidx], skill_points: (users[uidx].skill_points || 0) + 10 } as UserProfile;
          lsSet(LS_USERS, users);
        }
        return list[idx];
      }
      throw error;
    }

    // Update user skill points
    if (data.user_id) {
      const user = await getUserProfile(data.user_id);
      await updateUserProfile(data.user_id, {
        skill_points: (user.skill_points || 0) + 10,
      });
    }

    return data;
  } catch (e: any) {
    if (shouldMockOnError(e)) {
      const list = lsGet<Achievement[]>(LS_ACHIEVEMENTS, []);
      const idx = list.findIndex((a) => a.id === achievementId);
      if (idx === -1) throw new Error('Achievement not found');
      list[idx] = {
        ...list[idx],
        status: 'verified',
        verified_at: new Date().toISOString(),
        verifier_address: verifierAddress,
        sui_transaction_id: suiTxId || null,
        sui_object_id: suiObjectId || list[idx].sui_object_id || null,
        points_awarded: 10,
        updated_at: new Date().toISOString(),
      };
      lsSet(LS_ACHIEVEMENTS, list);
      const users = lsGet<UserProfile[]>(LS_USERS, []);
      const uidx = users.findIndex((u) => u.id === list[idx].user_id);
      if (uidx !== -1) {
        users[uidx] = { ...users[uidx], skill_points: (users[uidx].skill_points || 0) + 10 } as UserProfile;
        lsSet(LS_USERS, users);
      }
      return list[idx];
    }
    throw e;
  }
}

/**
 * Delete an achievement (post) - only if user owns it
 */
export async function deleteAchievement(achievementId: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const list = lsGet<Achievement[]>(LS_ACHIEVEMENTS, []);
    const idx = list.findIndex((a) => a.id === achievementId);
    if (idx === -1) throw new Error('Achievement not found');
    if (list[idx].user_id !== userId) throw new Error('Unauthorized: You can only delete your own posts');
    list.splice(idx, 1);
    lsSet(LS_ACHIEVEMENTS, list);
    return;
  }
  try {
    // First verify ownership
    const { data: achievement, error: fetchError } = await supabase
      .from('achievements')
      .select('user_id')
      .eq('id', achievementId)
      .single();
    
    if (fetchError) throw fetchError;
    if (!achievement || achievement.user_id !== userId) {
      throw new Error('Unauthorized: You can only delete your own posts');
    }
    
    // Delete the achievement
    const { error } = await supabase
      .from('achievements')
      .delete()
      .eq('id', achievementId);
    
    if (error) throw error;
  } catch (e: any) {
    if (shouldMockOnError(e)) {
      const list = lsGet<Achievement[]>(LS_ACHIEVEMENTS, []);
      const idx = list.findIndex((a) => a.id === achievementId);
      if (idx === -1) throw new Error('Achievement not found');
      if (list[idx].user_id !== userId) throw new Error('Unauthorized: You can only delete your own posts');
      list.splice(idx, 1);
      lsSet(LS_ACHIEVEMENTS, list);
      return;
    }
    throw e;
  }
}

export async function getUserProfile(userId: string) {
  if (!isSupabaseConfigured()) {
    const users = lsGet<UserProfile[]>(LS_USERS, []);
    const u = users.find((x) => x.id === userId);
    if (!u) throw new Error('User not found');
    return u;
  }
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      if (shouldMockOnError(error)) {
        const users = lsGet<UserProfile[]>(LS_USERS, []);
        const u = users.find((x) => x.id === userId);
        if (!u) throw new Error('User not found');
        return u;
      }
      throw error;
    }
    return data;
  } catch (e: any) {
    if (shouldMockOnError(e)) {
      const users = lsGet<UserProfile[]>(LS_USERS, []);
      const u = users.find((x) => x.id === userId);
      if (!u) throw new Error('User not found');
      return u;
    }
    throw e;
  }
}

/**
 * Search users by username (display_name)
 */
export async function searchUsers(query: string, limit: number = 10): Promise<UserProfile[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }
  
  if (!isSupabaseConfigured()) {
    const users = lsGet<UserProfile[]>(LS_USERS, []);
    const searchTerm = query.toLowerCase().trim();
    return users
      .filter((u) => 
        u.display_name?.toLowerCase().includes(searchTerm) ||
        u.school_name?.toLowerCase().includes(searchTerm) ||
        u.course_name?.toLowerCase().includes(searchTerm)
      )
      .slice(0, limit);
  }
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .or(`display_name.ilike.%${query}%,school_name.ilike.%${query}%,course_name.ilike.%${query}%`)
      .limit(limit);
    
    if (error) {
      if (shouldMockOnError(error)) {
        const users = lsGet<UserProfile[]>(LS_USERS, []);
        const searchTerm = query.toLowerCase().trim();
        return users
          .filter((u) => 
            u.display_name?.toLowerCase().includes(searchTerm) ||
            u.school_name?.toLowerCase().includes(searchTerm) ||
            u.course_name?.toLowerCase().includes(searchTerm)
          )
          .slice(0, limit);
      }
      throw error;
    }
    return data || [];
  } catch (e: any) {
    if (shouldMockOnError(e)) {
      const users = lsGet<UserProfile[]>(LS_USERS, []);
      const searchTerm = query.toLowerCase().trim();
      return users
        .filter((u) => 
          u.display_name?.toLowerCase().includes(searchTerm) ||
          u.school_name?.toLowerCase().includes(searchTerm) ||
          u.course_name?.toLowerCase().includes(searchTerm)
        )
        .slice(0, limit);
    }
    throw e;
  }
}

// Feed API (get achievements from users you follow)
export async function getFeedAchievements(userId: string, limit = 20) {
  if (!isSupabaseConfigured()) {
    // Very simple mock: show all verified achievements by any user
    const all = (await getAchievements({ status: 'verified', limit })) as Achievement[];
    return all;
  }
  try {
    // Get mutual followers (friends) - users who follow each other (confirmed relationships)
    const mutualFriends = await getMutualFollowers(userId);
    const friendIds = mutualFriends.map(f => f.id);

    // Also get users you're following (one-way follows)
    const following = await getFollowing(userId);
    const followedIds = following.map(f => f.followed_id);

    // Combine both: mutual friends + one-way follows
    // This ensures achievements show from both confirmed friends and users you follow
    const allFollowedIds = [...new Set([...friendIds, ...followedIds])];

    // If not following anyone, return empty array
    if (allFollowedIds.length === 0) {
      console.log('No followed users found for feed (mutual friends:', friendIds.length, ', one-way follows:', followedIds.length, ')');
      return [];
    }

    console.log('Getting feed achievements for users (mutual:', friendIds.length, ', one-way:', followedIds.length, ', total:', allFollowedIds.length, '):', allFollowedIds);

    // Get achievements from users you follow (public or friends-only)
    const { data, error } = await supabase
      .from('achievements')
      .select('*, user_profiles(*)')
      .in('user_id', allFollowedIds)
      .in('status', ['verified'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching feed achievements:', error);
      if (shouldMockOnError(error)) {
        const all = (await getAchievements({ status: 'verified', limit })) as Achievement[];
        return all;
      }
      throw error;
    }
    
    console.log('Found achievements:', data?.length || 0);
    
    // Transform the data to ensure user_profiles is correctly mapped
    if (data) {
      return data.map((achievement: any) => ({
        ...achievement,
        user_profiles: Array.isArray(achievement.user_profiles) 
          ? achievement.user_profiles[0] 
          : achievement.user_profiles
      }));
    }
    return data || [];
  } catch (e: any) {
    console.error('Exception in getFeedAchievements:', e);
    if (shouldMockOnError(e)) {
      const all = (await getAchievements({ status: 'verified', limit })) as Achievement[];
      return all;
    }
    throw e;
  }
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

export async function rejectFriendRequest(friendshipId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .update({ status: 'rejected' })
    .eq('id', friendshipId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getFriendshipStatus(userAId: string, userBId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .or(`and(requester_id.eq.${userAId},addressee_id.eq.${userBId}),and(requester_id.eq.${userBId},addressee_id.eq.${userAId})`)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function listPendingFriendRequests(userId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .select('*, requester:user_profiles!friendships_requester_id_fkey(*)')
    .eq('addressee_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Comments API - Updated to reference 'achievements' table directly
export async function addComment(achievementId: string, userId: string, content: string) {
  
  if (!isSupabaseConfigured()) {
    const comments = lsGet<any[]>(LS_COMMENTS, []);
    const users = lsGet<UserProfile[]>(LS_USERS, []);
    const now = new Date().toISOString();
    const comment = {
      id: uuid(),
      achievement_id: achievementId,
      user_id: userId,
      content,
      created_at: now,
      user_profiles: users.find(u => u.id === userId) || null,
    };
    comments.push(comment);
    lsSet(LS_COMMENTS, comments);
    return comment;
  }
  
  try {
    // Try with achievement_id first
    let insertData: any = {
      user_id: userId,
      content,
    };
    
    // Try achievement_id
    insertData.achievement_id = achievementId;
    let { data, error } = await supabase
      .from('comments')
      .insert(insertData)
      .select('*, user_profiles(*)')
      .single();
    
    // If achievement_id column doesn't exist, fall back to mock storage
    if (error && (error.code === '42703' || (error.message?.includes('column') && error.message?.includes('does not exist')))) {
      console.warn('Comments table missing achievement_id column. Using localStorage fallback. Please run migration SQL.');
      // Fall back to localStorage
      if (shouldMockOnError(error)) {
        const comments = lsGet<any[]>(LS_COMMENTS, []);
        const users = lsGet<UserProfile[]>(LS_USERS, []);
        const now = new Date().toISOString();
        const comment = {
          id: uuid(),
          achievement_id: achievementId,
          user_id: userId,
          content,
          created_at: now,
          user_profiles: users.find(u => u.id === userId) || null,
        };
        comments.push(comment);
        lsSet(LS_COMMENTS, comments);
        return comment;
      }
      throw new Error('Please run the migration SQL to add achievement_id column to comments table. See: supabase/migrations/fix_likes_comments_schema.sql');
    }
    
    if (error) {
      console.error('Error adding comment to database:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      
      if (shouldMockOnError(error)) {
        const comments = lsGet<any[]>(LS_COMMENTS, []);
        const users = lsGet<UserProfile[]>(LS_USERS, []);
        const now = new Date().toISOString();
        const comment = {
          id: uuid(),
          achievement_id: achievementId,
          user_id: userId,
          content,
          created_at: now,
          user_profiles: users.find(u => u.id === userId) || null,
        };
        comments.push(comment);
        lsSet(LS_COMMENTS, comments);
        return comment;
      }
      throw error;
    }
    // Transform the data to ensure user_profiles is correctly mapped
    if (data) {
      return {
        ...data,
        user_profiles: Array.isArray(data.user_profiles) 
          ? data.user_profiles[0] 
          : data.user_profiles || null,
      };
    }
    return data;
  } catch (e: any) {
    if (shouldMockOnError(e)) {
      const comments = lsGet<any[]>(LS_COMMENTS, []);
      const users = lsGet<UserProfile[]>(LS_USERS, []);
      const now = new Date().toISOString();
      const comment = {
        id: uuid(),
        achievement_id: achievementId,
        user_id: userId,
        content,
        created_at: now,
        user_profiles: users.find(u => u.id === userId) || null,
      };
      comments.push(comment);
      lsSet(LS_COMMENTS, comments);
      return comment;
    }
    throw e;
  }
}

export async function getCommentCount(achievementId: string): Promise<number> {
  if (!isSupabaseConfigured()) {
    const comments = lsGet<any[]>(LS_COMMENTS, []);
    return comments.filter(c => c.achievement_id === achievementId).length;
  }
  
  try {
    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('achievement_id', achievementId);
    
    if (error) {
      if (shouldMockOnError(error)) {
        const comments = lsGet<any[]>(LS_COMMENTS, []);
        return comments.filter(c => c.achievement_id === achievementId).length;
      }
      throw error;
    }
    return count || 0;
  } catch (e: any) {
    if (shouldMockOnError(e)) {
      const comments = lsGet<any[]>(LS_COMMENTS, []);
      return comments.filter(c => c.achievement_id === achievementId).length;
    }
    throw e;
  }
}

export async function getComments(achievementId: string) {
  if (!isSupabaseConfigured()) {
    const comments = lsGet<any[]>(LS_COMMENTS, []);
    const users = lsGet<UserProfile[]>(LS_USERS, []);
    return comments
      .filter(c => c.achievement_id === achievementId)
      .map(c => ({
        ...c,
        user_profiles: users.find(u => u.id === c.user_id) || null,
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  
  try {
    // Comments table references user_profiles, not users
    let { data, error } = await supabase
      .from('comments')
      .select('*, user_profiles(*)')
      .eq('achievement_id', achievementId)
      .order('created_at', { ascending: false });
    
    if (error) {
      if (shouldMockOnError(error)) {
        const comments = lsGet<any[]>(LS_COMMENTS, []);
        const users = lsGet<UserProfile[]>(LS_USERS, []);
        return comments
          .filter(c => c.achievement_id === achievementId)
          .map(c => ({
            ...c,
            user_profiles: users.find(u => u.id === c.user_id) || null,
          }))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      throw error;
    }
    // Transform the data to ensure user_profiles is correctly mapped
    return (data || []).map((comment: any) => ({
      ...comment,
      user_profiles: Array.isArray(comment.user_profiles) 
        ? comment.user_profiles[0] 
        : comment.user_profiles || null,
    }));
  } catch (e: any) {
    if (shouldMockOnError(e)) {
      const comments = lsGet<any[]>(LS_COMMENTS, []);
      const users = lsGet<UserProfile[]>(LS_USERS, []);
      return comments
        .filter(c => c.achievement_id === achievementId)
        .map(c => ({
          ...c,
          user_profiles: users.find(u => u.id === c.user_id) || null,
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    throw e;
  }
}

// Reactions/Likes API - Updated to reference 'achievements' table directly
export async function toggleReaction(achievementId: string, userId: string, _reactionType = 'like') {
  if (!isSupabaseConfigured()) {
    const reactions = lsGet<any[]>(LS_REACTIONS, []);
    const existingIndex = reactions.findIndex(
      r => r.achievement_id === achievementId && r.user_id === userId
    );
    
    if (existingIndex !== -1) {
      // Delete reaction
      reactions.splice(existingIndex, 1);
      lsSet(LS_REACTIONS, reactions);
      return null;
    } else {
      // Create reaction
      const now = new Date().toISOString();
      const reaction = {
        id: uuid(),
        achievement_id: achievementId,
        user_id: userId,
        created_at: now,
      };
      reactions.push(reaction);
      lsSet(LS_REACTIONS, reactions);
      return reaction;
    }
  }
  
  try {
    // Likes table now references user_profiles(id) directly
    // Check if like exists using user_profiles.id
    let { data: existing, error: checkError } = await supabase
      .from('likes')
      .select('*')
      .eq('achievement_id', achievementId)
      .eq('user_id', userId) // userId is already user_profiles.id
      .maybeSingle();

    // If achievement_id column doesn't exist, the table might not have been migrated yet
    // In that case, we'll need to check what columns actually exist
    if (checkError && (checkError.code === '42703' || checkError.message?.includes('column "achievement_id" does not exist'))) {
      // Try to get all likes for this user to see the structure
      const { data: allLikes } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', userId)
        .limit(1);
      
      // If we got data, check what column name is used
      if (allLikes && allLikes.length > 0) {
        const firstLike = allLikes[0];
        // Check if it has post_id or achievement_id
        const columnName = firstLike.achievement_id !== undefined ? 'achievement_id' : 
                          firstLike.post_id !== undefined ? 'post_id' : null;
        
        if (columnName) {
          const { data: existingWithColumn, error: columnError } = await supabase
            .from('likes')
            .select('*')
            .eq(columnName, achievementId)
            .eq('user_id', userId)
            .maybeSingle();
          
          if (!columnError) {
            existing = existingWithColumn;
            checkError = null;
          }
        }
      }
    }

    if (checkError && checkError.code !== 'PGRST116') {
      if (shouldMockOnError(checkError)) {
        const reactions = lsGet<any[]>(LS_REACTIONS, []);
        const existingIndex = reactions.findIndex(
          r => r.achievement_id === achievementId && r.user_id === userId
        );
        
        if (existingIndex !== -1) {
          reactions.splice(existingIndex, 1);
          lsSet(LS_REACTIONS, reactions);
          return null;
        } else {
          const now = new Date().toISOString();
          const reaction = {
            id: uuid(),
            achievement_id: achievementId,
            user_id: userId,
            created_at: now,
          };
          reactions.push(reaction);
          lsSet(LS_REACTIONS, reactions);
          return reaction;
        }
      }
      throw checkError;
    }

    if (existing) {
      // Delete like
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('id', existing.id);
      if (error) {
        if (shouldMockOnError(error)) {
          const reactions = lsGet<any[]>(LS_REACTIONS, []);
          const existingIndex = reactions.findIndex(
            r => r.achievement_id === achievementId && r.user_id === userId
          );
          if (existingIndex !== -1) {
            reactions.splice(existingIndex, 1);
            lsSet(LS_REACTIONS, reactions);
          }
          return null;
        }
        throw error;
      }
      return null;
    } else {
      // Create like using user_profiles.id
      let insertData: any = {
        user_id: userId, // userId is user_profiles.id
        achievement_id: achievementId,
      };
      
      let { data, error } = await supabase
        .from('likes')
        .insert(insertData)
        .select()
        .single();
      
      // If achievement_id column doesn't exist, fall back to mock storage
      if (error && (error.code === '42703' || (error.message?.includes('column') && error.message?.includes('does not exist')))) {
        console.warn('Likes table missing achievement_id column. Using localStorage fallback. Please run migration SQL.');
        // Fall back to localStorage
        if (shouldMockOnError(error)) {
          const reactions = lsGet<any[]>(LS_REACTIONS, []);
          const now = new Date().toISOString();
          const reaction = {
            id: uuid(),
            achievement_id: achievementId,
            user_id: userId,
            created_at: now,
          };
          reactions.push(reaction);
          lsSet(LS_REACTIONS, reactions);
          return reaction;
        }
        throw new Error('Please run the migration SQL to add achievement_id column to likes table. See: supabase/migrations/fix_likes_comments_schema.sql');
      }
      
      if (error) {
        if (shouldMockOnError(error)) {
          const reactions = lsGet<any[]>(LS_REACTIONS, []);
          const now = new Date().toISOString();
          const reaction = {
            id: uuid(),
            achievement_id: achievementId,
            user_id: userId,
            created_at: now,
          };
          reactions.push(reaction);
          lsSet(LS_REACTIONS, reactions);
          return reaction;
        }
        throw error;
      }
      return data;
    }
  } catch (e: any) {
    if (shouldMockOnError(e)) {
      const reactions = lsGet<any[]>(LS_REACTIONS, []);
      const existingIndex = reactions.findIndex(
        r => r.achievement_id === achievementId && r.user_id === userId
      );
      
      if (existingIndex !== -1) {
        reactions.splice(existingIndex, 1);
        lsSet(LS_REACTIONS, reactions);
        return null;
      } else {
        const now = new Date().toISOString();
        const reaction = {
          id: uuid(),
          achievement_id: achievementId,
          user_id: userId,
          created_at: now,
        };
        reactions.push(reaction);
        lsSet(LS_REACTIONS, reactions);
        return reaction;
      }
    }
    throw e;
  }
}

export async function getReactions(achievementId: string) {
  if (!isSupabaseConfigured()) {
    const reactions = lsGet<any[]>(LS_REACTIONS, []);
    const users = lsGet<UserProfile[]>(LS_USERS, []);
    return reactions
      .filter(r => r.achievement_id === achievementId)
      .map(r => ({
        ...r,
        user_profiles: users.find(u => u.id === r.user_id) || null,
      }));
  }
  
  try {
    // Likes table now references user_profiles(id) directly
    // Get likes with user_profiles joined
    let { data, error } = await supabase
      .from('likes')
      .select('*, user_profiles(*)')
      .eq('achievement_id', achievementId);
    
    if (error) {
      if (shouldMockOnError(error)) {
        const reactions = lsGet<any[]>(LS_REACTIONS, []);
        const users = lsGet<UserProfile[]>(LS_USERS, []);
        return reactions
          .filter(r => r.achievement_id === achievementId)
          .map(r => ({
            ...r,
            user_profiles: users.find(u => u.id === r.user_id) || null,
          }));
      }
      throw error;
    }
    
    // Transform the data to ensure user_profiles is correctly mapped
    if (data) {
      return data.map((like: any) => ({
        ...like,
        user_profiles: Array.isArray(like.user_profiles) 
          ? like.user_profiles[0] 
          : like.user_profiles || null,
      }));
    }
    
    return data || [];
  } catch (e: any) {
    if (shouldMockOnError(e)) {
      const reactions = lsGet<any[]>(LS_REACTIONS, []);
      const users = lsGet<UserProfile[]>(LS_USERS, []);
      return reactions
        .filter(r => r.achievement_id === achievementId)
        .map(r => ({
          ...r,
          user_profiles: users.find(u => u.id === r.user_id) || null,
        }));
    }
    throw e;
  }
}

// ========== EVENT MANAGEMENT API ==========

/**
 * Generate a unique 6-character event code
 */
export async function generateEventCode(): Promise<string> {
  if (!isSupabaseConfigured()) {
    // Simple mock: generate random 6-char code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
  try {
    // Call the database function
    const { data, error } = await supabase.rpc('generate_event_code');
    if (error) throw error;
    return data;
  } catch (e: any) {
    if (shouldMockOnError(e)) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
    throw e;
  }
}

/**
 * Create a new event
 */
export async function createEvent(event: Partial<Event>): Promise<Event> {
  if (!event.event_code) {
    event.event_code = await generateEventCode();
  }
  
  if (!isSupabaseConfigured()) {
    const now = new Date().toISOString();
    const newEvent: Event = {
      id: uuid(),
      organizer_id: event.organizer_id!,
      name: event.name!,
      description: event.description || null,
      venue_address: event.venue_address!,
      venue_latitude: event.venue_latitude ?? null,
      venue_longitude: event.venue_longitude ?? null,
      start_date: event.start_date!,
      end_date: event.end_date!,
      contact_info: event.contact_info || null,
      email: event.email || null,
      capacity: event.capacity ?? null,
      banner_url: event.banner_url || null,
      qr_code_url: event.qr_code_url || null,
      event_code: event.event_code,
      status: (event.status as any) || 'upcoming',
      created_at: now,
      updated_at: now,
    };
    return newEvent;
  }
  
  try {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e: any) {
    throw e;
  }
}

/**
 * Update an event
 */
export async function updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
  if (!isSupabaseConfigured()) {
    throw new Error('Mock update not implemented');
  }
  try {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e: any) {
    throw e;
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Mock delete not implemented');
  }
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);
    if (error) throw error;
  } catch (e: any) {
    throw e;
  }
}

/**
 * Get event by ID
 */
export async function getEvent(eventId: string): Promise<Event | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*, user_profiles(*)')
      .eq('id', eventId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (e: any) {
    throw e;
  }
}

/**
 * Get event by code
 */
export async function getEventByCode(eventCode: string): Promise<Event | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*, user_profiles(*)')
      .eq('event_code', eventCode.toUpperCase())
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (e: any) {
    throw e;
  }
}

/**
 * Get events by organizer
 */
export async function getEventsByOrganizer(organizerId: string): Promise<Event[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*, user_profiles(*)')
      .eq('organizer_id', organizerId)
      .order('start_date', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e: any) {
    throw e;
  }
}

/**
 * Get nearby events (within radius in km)
 */
export async function getNearbyEvents(
  latitude: number,
  longitude: number,
  radiusKm: number = 10
): Promise<Event[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  try {
    // Use PostGIS or calculate distance in query
    // For now, simple bounding box approximation
    const latDelta = radiusKm / 111; // ~111 km per degree latitude
    const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));
    
    const { data, error } = await supabase
      .from('events')
      .select('*, user_profiles(*)')
      .gte('venue_latitude', latitude - latDelta)
      .lte('venue_latitude', latitude + latDelta)
      .gte('venue_longitude', longitude - lngDelta)
      .lte('venue_longitude', longitude + lngDelta)
      .in('status', ['upcoming', 'ongoing'])
      .order('start_date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (e: any) {
    throw e;
  }
}

/**
 * Get all events (for admin/feed)
 */
export async function getAllEvents(filters?: {
  status?: string;
  limit?: number;
}): Promise<Event[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  try {
    let query = supabase
      .from('events')
      .select('*, user_profiles(*)')
      .order('start_date', { ascending: false });
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (e: any) {
    throw e;
  }
}

// ========== EVENT REGISTRATION API ==========

/**
 * Register for an event
 */
export async function registerForEvent(eventId: string, userId: string): Promise<EventRegistration> {
  if (!isSupabaseConfigured()) {
    const now = new Date().toISOString();
    return {
      id: uuid(),
      event_id: eventId,
      user_id: userId,
      verification_status: 'registered',
      verification_photo_url: null,
      verification_timestamp: null,
      verification_gps_latitude: null,
      verification_gps_longitude: null,
      badge_issued: false,
      sui_object_id: null,
      created_at: now,
      verified_at: null,
    };
  }
  try {
    const { data, error } = await supabase
      .from('event_registrations')
      .insert({
        event_id: eventId,
        user_id: userId,
        verification_status: 'registered',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e: any) {
    throw e;
  }
}

/**
 * Get event registrations
 */
export async function getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*, user_profiles(*), events(*)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e: any) {
    throw e;
  }
}

/**
 * Get user registrations
 */
export async function getUserRegistrations(userId: string): Promise<EventRegistration[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*, events(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e: any) {
    throw e;
  }
}

/**
 * Verify attendance
 */
export async function verifyAttendance(
  registrationId: string,
  photoUrl: string,
  gpsLat: number,
  gpsLng: number,
  timestamp: Date
): Promise<EventRegistration> {
  if (!isSupabaseConfigured()) {
    throw new Error('Mock verify not implemented');
  }
  try {
    const { data, error } = await supabase
      .from('event_registrations')
      .update({
        verification_status: 'verified',
        verification_photo_url: photoUrl,
        verification_timestamp: timestamp.toISOString(),
        verification_gps_latitude: gpsLat,
        verification_gps_longitude: gpsLng,
        verified_at: new Date().toISOString(),
      })
      .eq('id', registrationId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e: any) {
    throw e;
  }
}

/**
 * Issue badges for verified attendees (batch)
 */
export async function issueEventBadges(eventId: string): Promise<EventRegistration[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Mock issue badges not implemented');
  }
  try {
    // Get all verified registrations that haven't received badges
    const { data: registrations, error: fetchError } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('verification_status', 'verified')
      .eq('badge_issued', false);
    
    if (fetchError) throw fetchError;
    
    // Update all to badge_issued = true
    const registrationIds = registrations?.map((r: EventRegistration) => r.id) || [];
    if (registrationIds.length === 0) return [];
    
    const { data, error } = await supabase
      .from('event_registrations')
      .update({ badge_issued: true })
      .in('id', registrationIds)
      .select();
    
    if (error) throw error;
    return data || [];
  } catch (e: any) {
    throw e;
  }
}

// ========== ADMIN API ==========

/**
 * Apply for organizer status
 */
export async function applyForOrganizer(userId: string, _applicationData: any): Promise<UserProfile> {
  if (!isSupabaseConfigured()) {
    throw new Error('Mock apply not implemented');
  }
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        organizer_application_status: 'pending',
      })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e: any) {
    throw e;
  }
}

/**
 * Approve organizer application
 */
export async function approveOrganizer(userId: string): Promise<UserProfile> {
  if (!isSupabaseConfigured()) {
    throw new Error('Mock approve not implemented');
  }
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        organizer_application_status: 'approved',
        is_organizer: true,
      })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e: any) {
    throw e;
  }
}

/**
 * Reject organizer application
 */
export async function rejectOrganizer(userId: string): Promise<UserProfile> {
  if (!isSupabaseConfigured()) {
    throw new Error('Mock reject not implemented');
  }
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        organizer_application_status: 'rejected',
      })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e: any) {
    throw e;
  }
}

/**
 * Revoke organizer privileges
 */
export async function revokeOrganizer(userId: string): Promise<UserProfile> {
  if (!isSupabaseConfigured()) {
    throw new Error('Mock revoke not implemented');
  }
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        is_organizer: false,
        organizer_application_status: null,
      })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e: any) {
    throw e;
  }
}

/**
 * Get pending organizer applications
 */
export async function getPendingOrganizerApplications(): Promise<UserProfile[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('organizer_application_status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e: any) {
    throw e;
  }
}

// ========== FOLLOW/UNFOLLOW API ==========

/**
 * Follow a user
 */
export async function followUser(followerId: string, followedId: string): Promise<Follower> {
  if (!isSupabaseConfigured()) {
    const followers = lsGet<any[]>(LS_FOLLOWERS, []);
    const now = new Date().toISOString();
    const follower = {
      id: uuid(),
      follower_id: followerId,
      followed_id: followedId,
      followed_at: now,
    };
    followers.push(follower);
    lsSet(LS_FOLLOWERS, followers);
    return follower;
  }
  try {
    const { data, error } = await supabase
      .from('followers')
      .insert({
        follower_id: followerId,
        followed_id: followedId,
      })
      .select()
      .single();
    if (error) {
      if (shouldMockOnError(error)) {
        const followers = lsGet<any[]>(LS_FOLLOWERS, []);
        const now = new Date().toISOString();
        const follower: Follower = {
          id: uuid(),
          follower_id: followerId,
          followed_id: followedId,
          followed_at: now,
          created_at: now,
        };
        followers.push(follower);
        lsSet(LS_FOLLOWERS, followers);
        return follower;
      }
      throw error;
    }
    return data;
  } catch (e: any) {
    if (shouldMockOnError(e)) {
      const followers = lsGet<any[]>(LS_FOLLOWERS, []);
      const now = new Date().toISOString();
      const follower = {
        id: uuid(),
        follower_id: followerId,
        followed_id: followedId,
        followed_at: now,
      };
      followers.push(follower);
      lsSet(LS_FOLLOWERS, followers);
      return follower;
    }
    throw e;
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, followedId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const followers = lsGet<any[]>(LS_FOLLOWERS, []);
    const index = followers.findIndex(
      f => f.follower_id === followerId && f.followed_id === followedId
    );
    if (index !== -1) {
      followers.splice(index, 1);
      lsSet(LS_FOLLOWERS, followers);
    }
    return;
  }
  try {
    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', followerId)
      .eq('followed_id', followedId);
    if (error) {
      if (shouldMockOnError(error)) {
        const followers = lsGet<any[]>(LS_FOLLOWERS, []);
        const index = followers.findIndex(
          f => f.follower_id === followerId && f.followed_id === followedId
        );
        if (index !== -1) {
          followers.splice(index, 1);
          lsSet(LS_FOLLOWERS, followers);
        }
        return;
      }
      throw error;
    }
  } catch (e: any) {
    if (shouldMockOnError(e)) {
      const followers = lsGet<any[]>(LS_FOLLOWERS, []);
      const index = followers.findIndex(
        f => f.follower_id === followerId && f.followed_id === followedId
      );
      if (index !== -1) {
        followers.splice(index, 1);
        lsSet(LS_FOLLOWERS, followers);
      }
      return;
    }
    throw e;
  }
}

/**
 * Get followers of a user
 */
export async function getFollowers(userId: string): Promise<Follower[]> {
  if (!isSupabaseConfigured()) {
    const followers = lsGet<any[]>(LS_FOLLOWERS, []);
    const users = lsGet<UserProfile[]>(LS_USERS, []);
    return followers
      .filter(f => f.followed_id === userId)
      .map(f => ({
        ...f,
        follower: users.find(u => u.id === f.follower_id) || null,
      }))
      .sort((a, b) => new Date(b.followed_at).getTime() - new Date(a.followed_at).getTime());
  }
  try {
    const { data, error } = await supabase
      .from('followers')
      .select('*, follower:user_profiles!followers_follower_id_fkey(*)')
      .eq('followed_id', userId)
      .order('followed_at', { ascending: false });
    if (error) {
      if (shouldMockOnError(error)) {
        const followers = lsGet<any[]>(LS_FOLLOWERS, []);
        const users = lsGet<UserProfile[]>(LS_USERS, []);
        return followers
          .filter(f => f.followed_id === userId)
          .map(f => ({
            ...f,
            follower: users.find(u => u.id === f.follower_id) || null,
          }))
          .sort((a, b) => new Date(b.followed_at).getTime() - new Date(a.followed_at).getTime());
      }
      throw error;
    }
    return data || [];
  } catch (e: any) {
    if (shouldMockOnError(e)) {
      const followers = lsGet<any[]>(LS_FOLLOWERS, []);
      const users = lsGet<UserProfile[]>(LS_USERS, []);
      return followers
        .filter(f => f.followed_id === userId)
        .map(f => ({
          ...f,
          follower: users.find(u => u.id === f.follower_id) || null,
        }))
        .sort((a, b) => new Date(b.followed_at).getTime() - new Date(a.followed_at).getTime());
    }
    throw e;
  }
}

/**
 * Get users that a user is following
 */
export async function getFollowing(userId: string): Promise<Follower[]> {
  if (!isSupabaseConfigured()) {
    const followers = lsGet<any[]>(LS_FOLLOWERS, []);
    const users = lsGet<UserProfile[]>(LS_USERS, []);
    return followers
      .filter(f => f.follower_id === userId)
      .map(f => ({
        ...f,
        followed: users.find(u => u.id === f.followed_id) || null,
      }))
      .sort((a, b) => new Date(b.followed_at).getTime() - new Date(a.followed_at).getTime());
  }
  try {
    const { data, error } = await supabase
      .from('followers')
      .select('*, followed:user_profiles!followers_followed_id_fkey(*)')
      .eq('follower_id', userId)
      .order('followed_at', { ascending: false });
    if (error) {
      if (shouldMockOnError(error)) {
        const followers = lsGet<any[]>(LS_FOLLOWERS, []);
        const users = lsGet<UserProfile[]>(LS_USERS, []);
        return followers
          .filter(f => f.follower_id === userId)
          .map(f => ({
            ...f,
            followed: users.find(u => u.id === f.followed_id) || null,
          }))
          .sort((a, b) => new Date(b.followed_at).getTime() - new Date(a.followed_at).getTime());
      }
      throw error;
    }
    return data || [];
  } catch (e: any) {
    if (shouldMockOnError(e)) {
      const followers = lsGet<any[]>(LS_FOLLOWERS, []);
      const users = lsGet<UserProfile[]>(LS_USERS, []);
      return followers
        .filter(f => f.follower_id === userId)
        .map(f => ({
          ...f,
          followed: users.find(u => u.id === f.followed_id) || null,
        }))
        .sort((a, b) => new Date(b.followed_at).getTime() - new Date(a.followed_at).getTime());
    }
    throw e;
  }
}

/**
 * Check if user A follows user B
 */
export async function isFollowing(followerId: string, followedId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const followers = lsGet<any[]>(LS_FOLLOWERS, []);
    return followers.some(
      f => f.follower_id === followerId && f.followed_id === followedId
    );
  }
  try {
    const { data, error } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', followerId)
      .eq('followed_id', followedId)
      .maybeSingle();
    if (error) {
      if (shouldMockOnError(error)) {
        const followers = lsGet<any[]>(LS_FOLLOWERS, []);
        return followers.some(
          f => f.follower_id === followerId && f.followed_id === followedId
        );
      }
      throw error;
    }
    return !!data;
  } catch (e: any) {
    if (shouldMockOnError(e)) {
      const followers = lsGet<any[]>(LS_FOLLOWERS, []);
      return followers.some(
        f => f.follower_id === followerId && f.followed_id === followedId
      );
    }
    throw e;
  }
}

/**
 * Get mutual followers (friends)
 */
export async function getMutualFollowers(userId: string): Promise<UserProfile[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  try {
    // Get users that both follow each other
    // Use manual query since RPC function may not exist
    const following = await getFollowing(userId);
    const followers = await getFollowers(userId);
    
    const followingIds = new Set((following || []).map(f => f.followed_id));
    const mutualIds = (followers || [])
      .filter(f => followingIds.has(f.follower_id))
      .map(f => f.follower_id);
    
    if (mutualIds.length === 0) return [];
    
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('*')
      .in('id', mutualIds);
    
    if (usersError) throw usersError;
    return users || [];
  } catch (e: any) {
    throw e;
  }
}

// ========== BADGE TEMPLATES API ==========

/**
 * Create badge template (admin only)
 */
export async function createBadgeTemplate(template: Partial<BadgeTemplate>): Promise<BadgeTemplate> {
  if (!isSupabaseConfigured()) {
    const now = new Date().toISOString();
    return {
      id: uuid(),
      name: template.name!,
      description: template.description || null,
      category: template.category || null,
      metadata_uri: template.metadata_uri || null,
      image_url: template.image_url || null,
      created_by: template.created_by || null,
      is_active: template.is_active ?? true,
      created_at: now,
      updated_at: now,
    };
  }
  try {
    const { data, error } = await supabase
      .from('badge_templates')
      .insert(template)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e: any) {
    throw e;
  }
}

/**
 * Get all badge templates
 */
export async function getBadgeTemplates(): Promise<BadgeTemplate[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('badge_templates')
      .select('*, user_profiles(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e: any) {
    throw e;
  }
}

