import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getFeedAchievements } from '@/lib/api';
import { AchievementCard } from '@/components/AchievementCard';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import type { Achievement } from '@/types';
import { getDailyTasks } from '@/lib/tasks';

export function Feed() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const tasks = getDailyTasks();

  useEffect(() => {
    if (user) {
      loadFeed();
    }
  }, [user]);

  async function loadFeed() {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getFeedAchievements(user.id);
      setAchievements(data as Achievement[]);
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
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p className="mt-4 text-gray-500">Loading feed...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 p-4 rounded-xl bg-white border border-gray-200">
        <h2 className="text-lg font-semibold mb-2">Today's Tasks</h2>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          {tasks.map((t) => (
            <li key={t.id}><span className="font-medium">{t.title}</span> — {t.description}</li>
          ))}
        </ul>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Activity Feed</h1>
        <Button variant="outline" size="sm" onClick={loadFeed}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {achievements.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl">
          <p className="text-gray-500 mb-4">No achievements in your feed yet.</p>
          <p className="text-sm text-gray-400">Connect with friends to see their verified achievements!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      )}
    </div>
  );
}

