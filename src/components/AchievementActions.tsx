import { useState } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toggleReaction } from '@/lib/api';
import { motion } from 'framer-motion';
import type { Achievement } from '@/types';

interface AchievementActionsProps {
  achievement: Achievement;
}

export function AchievementActions({ achievement }: AchievementActionsProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const handleLike = async () => {
    if (!user) return;
    try {
      await toggleReaction(achievement.id, user.id);
      setLiked(!liked);
      setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  return (
    <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        className="flex items-center space-x-2"
      >
        <motion.div
          animate={{ scale: liked ? 1.2 : 1 }}
          transition={{ type: 'spring', stiffness: 500 }}
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
        </motion.div>
        <span>{likeCount}</span>
      </Button>

      <Button variant="ghost" size="sm" className="flex items-center space-x-2">
        <MessageCircle className="w-5 h-5" />
        <span>Comment</span>
      </Button>

      <Button variant="ghost" size="sm" className="flex items-center space-x-2">
        <Share2 className="w-5 h-5" />
        <span>Share</span>
      </Button>
    </div>
  );
}

