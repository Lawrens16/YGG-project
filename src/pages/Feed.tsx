import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getFeedAchievements, getAllEvents, getFollowing, createAchievement, getFeaturedEvents } from '@/lib/api';
import { FeedPost } from '@/components/FeedPost';
import { CreatePost } from '@/components/CreatePost';
import { FeaturedEventsHero } from '@/components/FeaturedEventsHero';
import { EventQuickCard } from '@/components/EventQuickCard';
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
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [ongoingEvents, setOngoingEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (user) {
      checkFriends();
    }
  }, [user]);

  useEffect(() => {
    async function loadFeatured() {
      try {
        // Get all featured events (they're already sorted by priority)
        const featured = await getFeaturedEvents(20);
        setFeaturedEvents(featured);
      } catch (error) {
        console.error('Error loading featured events:', error);
      }
    }
    async function loadOngoing() {
      try {
        const allEvents = await getAllEvents({ limit: 100 });
        const now = new Date();
        const ongoing = allEvents.filter(event => {
          const start = new Date(event.start_date);
          const end = new Date(event.end_date);
          return start <= now && end >= now;
        });
        setOngoingEvents(ongoing);
      } catch (error) {
        console.error('Error loading ongoing events:', error);
      }
    }
    loadFeatured();
    loadOngoing();
  }, []);

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
      let eventsData: Event[] = [];
      
      if (feedFilter === 'own') {
        // Load events
        eventsData = await getAllEvents({ status: 'upcoming', limit: 5 });
      } else {
        // Load feed from followed users, excluding current user's posts
        if (hasFriends) {
          const allFeedAchievements: Achievement[] = await getFeedAchievements(user.id);
          // Filter out current user's posts
          achievementsData = allFeedAchievements.filter((a) => a.user_id !== user.id);
        }
      }
      
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
      {/* Featured Events Hero */}
      {featuredEvents.length > 0 && (
        <FeaturedEventsHero events={featuredEvents} />
      )}

      {/* Happening Now Section */}
      {ongoingEvents.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
              <div className="relative w-2 h-2 bg-red-500 rounded-full" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Happening Now</h2>
          </div>
          <div className="overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory">
            <div className="flex gap-4 pb-2">
              {ongoingEvents.map(event => (
                <div key={event.id} className="snap-start">
                  <EventQuickCard event={event} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
            Events
          </Button>
        </div>
      </Card>

      {feedItems.length === 0 ? (
        <Card className="text-center py-16">
          <div className="max-w-md mx-auto">
            <UserPlus className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">
              {feedFilter === 'own' ? 'No events yet.' : 'No posts yet.'}
            </p>
            <p className="text-sm text-muted-foreground">
              {feedFilter === 'own' 
                ? 'Events will appear here!' 
                : 'Posts from other users will appear here!'}
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

