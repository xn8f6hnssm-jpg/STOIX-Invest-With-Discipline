import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Trophy, Medal, Star, Target, Crown, Zap, Award } from 'lucide-react';
import { storage, Achievement } from '../utils/storage';
import { useNavigate } from 'react-router';

export function Achievements() {
  const navigate = useNavigate();
  const currentUser = storage.getCurrentUser();
  const achievements = currentUser?.achievements || [];

  // Count achievements by type
  const trophyCount = achievements.filter(a => a.type === 'trophy').length;
  const medalCount = achievements.filter(a => a.type === 'medal').length;
  const starCount = achievements.filter(a => a.type === 'star').length;
  const totalCount = achievements.length;

  // Milestone rewards (every 10 trophies = 100 bonus points)
  const milestonesReached = Math.floor(trophyCount / 10);
  const nextMilestone = (Math.floor(trophyCount / 10) + 1) * 10;
  const progressToNext = trophyCount % 10;
  const totalBonusEarned = milestonesReached * 100;

  // Get icon for achievement type
  const getAchievementIcon = (type: Achievement['type']) => {
    switch (type) {
      case 'trophy':
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 'medal':
        return <Medal className="w-8 h-8 text-blue-500" />;
      case 'star':
        return <Star className="w-8 h-8 text-purple-500" />;
    }
  };

  // Sort achievements by most recent
  const sortedAchievements = [...achievements].sort((a, b) => b.earnedAt - a.earnedAt);

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <Award className="w-8 h-8 text-yellow-500" />
          Achievements
        </h1>
        <p className="text-muted-foreground">
          Earn trophies, medals, and stars from challenges and milestones
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">{trophyCount}</p>
            <p className="text-sm text-muted-foreground">Trophies</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Medal className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">{medalCount}</p>
            <p className="text-sm text-muted-foreground">Medals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Star className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">{starCount}</p>
            <p className="text-sm text-muted-foreground">Stars</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Award className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">{totalCount}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Milestone Progress */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Trophy Milestones
          </CardTitle>
          <CardDescription>
            Every 10 trophies earns you +100 bonus points!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Total bonus earned */}
            {totalBonusEarned > 0 && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Crown className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="font-bold text-green-500">Milestones Reached!</p>
                      <p className="text-sm text-muted-foreground">
                        {milestonesReached} milestone{milestonesReached !== 1 ? 's' : ''} completed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-500">+{totalBonusEarned}</p>
                    <p className="text-xs text-muted-foreground">bonus points</p>
                  </div>
                </div>
              </div>
            )}

            {/* Next milestone progress */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm font-medium text-blue-500 mb-3">Next Milestone Progress</p>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm">
                  <span className="font-bold">{trophyCount}</span> /{' '}
                  <span className="font-bold">{nextMilestone}</span> trophies
                </p>
                <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                  +100 pts reward
                </Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${(progressToNext / 10) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {10 - progressToNext} more {10 - progressToNext === 1 ? 'trophy' : 'trophies'} to go!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Achievements</CardTitle>
          <CardDescription>
            {achievements.length === 0
              ? 'Join group challenges to start earning achievements!'
              : `You've earned ${achievements.length} achievement${achievements.length === 1 ? '' : 's'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {achievements.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No achievements yet</p>
              <button
                onClick={() => navigate('/app/groups')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Explore Groups
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="p-4 rounded-lg border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getAchievementIcon(achievement.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {achievement.description}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {achievement.type === 'trophy'
                            ? '🏆 Trophy'
                            : achievement.type === 'medal'
                            ? '🥇 Medal'
                            : '⭐ Star'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {new Date(achievement.earnedAt).toLocaleDateString()}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {achievement.source.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}