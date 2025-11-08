import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getFeedAchievements, getAllEvents, getFollowing, getAchievements, createAchievement } from '@/lib/api';
import { FeedPost } from '@/components/FeedPost';
import { CreatePost } from '@/components/CreatePost';
import { Button } from '@/components/ui/button';
import { RefreshCw, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import type { Achievement, Event } from '@/types';
import { uploadFile, STORAGE_BUCKETS } from '@/lib/storage';

export function Feed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [_achievements, setAchievements] = useState<Achievement[]>([]);
  const [_events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFriends, setHasFriends] = useState(false);
  const [feedItems, setFeedItems] = useState<Array<{ type: 'achievement' | 'event'; data: Achievement | Event }>>([]);
  const [feedFilter, setFeedFilter] = useState<'all' | 'own'>('all');

  useEffect(() => {
    if (user) {
      checkFriends();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFeed();
    }
  }, [user, hasFriends, feedFilter]);

  async function checkFriends() {
    if (!user) return;
    setLoading(true);
    try {
      const following = await getFollowing(user.id);
      setHasFriends(following.length > 0);
    } catch (error) {
      console.error('Error checking following:', error);
      setHasFriends(false);
    } finally {
      setLoading(false);
    }
  }

  async function loadFeed() {
    if (!user) return;
    setLoading(true);
    try {
      let achievementsData: Achievement[] = [];
      
      if (feedFilter === 'own') {
        // Load only user's own posts
        achievementsData = await getAchievements({ userId: user.id });
      } else {
        // Load feed from followed users
        if (hasFriends) {
          achievementsData = await getFeedAchievements(user.id);
        }
      }
      
      const eventsData = feedFilter === 'own' ? [] : await getAllEvents({ status: 'upcoming', limit: 5 });
      
      setAchievements(achievementsData as Achievement[]);
      setEvents(eventsData);
      
      // Combine and sort by date (newest first)
      const combined = [
        ...(achievementsData as Achievement[]).map(a => ({ type: 'achievement' as const, data: a })),
        ...eventsData.map(e => ({ type: 'event' as const, data: e })),
      ].sort((a, b) => {
        const getDate = (item: { type: 'achievement' | 'event'; data: Achievement | Event }): string => {
          if (item.type === 'achievement') {
            return (item.data as Achievement).created_at;
          } else {
            return (item.data as Event).start_date;
          }
        };
        const dateA = new Date(getDate(a)).getTime();
        const dateB = new Date(getDate(b)).getTime();
        return dateB - dateA;
      });
      
      setFeedItems(combined);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleCreatePost = async (content: string, image?: File, eventId?: string) => {
    if (!user) return;
    
    try {
      let imageUrl: string | null = null;
      
      // Upload image if provided
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { url } = await uploadFile(
          image,
          fileName,
          STORAGE_BUCKETS.ACHIEVEMENT_PHOTOS,
          [STORAGE_BUCKETS.VERIFICATION_PHOTOS]
        );
        imageUrl = url;
      }

      // Create achievement/post
      await createAchievement({
        user_id: user.id,
        event_id: eventId || null,
        category: 'community',
        title: content || 'Shared a photo',
        description: content || null,
        image_url: imageUrl,
        status: 'pending',
      });

      // Reload feed
      await loadFeed();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    }
  };

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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Create Post */}
      <CreatePost onSubmit={handleCreatePost} />
      
      {/* Filter Tabs */}
      <Card className="p-1">
        <div className="flex gap-2">
          <Button
            variant={feedFilter === 'all' ? 'default' : 'ghost'}
            onClick={() => setFeedFilter('all')}
            className="flex-1"
          >
            Following
          </Button>
          <Button
            variant={feedFilter === 'own' ? 'default' : 'ghost'}
            onClick={() => setFeedFilter('own')}
            className="flex-1"
          >
            My Posts
          </Button>
        </div>
      </Card>

      {feedItems.length === 0 ? (
        <Card className="text-center py-16">
          <div className="max-w-md mx-auto">
            <UserPlus className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-semibold text-gray-900 mb-2">
              {feedFilter === 'own' ? 'No posts yet.' : 'No posts yet.'}
            </p>
            <p className="text-sm text-gray-500">
              {feedFilter === 'own' 
                ? 'Your posts will appear here!' 
                : 'Posts from your friends will appear here!'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
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
        <Button variant="outline" onClick={loadFeed} className="w-full shadow-sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Feed
        </Button>
      </div>
    </div>
  );
}

