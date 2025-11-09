import { useState, useEffect } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toggleReaction, getReactions, addComment, getComments, getCommentCount } from '@/lib/api';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import type { Achievement } from '@/types';

interface AchievementActionsProps {
  achievement: Achievement;
  onUpdate?: () => void;
}

export function AchievementActions({ achievement, onUpdate }: AchievementActionsProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loadingReaction, setLoadingReaction] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // Load reactions and comment count on mount
  useEffect(() => {
    loadReactions();
    loadCommentCount();
  }, [achievement.id]);

  const loadReactions = async () => {
    try {
      const data = await getReactions(achievement.id);
      setLikeCount(data?.length || 0);
      const isLikedByUser = data?.some((r: any) => r.user_id === user?.id) || false;
      setLiked(isLikedByUser);
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  };

  const loadCommentCount = async () => {
    try {
      const count = await getCommentCount(achievement.id);
      setCommentCount(count);
    } catch (error) {
      console.error('Error loading comment count:', error);
    }
  };

  const loadComments = async () => {
    if (loadingComments) return;
    setLoadingComments(true);
    try {
      const data = await getComments(achievement.id);
      setComments(data || []);
      setCommentCount(data?.length || 0);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLike = async () => {
    if (!user || loadingReaction) return;
    setLoadingReaction(true);
    try {
      console.log('Toggling like for achievement:', achievement.id, 'user:', user.id);
      await toggleReaction(achievement.id, user.id);
      // Reload reactions to get updated state (but don't reload entire feed)
      await new Promise(resolve => setTimeout(resolve, 200));
      await loadReactions();
      // Don't call onUpdate() - we don't need to reload the entire feed
    } catch (error) {
      console.error('Error toggling reaction:', error);
      alert(`Failed to like: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingReaction(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;
    
    const submittingComment = commentText.trim();
    setCommentText('');
    
    try {
      console.log('Adding comment:', { achievementId: achievement.id, userId: user.id });
      await addComment(achievement.id, user.id, submittingComment);
      await loadComments();
      await loadCommentCount();
      // Don't call onUpdate() - we don't need to reload the entire feed
      // The comment is already added and displayed
    } catch (error: any) {
      console.error('Error adding comment:', error);
      setCommentText(submittingComment);
      alert(`Failed to add comment: ${error.message || 'Unknown error'}`);
    }
  };

  const toggleComments = () => {
    if (!showComments) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  return (
    <div className="pt-4 border-t border-border">
      <div className="flex items-center space-x-4 mb-3">
        <button
          onClick={handleLike}
          disabled={loadingReaction}
          className="flex items-center space-x-2 hover:bg-muted rounded-md px-2 py-1 transition-colors disabled:opacity-50 text-foreground"
          type="button"
        >
          <motion.div
            animate={{ scale: liked ? 1.2 : 1 }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          </motion.div>
          <span className="text-muted-foreground">{likeCount > 0 ? likeCount : ''}</span>
        </button>

        <button
          onClick={toggleComments}
          className="flex items-center space-x-2 hover:bg-muted rounded-md px-2 py-1 transition-colors text-muted-foreground"
          type="button"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{commentCount > 0 ? commentCount : ''}</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-3">
          {loadingComments ? (
            <div className="text-center py-4 text-muted-foreground text-sm">Loading comments...</div>
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
                    <div className="bg-muted rounded-lg p-2">
                      <div className="font-semibold text-sm text-foreground">
                        {comment.user_profiles?.display_name || 'User'}
                      </div>
                      <div className="text-sm text-foreground">{comment.content}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 ml-2">
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
  );
}

