import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getFeedAchievements, getAllEvents, getMutualFollowers } from '@/lib/api';
import { FeedPost } from '@/components/FeedPost';
import { Button } from '@/components/ui/button';
import { RefreshCw, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Achievement, Event } from '@/types';

export function Feed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFriends, setHasFriends] = useState(false);
  const [feedItems, setFeedItems] = useState<Array<{ type: 'achievement' | 'event'; data: Achievement | Event }>>([]);

  useEffect(() => {
    if (user) {
      checkFriends();
    }
  }, [user]);

  useEffect(() => {
    if (user && hasFriends) {
      loadFeed();
    }
  }, [user, hasFriends]);

  async function checkFriends() {
    if (!user) return;
    setLoading(true);
    try {
      const mutualFriends = await getMutualFollowers(user.id);
      setHasFriends(mutualFriends.length > 0);
    } catch (error) {
      console.error('Error checking friends:', error);
      setHasFriends(false);
    } finally {
      setLoading(false);
    }
  }

  async function loadFeed() {
    if (!user || !hasFriends) return;
    setLoading(true);
    try {
      const [achievementsData, eventsData] = await Promise.all([
        getFeedAchievements(user.id),
        getAllEvents({ status: 'upcoming', limit: 5 }),
      ]);
      
      setAchievements(achievementsData as Achievement[]);
      setEvents(eventsData);
      
      // Combine and sort by date (newest first)
      const combined = [
        ...(achievementsData as Achievement[]).map(a => ({ type: 'achievement' as const, data: a })),
        ...eventsData.map(e => ({ type: 'event' as const, data: e })),
      ].sort((a, b) => {
        const dateA = new Date(a.data.created_at || a.data.start_date).getTime();
        const dateB = new Date(b.data.created_at || b.data.start_date).getTime();
        return dateB - dateA;
      });
      
      setFeedItems(combined);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Please connect your wallet to view the feed.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#ff3800]" />
        <p className="mt-4 text-gray-500">Loading feed...</p>
      </div>
    );
  }

  if (!hasFriends) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-20 bg-white rounded-xl">
          <UserPlus className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-xl font-semibold text-gray-900 mb-2">Your feed is empty</p>
          <p className="text-gray-500 mb-6">Follow users to see their posts and achievements in your feed!</p>
          <Button onClick={() => navigate('/events')}>
            <UserPlus className="w-4 h-4 mr-2" />
            Discover Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {feedItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl">
          <p className="text-gray-500 mb-4">No posts yet.</p>
          <p className="text-sm text-gray-400">Posts from your friends will appear here!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedItems.map((item) => (
            <FeedPost
              key={item.data.id}
              achievement={item.type === 'achievement' ? (item.data as Achievement) : undefined}
              event={item.type === 'event' ? (item.data as Event) : undefined}
              onUpdate={loadFeed}
            />
          ))}
        </div>
      )}

      <div className="text-center py-4">
        <Button variant="outline" onClick={loadFeed} className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Feed
        </Button>
      </div>
    </div>
  );
}

