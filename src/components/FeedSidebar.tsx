import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getFollowing, getFeedAchievements, getAllEvents } from '@/lib/api';
import { Card } from './ui/card';
import { Avatar } from './ui/avatar';
import { Button } from './ui/button';
import { TrendingUp, Clock, UserPlus, Calendar, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { UserProfile, Achievement, Event } from '@/types';

export function FeedSidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [recentActivity, setRecentActivity] = useState<Array<{ type: 'achievement' | 'event'; data: Achievement | Event; user?: UserProfile }>>([]);
  const [trendingEvents, setTrendingEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (user) {
      loadSuggestions();
      loadRecentActivity();
      loadTrendingEvents();
    }
  }, [user]);

  async function loadSuggestions() {
    if (!user) return;
    try {
      // Get users you're not following yet (simplified - in production, use a proper suggestions API)
      const following = await getFollowing(user.id);
      const followingIds = new Set(following.map(f => f.followed_id));
      
      // For now, we'll show a placeholder - in production, implement proper user suggestions
      setSuggestions([]);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  }

  async function loadRecentActivity() {
    if (!user) return;
    try {
      const achievements = await getFeedAchievements(user.id, 5);
      const activity = achievements.slice(0, 5).map(a => ({
        type: 'achievement' as const,
        data: a,
        user: a.user_profiles,
      }));
      setRecentActivity(activity);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  }

  async function loadTrendingEvents() {
    try {
      const events = await getAllEvents({ limit: 5 });
      // Sort by featured priority or date
      const sorted = events
        .filter(e => e.is_featured)
        .sort((a, b) => (b.featured_priority || 0) - (a.featured_priority || 0))
        .slice(0, 3);
      setTrendingEvents(sorted);
    } catch (error) {
      console.error('Error loading trending events:', error);
    }
  }

  if (!user) return null;

  return (
    <aside className="hidden xl:block w-80 space-y-6 sticky top-24 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hide pr-2">
      {/* Trending Events */}
      {trendingEvents.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-[#ff3800]" />
            <h3 className="font-bold text-foreground">Trending Events</h3>
          </div>
          <div className="space-y-3">
            {trendingEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => navigate(`/events/${event.id}`)}
                className="w-full text-left hover:bg-muted/50 rounded-lg p-2 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  {event.banner_url ? (
                    <img
                      src={event.banner_url}
                      alt={event.name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#ff3800] via-[#ff6b35] to-[#ffa500] flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-[#ff3800] transition-colors">
                      {event.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(event.start_date), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-[#ff3800]" />
            <h3 className="font-bold text-foreground">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {recentActivity.map((item, index) => {
              if (item.type === 'achievement') {
                const achievement = item.data as Achievement;
                const activityUser = item.user;
                return (
                  <div key={achievement.id || index} className="flex items-start gap-3">
                    <Avatar
                      src={activityUser?.avatar_url}
                      alt={activityUser?.display_name || 'User'}
                      className="w-10 h-10 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">{activityUser?.display_name || 'Someone'}</span>
                        {' '}posted {achievement.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(achievement.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </Card>
      )}

      {/* Suggestions Placeholder */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="h-5 w-5 text-[#ff3800]" />
          <h3 className="font-bold text-foreground">Suggestions</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Discover new users and events to follow
        </p>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/events')}
        >
          Explore Events
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </Card>
    </aside>
  );
}

