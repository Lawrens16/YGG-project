import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar } from './ui/avatar';
import { Input } from './ui/input';
import { Heart, MessageCircle, Share2, MoreHorizontal, MapPin, Calendar, Award } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Achievement, Event } from '@/types';
import { toggleReaction, addComment, getComments, getReactions } from '@/lib/api';

interface FeedPostProps {
  achievement?: Achievement;
  event?: Event;
  onUpdate?: () => void;
}

export function FeedPost({ achievement, event, onUpdate }: FeedPostProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [reactions, setReactions] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingReaction, setLoadingReaction] = useState(false);

  const postUser = achievement?.user_profiles || event?.user_profiles;
  const postId = achievement?.id || event?.id;
  const isLiked = reactions.some(r => r.user_id === user?.id);
  const likeCount = reactions.length;

  const loadComments = async () => {
    if (!achievement || loadingComments) return;
    setLoadingComments(true);
    try {
      const data = await getComments(achievement.id);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const loadReactions = async () => {
    if (!achievement) return;
    try {
      const data = await getReactions(achievement.id);
      setReactions(data);
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  };

  const handleLike = async () => {
    if (!achievement || !user || loadingReaction) return;
    setLoadingReaction(true);
    try {
      await toggleReaction(achievement.id, user.id);
      await loadReactions();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error toggling reaction:', error);
    } finally {
      setLoadingReaction(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!achievement || !user || !commentText.trim()) return;
    try {
      await addComment(achievement.id, user.id, commentText);
      setCommentText('');
      await loadComments();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  useEffect(() => {
    if (achievement) {
      loadReactions();
    }
  }, [achievement]);

  const toggleComments = () => {
    if (!showComments && achievement) {
      loadComments();
    }
    setShowComments(!showComments);
  };

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

        <div className="flex items-center gap-4 py-2 border-t border-b text-gray-600">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={loadingReaction}
            className={isLiked ? 'text-[#ff3800]' : ''}
          >
            <Heart className={`h-5 w-5 mr-1 ${isLiked ? 'fill-current' : ''}`} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleComments}
          >
            <MessageCircle className="h-5 w-5 mr-1" />
            {comments.length > 0 && <span>{comments.length}</span>}
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="h-5 w-5 mr-1" />
            Share
          </Button>
        </div>

        {showComments && (
          <div className="mt-3 space-y-3">
            {loadingComments ? (
              <div className="text-center py-4 text-gray-500">Loading comments...</div>
            ) : (
              <>
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <Avatar
                      src={comment.user_profiles?.avatar_url || undefined}
                      alt={comment.user_profiles?.display_name || 'User'}
                      className="h-8 w-8"
                    />
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg p-2">
                        <div className="font-semibold text-sm">
                          {comment.user_profiles?.display_name || 'User'}
                        </div>
                        <div className="text-sm">{comment.content}</div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 ml-2">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
                <form onSubmit={handleComment} className="flex gap-2">
                  <Avatar
                    src={user?.avatar_url || undefined}
                    alt={user?.display_name || 'You'}
                    className="h-8 w-8"
                  />
                  <Input
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="sm" disabled={!commentText.trim()}>
                    Post
                  </Button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

