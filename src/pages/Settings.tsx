import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile, listPendingFriendRequests, acceptFriendRequest, rejectFriendRequest, applyForOrganizer } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Code, AlertTriangle, Users, CheckCircle, XCircle, Clock, Send } from 'lucide-react';
import type { UserProfile } from '@/types';

export function Settings() {
  const { user, updateUser, loading, walletAddress, adoptWalletAddress } = useAuth();
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
  const [devMode, setDevMode] = useState(() => {
    return localStorage.getItem('dev_mode_skip_verification') === 'true';
  });
  const [applying, setApplying] = useState(false);
  const [applicationReason, setApplicationReason] = useState('');

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

  async function handleApply() {
    if (!user || !walletAddress) return;
    
    setApplying(true);
    try {
      await applyForOrganizer(user.id, {
        reason: applicationReason,
      });
      
      // Reload user data to get updated application status
      await adoptWalletAddress(walletAddress);
      
      alert('Application submitted successfully! Your application is now pending review by an administrator.');
      setApplicationReason('');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      alert(`Failed to submit application: ${error.message || 'Unknown error'}`);
    } finally {
      setApplying(false);
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

      {/* Organizer Application */}
      {!user.is_organizer && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Become a Verified Organizer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user.organizer_application_status === 'pending' && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <p className="font-semibold text-blue-900 dark:text-blue-100">Application Pending</p>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Your application to become a verified organizer is currently under review. 
                    You will be notified once an administrator reviews your application.
                  </p>
                </div>
              )}

              {user.organizer_application_status === 'approved' && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <p className="font-semibold text-green-900 dark:text-green-100">Application Approved</p>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Congratulations! Your organizer application has been approved. 
                    You can now create and manage events.
                  </p>
                </div>
              )}

              {user.organizer_application_status === 'rejected' && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <p className="font-semibold text-red-900 dark:text-red-100">Application Rejected</p>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                    Your organizer application was not approved. You can submit a new application if you'd like.
                  </p>
                  <Button
                    onClick={handleApply}
                    disabled={applying}
                    variant="outline"
                    size="sm"
                  >
                    {applying ? 'Submitting...' : 'Submit New Application'}
                  </Button>
                </div>
              )}

              {!user.organizer_application_status && (
                <>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      As a verified organizer, you can:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 ml-2">
                      <li>Create and manage events</li>
                      <li>Verify attendee participation</li>
                      <li>Mint custom clearance NFTs for attendees</li>
                      <li>Issue event badges and certificates</li>
                    </ul>
                  </div>

                  <div>
                    <label htmlFor="application_reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Why do you want to become an organizer? (Optional)
                    </label>
                    <Textarea
                      id="application_reason"
                      value={applicationReason}
                      onChange={(e) => setApplicationReason(e.target.value)}
                      rows={4}
                      placeholder="Tell us about your event organizing experience, planned events, or any other relevant information..."
                      className="mb-3"
                    />
                  </div>

                  <Button
                    onClick={handleApply}
                    disabled={applying}
                    className="w-full"
                  >
                    {applying ? (
                      'Submitting Application...'
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Apply to Become an Organizer
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your application will be reviewed by an administrator. You'll be notified of the decision.
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Already an Organizer */}
      {user.is_organizer && (
        <Card className="mt-6 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              Verified Organizer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-300">
                You are a verified organizer! You can create and manage events from the Organizer Dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Dev Settings */}
      <Card className="mt-6 border-yellow-200 dark:border-yellow-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            Developer Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">
                    Skip Image Verification Constraints
                  </p>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  When enabled, GPS and timestamp verification will be bypassed for testing purposes.
                </p>
              </div>
              <Switch
                checked={devMode}
                onCheckedChange={(checked) => {
                  setDevMode(checked);
                  localStorage.setItem('dev_mode_skip_verification', checked ? 'true' : 'false');
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

