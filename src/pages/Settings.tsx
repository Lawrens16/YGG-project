import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';

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
    </div>
  );
}

