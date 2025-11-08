import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getPendingOrganizerApplications,
  approveOrganizer,
  rejectOrganizer,
  getAllEvents,
  updateEventFeaturedStatus,
  getAchievements,
  verifyAchievement,
  rejectAchievement,
} from '@/lib/api';
import { registerOrganizer } from '@/lib/sui';
import type { UserProfile, Event, Achievement } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AchievementCard } from '@/components/AchievementCard';
import { Check, X, Users, Calendar, Award, Star, Shield, Loader2 } from 'lucide-react';

interface EventFeaturedControlsProps {
  event: Event;
  onUpdate: () => void;
}

function EventFeaturedControls({ event, onUpdate }: EventFeaturedControlsProps) {
  const [isFeatured, setIsFeatured] = useState(event.is_featured ?? false);
  const [priority, setPriority] = useState(event.featured_priority ?? 0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [priorityInput, setPriorityInput] = useState(String(event.featured_priority ?? 0));

  const handleToggleFeatured = async () => {
    setIsUpdating(true);
    try {
      await updateEventFeaturedStatus(event.id, !isFeatured, priority);
      setIsFeatured(!isFeatured);
      onUpdate();
    } catch (error) {
      console.error('Error updating featured status:', error);
      alert('Error updating featured status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority: number) => {
    if (newPriority === priority) return;
    setIsUpdating(true);
    try {
      await updateEventFeaturedStatus(event.id, isFeatured, newPriority);
      setPriority(newPriority);
      onUpdate();
    } catch (error) {
      console.error('Error updating priority:', error);
      alert('Error updating priority');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriorityInputBlur = () => {
    const numValue = parseInt(priorityInput, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      handlePriorityChange(numValue);
    } else {
      setPriorityInput(String(priority));
    }
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold">{event.name}</h3>
            {isFeatured && (
              <span className="flex items-center gap-1 bg-gradient-to-r from-[#ff3800] to-[#ff6b35] text-white px-2 py-1 rounded-full text-xs font-bold">
                <Star className="h-3 w-3 fill-current" />
                FEATURED
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Organizer: {event.user_profiles?.display_name || 'Unknown'}
          </p>
          <p className="text-sm text-gray-500">Status: {event.status}</p>
        </div>
        <div className="flex flex-col gap-3 items-end">
          <Button
            variant={isFeatured ? 'default' : 'outline'}
            size="sm"
            onClick={handleToggleFeatured}
            disabled={isUpdating}
            className={isFeatured ? 'bg-gradient-to-r from-[#ff3800] to-[#ff6b35] hover:from-[#ff6b35] hover:to-[#ff3800] text-white' : ''}
          >
            <Star className={`h-4 w-4 mr-1 ${isFeatured ? 'fill-current' : ''}`} />
            {isFeatured ? 'Featured' : 'Feature Event'}
          </Button>
          {isFeatured && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Priority:</label>
              <Input
                type="number"
                min="0"
                value={priorityInput}
                onChange={(e) => setPriorityInput(e.target.value)}
                onBlur={handlePriorityInputBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePriorityInputBlur();
                  }
                }}
                className="w-20"
                disabled={isUpdating}
              />
              <span className="text-xs text-gray-500">(Higher = first)</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function AdminPanel() {
  const { user, walletAddress } = useAuth();
  const [pendingApplications, setPendingApplications] = useState<UserProfile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'applications' | 'events' | 'achievements' | 'analytics'>('applications');
  const [verifying, setVerifying] = useState<Set<string>>(new Set());
  const [registering, setRegistering] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.is_admin) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apps, evts, achievements] = await Promise.all([
        getPendingOrganizerApplications(),
        getAllEvents({ limit: 50 }),
        getAchievements({ status: 'pending' }),
      ]);
      setPendingApplications(apps);
      setEvents(evts);
      setPendingAchievements(achievements as Achievement[]);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string, walletAddress: string) => {
    try {
      // First approve in database
      await approveOrganizer(userId);
      
      // Then register on-chain if wallet address is available
      if (walletAddress && walletAddress !== '0x0') {
        setRegistering(prev => new Set(prev).add(userId));
        try {
          const result = await registerOrganizer(walletAddress);
          console.log('Organizer registered on-chain:', result);
          if (result.created) {
            alert(`Organizer approved and registered on-chain successfully!\n\nOrganizerCap Object ID: ${result.created}\n\nPlease save this ID - the organizer will need it to mint clearances.`);
          } else {
            alert('Organizer approved and registered on-chain successfully!');
          }
        } catch (onChainError: any) {
          console.error('Error registering on-chain:', onChainError);
          alert(`Organizer approved in database, but on-chain registration failed.\n\nError: ${onChainError.message || 'Unknown error'}\n\nYou can register them manually later.`);
        } finally {
          setRegistering(prev => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
          });
        }
      }
      
      await loadData();
    } catch (error) {
      console.error('Error approving organizer:', error);
      alert('Error approving organizer');
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm('Are you sure you want to reject this organizer application?')) {
      return;
    }
    try {
      await rejectOrganizer(userId);
      await loadData();
    } catch (error) {
      console.error('Error rejecting organizer:', error);
      alert('Error rejecting organizer');
    }
  };

  const handleVerifyAchievement = async (achievementId: string) => {
    if (!walletAddress) {
      alert('Please connect your wallet to verify achievements');
      return;
    }

    setVerifying(prev => new Set(prev).add(achievementId));
    try {
      await verifyAchievement(achievementId, walletAddress);
      await loadData();
    } catch (error) {
      console.error('Error verifying achievement:', error);
      alert('Error verifying achievement');
    } finally {
      setVerifying(prev => {
        const next = new Set(prev);
        next.delete(achievementId);
        return next;
      });
    }
  };

  const handleRejectAchievement = async (achievementId: string) => {
    if (!confirm('Are you sure you want to reject this achievement?')) {
      return;
    }

    setVerifying(prev => new Set(prev).add(achievementId));
    try {
      await rejectAchievement(achievementId);
      await loadData();
    } catch (error) {
      console.error('Error rejecting achievement:', error);
      alert('Error rejecting achievement');
    } finally {
      setVerifying(prev => {
        const next = new Set(prev);
        next.delete(achievementId);
        return next;
      });
    }
  };

  // Unused function - kept for potential future use
  // const handleRevoke = async (userId: string) => {
  //   if (!confirm('Are you sure you want to revoke organizer privileges?')) return;
  //   try {
  //     await revokeOrganizer(userId);
  //     await loadData();
  //   } catch (error) {
  //     console.error('Error revoking organizer:', error);
  //     alert('Error revoking organizer');
  //   }
  // };

  if (!user?.is_admin) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  const stats = {
    totalEvents: events.length,
    upcomingEvents: events.filter(e => e.status === 'upcoming').length,
    completedEvents: events.filter(e => e.status === 'completed').length,
    pendingApplications: pendingApplications.length,
    pendingAchievements: pendingAchievements.length,
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Admin Panel</h1>

      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'applications' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('applications')}
        >
          Applications ({pendingApplications.length})
        </Button>
        <Button
          variant={activeTab === 'achievements' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('achievements')}
        >
          <Shield className="h-4 w-4 mr-2" />
          Verify Achievements ({pendingAchievements.length})
        </Button>
        <Button
          variant={activeTab === 'events' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('events')}
        >
          Events ({events.length})
        </Button>
        <Button
          variant={activeTab === 'analytics' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </Button>
      </div>

      {activeTab === 'applications' && (
        <div className="space-y-4">
          {pendingApplications.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No pending applications</p>
            </Card>
          ) : (
            pendingApplications.map((app) => (
              <Card key={app.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold">{app.display_name || 'Unknown'}</h3>
                    <p className="text-sm text-gray-500 font-mono">{app.wallet_address}</p>
                    {app.bio && <p className="mt-2 text-sm">{app.bio}</p>}
                    {app.school_name && (
                      <p className="text-sm text-gray-600 mt-1">School: {app.school_name}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(app.id, app.wallet_address)}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={registering.has(app.id)}
                    >
                      {registering.has(app.id) ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Approve & Register
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(app.id)}
                      disabled={registering.has(app.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="space-y-4">
          {pendingAchievements.length === 0 ? (
            <Card className="p-8 text-center">
              <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500">All caught up! No pending achievements to verify.</p>
            </Card>
          ) : (
            pendingAchievements.map((achievement) => (
              <Card key={achievement.id} className="overflow-hidden">
                <AchievementCard achievement={achievement} showActions={false} />
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleRejectAchievement(achievement.id)}
                    className="text-red-600 hover:text-red-700"
                    disabled={verifying.has(achievement.id)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleVerifyAchievement(achievement.id)}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={verifying.has(achievement.id) || !walletAddress}
                  >
                    {verifying.has(achievement.id) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Verify & Mint
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'events' && (
        <div className="space-y-4">
          {events.map((event) => (
            <EventFeaturedControls key={event.id} event={event} onUpdate={loadData} />
          ))}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div className="text-sm text-gray-500">Total Events</div>
            </div>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <div className="text-sm text-gray-500">Upcoming</div>
            </div>
            <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-purple-600" />
              <div className="text-sm text-gray-500">Completed</div>
            </div>
            <div className="text-2xl font-bold">{stats.completedEvents}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-orange-600" />
              <div className="text-sm text-gray-500">Pending Apps</div>
            </div>
            <div className="text-2xl font-bold">{stats.pendingApplications}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-red-600" />
              <div className="text-sm text-gray-500">Pending Verify</div>
            </div>
            <div className="text-2xl font-bold">{stats.pendingAchievements}</div>
          </Card>
        </div>
      )}
    </div>
  );
}

