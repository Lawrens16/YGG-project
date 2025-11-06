import { useNavigate } from 'react-router-dom';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar } from './ui/avatar';
import { Share2, MoreHorizontal, MapPin, Calendar, Award } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Achievement, Event } from '@/types';
import { AchievementActions } from './AchievementActions';

interface FeedPostProps {
  achievement?: Achievement;
  event?: Event;
  onUpdate?: () => void;
}

export function FeedPost({ achievement, event, onUpdate }: FeedPostProps) {
  const navigate = useNavigate();
  const postUser = achievement?.user_profiles || event?.user_profiles;

  if (event) {
    return (
      <Card className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {event.banner_url && (
          <img
            src={event.banner_url}
            alt={event.name}
            className="w-full h-48 object-cover cursor-pointer"
            onClick={() => navigate(`/events/${event.id}`)}
          />
        )}
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar src={postUser?.avatar_url || undefined} alt={postUser?.display_name || 'Organizer'} />
              <div>
                <div className="font-semibold">{postUser?.display_name || 'Organizer'}</div>
                <div className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>

          <h3 className="font-bold text-lg mb-2 cursor-pointer" onClick={() => navigate(`/events/${event.id}`)}>
            {event.name}
          </h3>
          {event.description && (
            <p className="text-gray-700 mb-3">{event.description}</p>
          )}

          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(event.start_date).toLocaleDateString()} at{' '}
                {new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{event.venue_address}</span>
            </div>
          </div>

          <div className="flex gap-4 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/events/${event.id}`)}
              className="flex-1"
            >
              View Event
            </Button>
            <Button variant="ghost" size="sm" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!achievement) return null;

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar src={postUser?.avatar_url || undefined} alt={postUser?.display_name || 'User'} />
            <div>
              <div className="font-semibold">{postUser?.display_name || 'User'}</div>
              <div className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(achievement.created_at), { addSuffix: true })}
                {achievement.events && (
                  <span className="ml-2">
                    · <Award className="h-3 w-3 inline mr-1" />
                    {achievement.events.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>

        <div className="mb-3">
          <h3 className="font-semibold text-lg mb-2">{achievement.title}</h3>
          {achievement.description && (
            <p className="text-gray-700 mb-3">{achievement.description}</p>
          )}
          {achievement.image_url && (
            <img
              src={achievement.image_url}
              alt={achievement.title}
              className="w-full rounded-lg mb-3"
            />
          )}
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
              {achievement.category}
            </span>
            {achievement.status === 'verified' && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                ✓ Verified
              </span>
            )}
          </div>
        </div>

        {achievement && <AchievementActions achievement={achievement} onUpdate={onUpdate} />}
      </div>
    </Card>
  );
}

