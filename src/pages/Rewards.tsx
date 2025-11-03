import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Star, TrendingUp, Zap } from 'lucide-react';
import { getLevelFromPoints } from '@/lib/utils';

export function Rewards() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Please connect your wallet to view rewards.</p>
      </div>
    );
  }

  const level = getLevelFromPoints(user.skill_points);
  const nextLevelPoints = level.level * 50;
  const progress = (user.skill_points / nextLevelPoints) * 100;

  const badges = [
    { name: 'Initiate', earned: level.level >= 1, icon: Award },
    { name: 'Skill Pioneer', earned: level.level >= 5, icon: Star },
    { name: 'Excellence Rank', earned: level.level >= 10, icon: TrendingUp },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Rewards & Points</h1>

      {/* Points Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Current Level</p>
                <p className="text-3xl font-bold text-gray-900">{level.level}</p>
                <p className="text-sm text-gray-600">{level.title}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Skill Points</p>
                <p className="text-3xl font-bold text-blue-600">{user.skill_points}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progress to Level {level.level + 1}</span>
                <span className="text-gray-600">
                  {user.skill_points} / {nextLevelPoints} points
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badges & Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {badges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.name}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    badge.earned
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50 opacity-50'
                  }`}
                >
                  <Icon
                    className={`w-12 h-12 mb-3 ${
                      badge.earned ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  />
                  <h3 className="font-semibold text-gray-900 mb-1">{badge.name}</h3>
                  <Badge variant={badge.earned ? 'default' : 'secondary'}>
                    {badge.earned ? 'Earned' : 'Locked'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* How to Earn Points */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Earn Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Verify an Achievement</h4>
                <p className="text-sm text-gray-600">Get 10 points when your achievement is verified by an organizer</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Peer Verification</h4>
                <p className="text-sm text-gray-600">Earn 5 points when a friend verifies your tagged achievement</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

