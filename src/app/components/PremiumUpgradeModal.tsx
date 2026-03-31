import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Check, Crown, Zap, TrendingUp, Shield, Star } from 'lucide-react';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  onUpgrade: () => void;
}

export function PremiumUpgradeModal({ isOpen, onClose, feature, onUpgrade }: PremiumUpgradeModalProps) {
  const premiumFeatures = [
    { icon: TrendingUp, text: 'AI-Powered Trade Replay & Pattern Detection' },
    { icon: Zap, text: 'Unlimited Custom Journal Fields & Advanced Filters' },
    { icon: Shield, text: 'Streak Savers & Double XP Days' },
    { icon: Star, text: 'Advanced Analytics & Predictive Insights' },
    { icon: Crown, text: 'Create Private Groups & Upload Files' },
    { icon: Check, text: 'Unlimited Forfeit Respins' },
    { icon: Check, text: 'Ad-Free Experience' },
    { icon: Check, text: 'Premium Verification Badge' },
    { icon: Check, text: 'Send Images & Files in DMs' },
    { icon: Check, text: 'Priority Support' },
    { icon: Check, text: 'Exclusive Leaderboards & Challenges' },
    { icon: Check, text: 'AI Journal Analysis & Recommendations' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            Upgrade to Premium
          </DialogTitle>
          <DialogDescription>
            {feature 
              ? `Unlock "${feature}" and all premium features to take your trading discipline to the next level.`
              : 'Unlock all premium features to take your trading discipline to the next level.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-2">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold mb-2">Monthly</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">$14.99</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>
                <Button onClick={onUpgrade} className="w-full" variant="outline">
                  Choose Monthly
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-yellow-500 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                BEST VALUE
              </div>
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold mb-2">Annual</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">$149</span>
                    <span className="text-muted-foreground">/year</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1 font-medium">Save $30.89 per year!</p>
                </div>
                <Button onClick={onUpgrade} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black">
                  <Crown className="w-4 h-4 mr-2" />
                  Choose Annual
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Feature List */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Everything in Premium:
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {premiumFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start gap-2">
                    <Icon className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guarantee */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-blue-600 shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">30-Day Money-Back Guarantee</h4>
                  <p className="text-sm text-muted-foreground">
                    Not satisfied? Get a full refund within 30 days, no questions asked.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}