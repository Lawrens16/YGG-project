import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, getAchievements } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AchievementCard } from '@/components/AchievementCard';
import { Award, Calendar, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getLevelFromPoints } from '@/lib/utils';
import type { UserProfile, Achievement } from '@/types';

export function Profile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProfile();
    }
  }, [id]);

  async function loadProfile() {
    if (!id) return;
    setLoading(true);
    try {
      const profileData = await getUserProfile(id);
      setProfile(profileData);

      const achievementsData = await getAchievements({ userId: id });
      setAchievements(achievementsData as Achievement[]);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Profile not found.</p>
      </div>
    );
  }

  const level = getLevelFromPoints(profile.skill_points);
  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <Card className="mb-6 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600"></div>
        <CardContent className="pt-0">
          <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6 -mt-16">
            <Avatar
              src={profile.avatar_url || undefined}
              alt={profile.display_name || 'User'}
              className="w-24 h-24 border-4 border-white"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profile.display_name || 'Anonymous'}
              </h1>
              {profile.bio && (
                <p className="text-gray-600 mb-4">{profile.bio}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {profile.school_name && (
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {profile.school_name}
                  </span>
                )}
                {profile.course_name && (
                  <span>{profile.course_name}</span>
                )}
              </div>
            </div>
            {!isOwnProfile && (
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Friend
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Skill Points</p>
                <p className="text-3xl font-bold text-gray-900">{profile.skill_points}</p>
              </div>
              <Award className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Level</p>
                <p className="text-3xl font-bold text-gray-900">{level.level}</p>
                <p className="text-xs text-gray-500">{level.title}</p>
              </div>
              <Badge variant="default">{level.title}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Achievements</p>
                <p className="text-3xl font-bold text-gray-900">{achievements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Achievements</h2>
        {achievements.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No achievements yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {achievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

