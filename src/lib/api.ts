import { supabase } from './supabase';
import type { Achievement, UserProfile, PeerTag } from '../types';

// --- Lightweight client-side mock fallback when Supabase isn't configured ---
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

export async function verifyAchievement(achievementId: string, verifierAddress: string, suiTxId?: string) {
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

// Feed API (get achievements from friends)
export async function getFeedAchievements(userId: string, limit = 20) {
  if (!isSupabaseConfigured()) {
    // Very simple mock: show all verified achievements by any user
    const all = (await getAchievements({ status: 'verified', limit })) as Achievement[];
    return all;
  }
  try {
    // Get accepted friendships
    const { data: friendships, error: friendsError } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (friendsError) {
      if (shouldMockOnError(friendsError)) {
        const all = (await getAchievements({ status: 'verified', limit })) as Achievement[];
        return all;
      }
      throw friendsError;
    }

    const friendIds = friendships?.flatMap((f: any) =>
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

