import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Crown, Check, X, TrendingUp, Zap, Shield, Star, Users, Upload, MessageSquare, Brain, BarChart3, Sparkles, AlertTriangle, CheckSquare } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { PremiumBadge } from '../components/PremiumBadge';
import { storage } from '../utils/storage';
import { toast } from 'sonner';

export function Upgrade() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(storage.getCurrentUser());
  const isPremium = currentUser?.isPremium || false;

  const handleUpgrade = (plan: 'monthly' | 'annual') => {
    // In a real app, this would integrate with a payment processor
    storage.upgradeToPremium();
    setCurrentUser(storage.getCurrentUser());
    toast.success(`Welcome to Premium! 🎉`, {
      description: 'You now have access to all premium features.',
    });
    setTimeout(() => {
      navigate('/app');
    }, 1500);
  };

  const premiumFeatures = [
    { icon: Shield, title: 'Account Rules Monitor', desc: 'Track prop firm limits & prevent violations', category: 'Protection' },
    { icon: CheckSquare, title: 'Pre-Trade Checklist', desc: 'Ensure discipline before every trade', category: 'Protection' },
    { icon: AlertTriangle, title: 'Behavior Risk Alerts', desc: 'Detect revenge trading & emotional patterns', category: 'Protection' },
    { icon: Brain, title: 'AI Performance Psychology', desc: 'Behavior improvement insights & reports', category: 'Improvement' },
    { icon: BarChart3, title: 'Advanced Analytics', desc: 'Deep insights & pattern detection', category: 'Improvement' },
    { icon: TrendingUp, title: 'AI Journal Insights', desc: 'Identify what actually works for you', category: 'Improvement' },
    { icon: Zap, title: 'Double XP Days', desc: 'Accelerate your discipline growth', category: 'Acceleration' },
    { icon: Sparkles, title: 'Streak Savers', desc: 'Protect your progress (2/month)', category: 'Acceleration' },
    { icon: Sparkles, title: 'Unlimited Custom Fields', desc: 'Track any data point you need', category: 'Acceleration' },
    { icon: Users, title: 'Create Private Groups', desc: 'Build your own trading communities', category: 'Social' },
    { icon: Upload, title: 'Upload Files', desc: 'Share images & files in groups & DMs', category: 'Social' },
    { icon: Crown, title: 'Premium Badge', desc: 'Stand out with exclusive verification', category: 'Social' },
  ];

  const comparisonFeatures = [
    { feature: 'Daily Check-In', free: true, premium: true },
    { feature: 'Basic Journal Entries', free: true, premium: true },
    { feature: 'Social Feed', free: true, premium: true },
    { feature: 'Custom Journal Fields', free: '3 fields', premium: 'Unlimited' },
    { feature: 'Forfeit Respins', free: '1/day', premium: 'Unlimited' },
    { feature: 'Create Groups', free: false, premium: true },
    { feature: 'Upload Files in Groups/DMs', free: false, premium: true },
    { feature: 'AI Trade Replay & Analysis', free: false, premium: true },
    { feature: 'Advanced Analytics Dashboard', free: false, premium: true },
    { feature: 'AI Journal Insights', free: false, premium: true },
    { feature: 'Streak Savers & Double XP', free: false, premium: true },
    { feature: 'Premium Badge', free: false, premium: true },
    { feature: 'Priority Support', free: false, premium: true },
    { feature: 'Ad-Free Experience', free: false, premium: true },
  ];

  if (isPremium) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="border-yellow-500 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Crown className="w-16 h-16 text-yellow-500" />
            </div>
            <CardTitle className="text-3xl flex items-center justify-center gap-2">
              <span>You're Premium!</span>
              <PremiumBadge size="lg" />
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Thank you for supporting STOIX! You have access to all premium features.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {premiumFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <Icon className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground">{feature.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-center">
              <Button onClick={() => navigate('/app')} size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black">
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Crown className="w-8 h-8 text-yellow-500" />
          <h1 className="text-4xl font-bold">Upgrade to Premium</h1>
        </div>
        <p className="text-muted-foreground text-lg">Take your trading discipline to the next level</p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Monthly</CardTitle>
            <CardDescription>Perfect for trying premium</CardDescription>
            <div className="mt-4">
              <span className="text-5xl font-bold">$12.99</span>
              <span className="text-muted-foreground text-lg">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => handleUpgrade('monthly')} size="lg" className="w-full" variant="outline">
              Start Monthly Plan
            </Button>
            <p className="text-xs text-center text-muted-foreground">Cancel anytime</p>
          </CardContent>
        </Card>

        <Card className="border-4 border-yellow-500 relative shadow-xl">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black px-6 py-2 rounded-full text-sm font-bold shadow-lg">
            BEST VALUE - SAVE $36.89
          </div>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              Annual
            </CardTitle>
            <CardDescription>Most popular choice</CardDescription>
            <div className="mt-4 space-y-1">
              <div>
                <span className="text-5xl font-bold">$119</span>
                <span className="text-muted-foreground text-lg">/year</span>
              </div>
              <p className="text-green-600 font-semibold">Save 23% compared to monthly!</p>
              <p className="text-sm text-muted-foreground">That's just $9.92/month</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button size="lg" className="w-full">
              <Crown className="w-5 h-5 mr-2" />
              Start Annual Plan
            </Button>
            <p className="text-xs text-center text-muted-foreground">30-day money-back guarantee</p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Highlights */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-center mb-6">Premium Features</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {premiumFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                      <Icon className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-center mb-6">Free vs Premium</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Feature</th>
                    <th className="text-center p-4 font-semibold">Free</th>
                    <th className="text-center p-4 font-semibold bg-yellow-50 dark:bg-yellow-950/20">
                      <div className="flex items-center justify-center gap-2">
                        <Crown className="w-4 h-4 text-yellow-500" />
                        Premium
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((item, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="p-4">{item.feature}</td>
                      <td className="p-4 text-center">
                        {typeof item.free === 'boolean' ? (
                          item.free ? (
                            <Check className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-400 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground">{item.free}</span>
                        )}
                      </td>
                      <td className="p-4 text-center bg-yellow-50 dark:bg-yellow-950/20">
                        {typeof item.premium === 'boolean' ? (
                          item.premium ? (
                            <Check className="w-5 h-5 text-yellow-600 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-400 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm font-medium">{item.premium}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Guarantee */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 max-w-3xl mx-auto">
            <Shield className="w-8 h-8 text-blue-600 shrink-0" />
            <div>
              <h3 className="font-bold text-lg mb-2">30-Day Money-Back Guarantee</h3>
              <p className="text-muted-foreground">
                Try Premium risk-free for 30 days. If you're not completely satisfied with your progress, 
                we'll refund you in full, no questions asked. We're confident you'll love the advanced 
                features and insights that will transform your trading discipline.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}