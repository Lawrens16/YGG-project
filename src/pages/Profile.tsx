import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, getAchievements, isFollowing, followUser, unfollowUser, updateUserProfile, listPendingFriendRequests, acceptFriendRequest, rejectFriendRequest } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AchievementCard } from '@/components/AchievementCard';
import { Award, Calendar, UserPlus, Settings, Camera, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { uploadFile, STORAGE_BUCKETS } from '@/lib/storage';
import type { UserProfile, Achievement } from '@/types';

export function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const [loadingRequests, setLoadingRequests] = useState(false);
  
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
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Profile not found.</p>
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
        <CardContent className="pt-20 pb-6 relative z-10 bg-white">
          <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative -mt-16">
              <Avatar
                src={profile.avatar_url || undefined}
                alt={profile.display_name || 'User'}
                className="w-24 h-24 border-4 border-white shadow-lg"
              />
              {isOwnProfile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full bg-white border-2 border-gray-200 hover:bg-gray-50 shadow-sm"
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profile.display_name || 'Anonymous'}
              </h1>
              {profile.bio && (
                <p className="text-gray-600 mb-4">{profile.bio}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
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
                <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
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
                <label htmlFor="school_name" className="block text-sm font-medium text-gray-700 mb-2">
                  School Name
                </label>
                <Input
                  id="school_name"
                  value={formData.school_name}
                  onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="course_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name
                </label>
                <Input
                  id="course_name"
                  value={formData.course_name}
                  onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="privacy_level" className="block text-sm font-medium text-gray-700 mb-2">
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
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-4">Pending Friend Requests</h3>
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center space-x-3">
                        <Avatar
                          src={(req.requester as UserProfile)?.avatar_url || undefined}
                          alt={(req.requester as UserProfile)?.display_name || 'User'}
                          className="w-10 h-10"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{(req.requester as UserProfile)?.display_name || 'Anonymous'}</p>
                          <p className="text-xs text-gray-500">sent you a friend request</p>
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
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-4">Wallet Information</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Wallet Address</p>
                  <p className="font-mono text-sm text-gray-900 break-all">{profile.wallet_address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Is Organizer</p>
                  <p className="text-sm text-gray-900">{profile.is_organizer ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Skill Points</p>
                <p className="text-3xl font-bold text-gray-900">{profile.skill_points}</p>
              </div>
              <Award className="w-10 h-10 text-[#ff3800]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Achievements</p>
                <p className="text-3xl font-bold text-gray-900">{achievements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Achievements</h2>
        {achievements.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No achievements yet.</p>
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

