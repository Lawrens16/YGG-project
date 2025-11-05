import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile, listPendingFriendRequests, acceptFriendRequest, rejectFriendRequest } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import type { UserProfile } from '@/types';

export function Settings() {
  const { user, updateUser, loading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    display_name: user?.display_name || '',
    bio: user?.bio || '',
    school_name: user?.school_name || '',
    course_name: user?.course_name || '',
    privacy_level: user?.privacy_level || 'friends',
  });
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);

  async function loadRequests() {
    if (!user) return;
    setLoadingRequests(true);
    try {
      const data = await listPendingFriendRequests(user.id);
      setPendingRequests(data);
    } catch (e) {
      console.error('Failed to load friend requests', e);
    } finally {
      setLoadingRequests(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Checking wallet connection...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Please connect your wallet to access settings.</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (!user) return;
      await updateUserProfile(user.id, formData);
      updateUser(formData);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <Avatar
              src={user.avatar_url || undefined}
              alt={user.display_name || 'User'}
              className="w-20 h-20"
            />
            <div>
              <p className="font-semibold text-gray-900">Avatar</p>
              <p className="text-sm text-gray-500">Update your profile picture</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wallet Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">Wallet Address</p>
              <p className="font-mono text-sm text-gray-900 break-all">{user.wallet_address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Is Organizer</p>
              <p className="text-sm text-gray-900">{user.is_organizer ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Pending Friend Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <p className="text-gray-500">Loading...</p>
          ) : pendingRequests.length === 0 ? (
            <p className="text-gray-500">No pending requests.</p>
          ) : (
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
                        await loadRequests();
                      }}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await rejectFriendRequest(req.id);
                        await loadRequests();
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

