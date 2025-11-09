import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, getAchievements, isFollowing, followUser, unfollowUser, updateUserProfile, listPendingFriendRequests, acceptFriendRequest, rejectFriendRequest, getMilestoneProgress, unpinMilestone, type MilestoneProgress } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AchievementCard } from '@/components/AchievementCard';
import { Award, Calendar, UserPlus, Settings, Camera, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { uploadFile, STORAGE_BUCKETS } from '@/lib/storage';
import type { UserProfile, Achievement } from '@/types';
import { PinOff } from 'lucide-react';

export function Profile() {
  const { id } = useParams();
  // const navigate = useNavigate(); // Unused but kept for potential navigation needs
  const { user: currentUser, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [_loadingRequests, setLoadingRequests] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    school_name: '',
    course_name: '',
    privacy_level: 'friends' as 'private' | 'friends' | 'public',
  });

  useEffect(() => {
    if (id) {
      loadProfile();
      if (currentUser?.id === id) {
        loadPendingRequests();
      }
    }
  }, [id, currentUser]);

  async function loadProfile() {
    if (!id) return;
    setLoading(true);
    try {
      const profileData = await getUserProfile(id);
      setProfile(profileData);
      setFormData({
        display_name: profileData.display_name || '',
        bio: profileData.bio || '',
        school_name: profileData.school_name || '',
        course_name: profileData.course_name || '',
        privacy_level: profileData.privacy_level || 'friends',
      });

      const achievementsData = await getAchievements({ userId: id });
      setAchievements(achievementsData as Achievement[]);

      if (currentUser && id && currentUser.id !== id) {
        const following = await isFollowing(currentUser.id, id);
        setIsFollowingUser(following);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPendingRequests() {
    if (!currentUser) return;
    setLoadingRequests(true);
    try {
      const data = await listPendingFriendRequests(currentUser.id);
      setPendingRequests(data);
    } catch (e) {
      console.error('Failed to load friend requests', e);
    } finally {
      setLoadingRequests(false);
    }
  }

  async function handleFollow() {
    if (!currentUser || !profile || followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowingUser) {
        await unfollowUser(currentUser.id, profile.id);
        setIsFollowingUser(false);
      } else {
        await followUser(currentUser.id, profile.id);
        setIsFollowingUser(true);
      }
    } catch (e) {
      console.error('Failed to follow/unfollow', e);
      alert('Failed to follow/unfollow user.');
    } finally {
      setFollowLoading(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !profile || currentUser.id !== profile.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-avatar-${Date.now()}.${fileExt}`;
      
      // Upload using storage helper with automatic bucket fallback
      const { url: publicUrl } = await uploadFile(
        file,
        fileName,
        STORAGE_BUCKETS.AVATARS,
        [STORAGE_BUCKETS.ACHIEVEMENT_PHOTOS]
      );

      // Update user profile with new avatar URL
      try {
        await updateUserProfile(currentUser.id, { avatar_url: publicUrl });
        setProfile({ ...profile, avatar_url: publicUrl });
        updateUser({ avatar_url: publicUrl });
      } catch (updateError: any) {
        console.error('Error updating profile:', updateError);
        // If update fails but upload succeeded, still show success
        // The file is uploaded, just the profile update failed
        alert('File uploaded but failed to update profile. Error: ' + (updateError?.message || 'Unknown error'));
        throw updateError;
      }
      
      // Reset the input so the same file can be selected again
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      const errorMessage = error?.message || 'Failed to upload avatar. Please try again.';
      alert(errorMessage);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !profile || currentUser.id !== profile.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB for banners)
    if (file.size > 10 * 1024 * 1024) {
      alert('Banner size must be less than 10MB');
      return;
    }

    setUploadingBanner(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-banner-${Date.now()}.${fileExt}`;
      
      // Upload using storage helper with automatic bucket fallback
      const { url: publicUrl } = await uploadFile(
        file,
        fileName,
        STORAGE_BUCKETS.BANNERS,
        [STORAGE_BUCKETS.ACHIEVEMENT_PHOTOS]
      );

      // Update user profile with new banner URL
      try {
        await updateUserProfile(currentUser.id, { banner_url: publicUrl });
        setProfile({ ...profile, banner_url: publicUrl });
        updateUser({ banner_url: publicUrl });
      } catch (updateError: any) {
        console.error('Error updating profile:', updateError);
        // If update fails but upload succeeded, still show success
        // The file is uploaded, just the profile update failed
        alert('File uploaded but failed to update profile. Error: ' + (updateError?.message || 'Unknown error'));
        throw updateError;
      }
      
      // Reset the input so the same file can be selected again
      if (bannerInputRef.current) {
        bannerInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading banner:', error);
      const errorMessage = error?.message || 'Failed to upload banner. Please try again.';
      alert(errorMessage);
    } finally {
      setUploadingBanner(false);
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !profile || currentUser.id !== profile.id) return;
    
    setSaving(true);
    try {
      await updateUserProfile(currentUser.id, formData);
      setProfile({ ...profile, ...formData });
      updateUser(formData);
      setShowSettings(false);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400">Profile not found.</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <Card className="mb-6 overflow-visible">
        <div className="relative h-48 bg-gradient-to-r from-[#ff3800] to-[#ff5500] overflow-hidden">
          {profile.banner_url && (
            <img
              src={profile.banner_url}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          )}
          {isOwnProfile && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white z-20"
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingBanner}
            >
              <Camera className="h-4 w-4 mr-2" />
              {uploadingBanner ? 'Uploading...' : 'Edit Banner'}
            </Button>
          )}
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerUpload}
            className="hidden"
          />
        </div>
        <CardContent className="pt-20 pb-6 relative z-10 bg-card">
          <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative -mt-16">
              <Avatar
                src={profile.avatar_url || undefined}
                alt={profile.display_name || 'User'}
                className="w-24 h-24 border-4 border-card shadow-lg"
              />
              {isOwnProfile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full bg-card border-2 border-border hover:bg-muted shadow-sm"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {profile.display_name || 'Anonymous'}
              </h1>
              {profile.bio && (
                <p className="text-muted-foreground mb-4">{profile.bio}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {profile.school_name && (
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {profile.school_name}
                  </span>
                )}
                {profile.course_name && (
                  <span>{profile.course_name}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {isOwnProfile ? (
                <Button onClick={() => setShowSettings(!showSettings)} variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              ) : (
                <Button onClick={handleFollow} disabled={followLoading}>
                  {isFollowingUser ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Panel */}
      {showSettings && isOwnProfile && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Name
                </label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                />
              </div>

              <div>
                <label htmlFor="school_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  School Name
                </label>
                <Input
                  id="school_name"
                  value={formData.school_name}
                  onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="course_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course Name
                </label>
                <Input
                  id="course_name"
                  value={formData.course_name}
                  onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="privacy_level" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Privacy Level
                </label>
                <select
                  id="privacy_level"
                  value={formData.privacy_level}
                  onChange={(e) => setFormData({ ...formData, privacy_level: e.target.value as any })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="private">Private</option>
                  <option value="friends">Friends Only</option>
                  <option value="public">Public</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowSettings(false)}>
                  Cancel
                </Button>
              </div>
            </form>

            {/* Pending Friend Requests */}
            {pendingRequests.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="font-semibold mb-4 text-foreground">Pending Friend Requests</h3>
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-3 border border-border rounded-md bg-card">
                      <div className="flex items-center space-x-3">
                        <Avatar
                          src={(req.requester as UserProfile)?.avatar_url || undefined}
                          alt={(req.requester as UserProfile)?.display_name || 'User'}
                          className="w-10 h-10"
                        />
                        <div>
                          <p className="font-medium text-foreground">{(req.requester as UserProfile)?.display_name || 'Anonymous'}</p>
                          <p className="text-xs text-muted-foreground">sent you a friend request</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            await acceptFriendRequest(req.id);
                            await loadPendingRequests();
                          }}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await rejectFriendRequest(req.id);
                            await loadPendingRequests();
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wallet Information */}
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="font-semibold mb-4 text-foreground">Wallet Information</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Address</p>
                  <p className="font-mono text-sm text-foreground break-all">{profile.wallet_address}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Is Organizer</p>
                  <p className="text-sm text-foreground">{profile.is_organizer ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pinned Milestones */}
      {profile.pinned_milestones && profile.pinned_milestones.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Pinned Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PinnedMilestonesSection 
              userId={profile.id} 
              pinnedIds={profile.pinned_milestones} 
              isOwnProfile={isOwnProfile}
              onUnpin={async (milestoneId) => {
                if (currentUser) {
                  try {
                    const updatedProfile = await unpinMilestone(currentUser.id, milestoneId);
                    setProfile(updatedProfile);
                    updateUser(updatedProfile);
                  } catch (error) {
                    console.error('Error unpinning milestone:', error);
                    alert('Failed to unpin milestone');
                  }
                }
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Achievements Grid */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Achievements</h2>
        {achievements.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No achievements yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {achievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PinnedMilestonesSection({ 
  userId, 
  pinnedIds, 
  isOwnProfile = false,
  onUnpin 
}: { 
  userId: string; 
  pinnedIds: string[]; 
  isOwnProfile?: boolean;
  onUnpin?: (milestoneId: string) => Promise<void>;
}) {
  const [milestones, setMilestones] = useState<MilestoneProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMilestones();
  }, [userId, pinnedIds]);

  const loadMilestones = async () => {
    try {
      setLoading(true);
      const allMilestones = await getMilestoneProgress(userId);
      // Filter to only show pinned milestones, but also include any pinned IDs that aren't in the current list
      const milestoneMap = new Map(allMilestones.map(m => [m.id, m]));
      const pinned: MilestoneProgress[] = [];
      
      // Add milestones that are in the current list
      pinnedIds.forEach(id => {
        const milestone = milestoneMap.get(id);
        if (milestone) {
          pinned.push(milestone);
        } else {
          // If milestone is pinned but not in current list (e.g., reset), create a placeholder
          pinned.push({
            id,
            name: id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            description: 'This milestone is no longer active',
            category: 'participation',
            current: 0,
            target: 1,
            completed: false,
          });
        }
      });
      
      setMilestones(pinned);
    } catch (error) {
      console.error('Error loading pinned milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const milestoneIcons: Record<string, any> = {
    new_explorer: Award,
    regular_attendee: Award,
    event_veteran: Award,
    marathon_attendee: Award,
    category_collector: Award,
    long_term_member: Award,
    verified_supporter: Award,
    social_starter: Award,
    community_builder: Award,
    badge_collector: Award,
    feedback_giver: Award,
    top_reviewer: Award,
    active_week: Award,
    event_promoter: Award,
  };

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Loading milestones...</div>;
  }

  if (milestones.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No pinned milestones yet.</div>;
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {milestones.map((milestone) => {
        const Icon = milestoneIcons[milestone.id] || Award;
        return (
          <div
            key={milestone.id}
            className={`p-4 rounded-lg border-2 ${
              milestone.completed 
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                milestone.completed 
                  ? 'bg-green-100 dark:bg-green-900/40' 
                  : 'bg-yellow-100 dark:bg-yellow-900/40'
              }`}>
                <Icon className={`w-5 h-5 ${milestone.completed ? 'text-green-600' : 'text-yellow-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                      {milestone.name}
                    </h3>
                    {!milestone.completed && (
                      <Badge variant="secondary" className="text-xs">
                        Incomplete
                      </Badge>
                    )}
                  </div>
                  {isOwnProfile && onUnpin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUnpin(milestone.id)}
                      className="h-6 px-2 text-xs"
                      title="Unpin from profile"
                    >
                      <PinOff className="w-3 h-3 text-gray-400" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {milestone.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

