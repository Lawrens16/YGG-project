import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  Calendar, 
  Users, 
  MessageSquare, 
  Heart, 
  Share2, 
  Trophy,
  Target,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { getMilestoneProgress, pinMilestone, unpinMilestone, getUserProfile, type MilestoneProgress } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pin, PinOff } from 'lucide-react';

const categoryIcons: Record<string, any> = {
  participation: Calendar,
  interaction: Users,
};

const milestoneIcons: Record<string, any> = {
  new_explorer: Target,
  regular_attendee: Calendar,
  event_veteran: Trophy,
  marathon_attendee: Award,
  category_collector: Award,
  long_term_member: Trophy,
  verified_supporter: Users,
  social_starter: Users,
  community_builder: Users,
  badge_collector: Award,
  feedback_giver: MessageSquare,
  top_reviewer: Heart,
  active_week: Calendar,
  event_promoter: Share2,
};

export function Milestones() {
  const { user, loading, updateUser } = useAuth();
  const [milestones, setMilestones] = useState<MilestoneProgress[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(true);
  const [pinnedMilestones, setPinnedMilestones] = useState<string[]>([]);
  const [pinning, setPinning] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadMilestones();
      loadPinnedMilestones();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only reload when user ID changes, not when user object reference changes

  const loadMilestones = async () => {
    if (!user) return;
    try {
      setLoadingMilestones(true);
      const data = await getMilestoneProgress(user.id);
      setMilestones(data);
    } catch (error) {
      console.error('Error loading milestones:', error);
    } finally {
      setLoadingMilestones(false);
    }
  };

  const loadPinnedMilestones = async () => {
    if (!user) return;
    try {
      const profile = await getUserProfile(user.id);
      setPinnedMilestones(profile.pinned_milestones || []);
    } catch (error) {
      console.error('Error loading pinned milestones:', error);
    }
  };

  const handlePinToggle = async (milestoneId: string, isPinned: boolean) => {
    if (!user || pinning) return;
    
    setPinning(milestoneId);
    try {
      if (isPinned) {
        const updatedProfile = await unpinMilestone(user.id, milestoneId);
        const newPinned = updatedProfile.pinned_milestones || [];
        setPinnedMilestones(newPinned);
        // Update user without triggering reload - only update pinned_milestones
        updateUser({ ...user, pinned_milestones: newPinned });
      } else {
        const updatedProfile = await pinMilestone(user.id, milestoneId);
        const newPinned = updatedProfile.pinned_milestones || [];
        setPinnedMilestones(newPinned);
        // Update user without triggering reload - only update pinned_milestones
        updateUser({ ...user, pinned_milestones: newPinned });
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      alert('Failed to update pinned milestone');
    } finally {
      setPinning(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400">Loading milestones...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Please connect your wallet to view milestones.</p>
      </div>
    );
  }

  const participationMilestones = milestones.filter(m => m.category === 'participation');
  const interactionMilestones = milestones.filter(m => m.category === 'interaction');
  const completedCount = milestones.filter(m => m.completed).length;
  const totalCount = milestones.length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Milestones</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your progress and unlock achievements as you engage with the platform
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                <p className="text-3xl font-bold text-green-600">{completedCount}</p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
                <p className="text-3xl font-bold text-blue-600">{totalCount - completedCount}</p>
              </div>
              <Target className="w-12 h-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Progress</p>
                <p className="text-3xl font-bold text-purple-600">
                  {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
                </p>
              </div>
              <Trophy className="w-12 h-12 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Participation-Based Milestones */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <CardTitle>Participation-Based Milestones</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loadingMilestones ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {participationMilestones.map((milestone) => {
                const Icon = milestoneIcons[milestone.id] || Award;
                const progress = Math.min((milestone.current / milestone.target) * 100, 100);
                
                return (
                <div
                  key={milestone.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    milestone.completed
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        milestone.completed
                          ? 'bg-green-100 dark:bg-green-900/40'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      {milestone.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <Icon
                          className={`w-6 h-6 ${
                            milestone.completed ? 'text-green-600' : 'text-gray-400'
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {milestone.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          {(milestone.completed || pinnedMilestones.includes(milestone.id)) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePinToggle(milestone.id, pinnedMilestones.includes(milestone.id))}
                              disabled={pinning === milestone.id}
                              className="h-8 px-2"
                              title={pinnedMilestones.includes(milestone.id) ? 'Unpin from profile' : 'Pin to profile'}
                            >
                              {pinnedMilestones.includes(milestone.id) ? (
                                <Pin className="w-4 h-4 text-blue-600" />
                              ) : (
                                <PinOff className="w-4 h-4 text-gray-400" />
                              )}
                            </Button>
                          )}
                          <Badge variant={milestone.completed ? 'default' : 'secondary'}>
                            {milestone.completed ? 'Completed' : 'In Progress'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {milestone.description}
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Progress: {milestone.current} / {milestone.target}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              milestone.completed
                                ? 'bg-green-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interaction-Based Milestones */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <CardTitle>Interaction-Based Milestones</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loadingMilestones ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {interactionMilestones.map((milestone) => {
              const Icon = milestoneIcons[milestone.id] || Award;
              const progress = Math.min((milestone.current / milestone.target) * 100, 100);
              
              return (
                <div
                  key={milestone.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    milestone.completed
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        milestone.completed
                          ? 'bg-green-100 dark:bg-green-900/40'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      {milestone.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <Icon
                          className={`w-6 h-6 ${
                            milestone.completed ? 'text-green-600' : 'text-gray-400'
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {milestone.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          {(milestone.completed || pinnedMilestones.includes(milestone.id)) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePinToggle(milestone.id, pinnedMilestones.includes(milestone.id))}
                              disabled={pinning === milestone.id}
                              className="h-8 px-2"
                              title={pinnedMilestones.includes(milestone.id) ? 'Unpin from profile' : 'Pin to profile'}
                            >
                              {pinnedMilestones.includes(milestone.id) ? (
                                <Pin className="w-4 h-4 text-blue-600" />
                              ) : (
                                <PinOff className="w-4 h-4 text-gray-400" />
                              )}
                            </Button>
                          )}
                          <Badge variant={milestone.completed ? 'default' : 'secondary'}>
                            {milestone.completed ? 'Completed' : 'In Progress'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {milestone.description}
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Progress: {milestone.current} / {milestone.target}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              milestone.completed
                                ? 'bg-green-500'
                                : 'bg-purple-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

