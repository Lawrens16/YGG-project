import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAchievements, verifyAchievement } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import { AchievementCard } from '@/components/AchievementCard';
import type { Achievement } from '@/types';

export function Verify() {
  const { user, loading } = useAuth();
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([]);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    if (user?.is_organizer) {
      loadPendingAchievements();
    }
  }, [user]);

  async function loadPendingAchievements() {
    setListLoading(true);
    try {
      const data = await getAchievements({ status: 'pending' });
      setPendingAchievements(data as Achievement[]);
    } catch (error) {
      console.error('Error loading pending achievements:', error);
    } finally {
      setListLoading(false);
    }
  }

  async function handleVerify(achievementId: string) {
    if (!user) return;
    
    try {
      // TODO: Call Sui Move contract to verify on-chain
      // For now, just update the database
      await verifyAchievement(achievementId, user.wallet_address);
      await loadPendingAchievements();
    } catch (error) {
      console.error('Error verifying achievement:', error);
      alert('Failed to verify achievement. Please try again.');
    }
  }

  async function handleReject(achievementId: string) {
    // TODO: Implement reject functionality
    console.log('Reject achievement:', achievementId);
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Checking wallet connection...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Please connect your wallet.</p>
      </div>
    );
  }

  if (!user.is_organizer) {
    return (
      <div className="text-center py-20">
        <Card>
          <CardContent className="p-12">
            <p className="text-gray-500 mb-4">You need to be an organizer to verify achievements.</p>
            <p className="text-sm text-gray-400">Contact support to become a verified organizer.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (listLoading) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Loading pending achievements...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Verify Achievements</h1>
          <p className="text-gray-500 mt-2">Review and verify pending achievement submissions</p>
        </div>
        <Badge variant="pending" className="text-lg px-4 py-2">
          {pendingAchievements.length} Pending
        </Badge>
      </div>

      {pendingAchievements.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-gray-500">All caught up! No pending achievements to verify.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pendingAchievements.map((achievement) => (
            <Card key={achievement.id} className="overflow-hidden">
              <AchievementCard achievement={achievement} showActions={false} />
              <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => handleReject(achievement.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleVerify(achievement.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify & Mint
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

