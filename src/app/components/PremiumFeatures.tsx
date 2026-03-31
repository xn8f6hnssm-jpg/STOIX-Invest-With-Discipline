import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Shield, Zap, Crown } from 'lucide-react';
import { storage } from '../utils/storage';

export function PremiumFeatures() {
  const currentUser = storage.getCurrentUser();
  
  if (!currentUser || !currentUser.isPremium) {
    return null;
  }

  const handleActivateDoubleXP = () => {
    const success = storage.activateDoubleXP();
    if (success) {
      alert('🔥 Double XP activated for today! You\'ll earn 2x points on your Daily Check-In.');
      window.location.reload(); // Refresh to show active state
    } else {
      const remaining = currentUser.doubleXPDaysRemaining || 0;
      if (remaining === 0) {
        alert('❌ No Double XP days remaining this month. They reset every 30 days!');
      } else {
        alert('✅ Double XP is already active today!');
      }
    }
  };

  const streakSavers = currentUser.streakSavers || 0;
  const doubleXPDaysRemaining = currentUser.doubleXPDaysRemaining || 0;
  const isDoubleXPActive = storage.isDoubleXPActive();

  return (
    <Card className="border-yellow-500/50 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-500" />
          <CardTitle>Premium Features</CardTitle>
        </div>
        <CardDescription>Your exclusive premium perks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Streak Savers */}
        <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-sm">Streak Savers</p>
              <p className="text-xs text-muted-foreground">Protect your streak when you break a rule (2/month)</p>
            </div>
          </div>
          <Badge variant="outline" className="text-blue-500 border-blue-500">
            {streakSavers} left
          </Badge>
        </div>

        {/* Double XP Days */}
        <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="font-semibold text-sm">Double XP Days</p>
              <p className="text-xs text-muted-foreground">Earn 2x points on check-ins (5/month, random)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDoubleXPActive ? (
              <Badge className="bg-orange-500 text-white">
                <Zap className="w-3 h-3 mr-1" />
                ACTIVE
              </Badge>
            ) : (
              <>
                <Badge variant="outline" className="text-orange-500 border-orange-500">
                  {doubleXPDaysRemaining}/5
                </Badge>
                {doubleXPDaysRemaining > 0 && (
                  <Button
                    size="sm"
                    onClick={handleActivateDoubleXP}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    Activate
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {isDoubleXPActive && (
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <p className="text-sm font-medium text-orange-500 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Double XP is active today! Complete your Daily Check-In to earn 2x points.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}