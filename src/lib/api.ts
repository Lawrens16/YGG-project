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

// Feed API (get achievements from mutual followers/friends)
export async function getFeedAchievements(userId: string, limit = 20) {
  if (!isSupabaseConfigured()) {
    // Very simple mock: show all verified achievements by any user
    const all = (await getAchievements({ status: 'verified', limit })) as Achievement[];
    return all;
  }
  try {
    // Get mutual followers (friends)
    const mutualFriends = await getMutualFollowers(userId);
    const friendIds = mutualFriends.map(f => f.id);

    // Get achievements from friends (public or friends-only)
    const { data, error } = await supabase
      .from('achievements')
      .select('*, user_profiles(*)')
      .in('user_id', friendIds.length > 0 ? friendIds : ['00000000-0000-0000-0000-000000000000'])
      .in('status', ['verified'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (shouldMockOnError(error)) {
        const all = (await getAchievements({ status: 'verified', limit })) as Achievement[];
        return all;
      }
      throw error;
    }
    return data || [];
  } catch (e: any) {
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
    const registrationIds = registrations?.map(r => r.id) || [];
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
export async function applyForOrganizer(userId: string, applicationData: any): Promise<UserProfile> {
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
    const now = new Date().toISOString();
    return {
      id: uuid(),
      follower_id: followerId,
      followed_id: followedId,
      followed_at: now,
    };
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
    if (error) throw error;
    return data;
  } catch (e: any) {
    throw e;
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, followedId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }
  try {
    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', followerId)
      .eq('followed_id', followedId);
    if (error) throw error;
  } catch (e: any) {
    throw e;
  }
}

/**
 * Get followers of a user
 */
export async function getFollowers(userId: string): Promise<Follower[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('followers')
      .select('*, follower:user_profiles!followers_follower_id_fkey(*)')
      .eq('followed_id', userId)
      .order('followed_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e: any) {
    throw e;
  }
}

/**
 * Get users that a user is following
 */
export async function getFollowing(userId: string): Promise<Follower[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('followers')
      .select('*, followed:user_profiles!followers_followed_id_fkey(*)')
      .eq('follower_id', userId)
      .order('followed_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e: any) {
    throw e;
  }
}

/**
 * Check if user A follows user B
 */
export async function isFollowing(followerId: string, followedId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }
  try {
    const { data, error } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', followerId)
      .eq('followed_id', followedId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  } catch (e: any) {
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
    const { data, error } = await supabase
      .rpc('get_mutual_followers', { user_id: userId });
    
    if (error) {
      // Fallback: manual query
      const { data: following } = await getFollowing(userId);
      const { data: followers } = await getFollowers(userId);
      
      const followingIds = new Set(following.map(f => f.followed_id));
      const mutualIds = followers
        .filter(f => followingIds.has(f.follower_id))
        .map(f => f.follower_id);
      
      if (mutualIds.length === 0) return [];
      
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', mutualIds);
      
      if (usersError) throw usersError;
      return users || [];
    }
    
    return data || [];
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

