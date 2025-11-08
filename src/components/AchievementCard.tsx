import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { MapPin, Calendar, CheckCircle, Clock } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import type { Achievement } from '@/types';
import { AchievementActions } from './AchievementActions';

interface AchievementCardProps {
  achievement: Achievement;
  showActions?: boolean;
}

export function AchievementCard({ achievement, showActions = true }: AchievementCardProps) {
  const categoryColors: Record<string, string> = {
    academic: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    leadership: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    technology: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    community: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    sports: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    arts: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-elevated transition-shadow">
        <CardContent className="p-0">
          {achievement.image_url && (
            <div className="w-full h-64 bg-muted overflow-hidden">
              <img
                src={achievement.image_url}
                alt={achievement.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Avatar
                  src={achievement.user_profiles?.avatar_url || undefined}
                  alt={achievement.user_profiles?.display_name || 'User'}
                />
                <div>
                  <p className="font-semibold text-foreground">
                    {achievement.user_profiles?.display_name || 'Anonymous'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(achievement.created_at)}
                  </p>
                </div>
              </div>
              
              <Badge
                variant={
                  achievement.status === 'verified'
                    ? 'success'
                    : achievement.status === 'pending'
                    ? 'pending'
                    : 'destructive'
                }
              >
                {achievement.status === 'verified' && (
                  <CheckCircle className="w-3 h-3 mr-1" />
                )}
                {achievement.status === 'pending' && (
                  <Clock className="w-3 h-3 mr-1" />
                )}
                {achievement.status}
              </Badge>
            </div>

            <Badge className={`mb-3 ${categoryColors[achievement.category] || 'bg-muted text-muted-foreground'}`}>
              {achievement.category}
            </Badge>

            <h3 className="text-xl font-bold text-foreground mb-2">{achievement.title}</h3>
            
            {achievement.description && (
              <p className="text-muted-foreground mb-4">{achievement.description}</p>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              {achievement.gps_latitude && achievement.gps_longitude && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-1" />
                  {achievement.gps_latitude.toFixed(4)}, {achievement.gps_longitude.toFixed(4)}
                </div>
              )}
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDateTime(achievement.timestamp)}
              </div>
            </div>

            {achievement.sui_transaction_id && (
              <div className="text-xs text-muted-foreground/70 mb-4">
                On-chain: {achievement.sui_transaction_id.slice(0, 16)}...
              </div>
            )}

            {showActions && <AchievementActions achievement={achievement} />}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

