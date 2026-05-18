import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Crown, Check, X, TrendingUp, Zap, Shield, Star, Users, Upload, MessageSquare, Brain, BarChart3, Sparkles, AlertTriangle, CheckSquare, Loader2 } from 'lucide-react';
import { PremiumBadge } from '../components/PremiumBadge';
import { storage } from '../utils/storage';
import { toast } from 'sonner';

const STRIPE_LINKS = {
  monthly: 'https://buy.stripe.com/14A3co2Q0aasf6k1t26kg00',
  annual:  'https://buy.stripe.com/eVq9AM3U42I06zOefO6kg01',
};

export function Upgrade() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(storage.getCurrentUser());
  const [loading, setLoading] = useState<'monthly' | 'annual' | null>(null);
  const isPremium = currentUser?.isPremium || false;

  const handleUpgrade = (plan: 'monthly' | 'annual') => {
    const user = storage.getCurrentUser();
    if (!user) { toast.error('Please log in first'); return; }
    setLoading(plan);
    window.location.href = STRIPE_LINKS[plan];
  };

  const premiumFeatures = [
    { icon: Shield, title: 'Verified Trades', desc: 'Import & verify real broker data — no faking results' },
    { icon: TrendingUp, title: 'A+ Trade of Day', desc: 'Log your best setups and let AI find your patterns' },
    { icon: BarChart3, title: 'Unlimited Backtesting', desc: 'Unlimited backtesting entries (free gets 3)' },
    { icon: Sparkles, title: 'Unlimited Journal Entries', desc: 'Unlimited live journal entries (free gets 10)' },
    { icon: Shield, title: 'Account Rules Monitor', desc: 'Track prop firm limits & prevent violations' },
    { icon: CheckSquare, title: 'Pre-Trade Checklist', desc: 'Ensure discipline before every trade' },
    { icon: AlertTriangle, title: 'Behavior Risk Alerts', desc: 'Detect revenge trading & emotional patterns' },
    { icon: Brain, title: 'AI Strategy Builder', desc: 'Behavior improvement insights & reports' },
    { icon: BarChart3, title: 'Advanced Analytics', desc: 'Deep insights & pattern detection' },
    { icon: TrendingUp, title: 'AI Journal Insights', desc: 'Identify what actually works for you' },
    { icon: Zap, title: 'Double XP Days', desc: 'Accelerate your discipline growth' },
    { icon: Sparkles, title: 'Streak Savers', desc: 'Protect your progress (2/month)' },
    { icon: Sparkles, title: 'Unlimited Custom Fields', desc: 'Track any data point you need' },
    { icon: Users, title: 'Create Private Groups', desc: 'Build your own trading communities' },
    { icon: Upload, title: 'Upload Files', desc: 'Share images & files in groups & DMs' },
    { icon: Crown, title: 'Premium Badge', desc: 'Stand out with exclusive verification' },
  ];

  const comparisonFeatures = [
    { feature: 'Daily Check-In', free: true, premium: true },
    { feature: 'Social Feed', free: true, premium: true },
    { feature: 'Live Journal Entries', free: '10 entries', premium: 'Unlimited' },
    { feature: 'Backtesting Entries', free: '3 entries', premium: 'Unlimited' },
    { feature: 'A+ Trade of Day', free: false, premium: true },
    { feature: 'Verified Trades', free: false, premium: true },
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
            <div className="flex justify-center mb-4"><Crown className="w-16 h-16 text-yellow-500" /></div>
            <CardTitle className="text-3xl flex items-center justify-center gap-2">
              <span>You're Premium!</span><PremiumBadge size="lg" />
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
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Crown className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold">Upgrade to Premium</h1>
        </div>
        <p className="text-muted-foreground">Take your trading discipline to the next level</p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
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
            <Button onClick={() => handleUpgrade('monthly')} size="lg" className="w-full" variant="outline" disabled={!!loading}>
              {loading === 'monthly' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting...</> : 'Start Monthly Plan'}
            </Button>
            <p className="text-xs text-center text-muted-foreground">Cancel anytime</p>
          </CardContent>
        </Card>

        <Card className="border-4 border-yellow-500 relative shadow-xl">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black px-6 py-2 rounded-full text-sm font-bold shadow-lg">
            BEST VALUE — SAVE $36.89
          </div>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500" /> Annual
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
            <Button size="lg" className="w-full" onClick={() => handleUpgrade('annual')} disabled={!!loading}>
              {loading === 'annual' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting...</> : <><Crown className="w-5 h-5 mr-2" />Start Annual Plan</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Feature Highlights */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-center mb-6">Premium Features</h2>
        <div className="grid sm:grid-cols-2 gap-4">
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
      <div className="mb-10">
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
                        <Crown className="w-4 h-4 text-yellow-500" /> Premium
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((item, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="p-4 text-sm">{item.feature}</td>
                      <td className="p-4 text-center">
                        {typeof item.free === 'boolean' ? (
                          item.free ? <Check className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-5 h-5 text-gray-400 mx-auto" />
                        ) : <span className="text-sm text-muted-foreground">{item.free}</span>}
                      </td>
                      <td className="p-4 text-center bg-yellow-50 dark:bg-yellow-950/20">
                        {typeof item.premium === 'boolean' ? (
                          item.premium ? <Check className="w-5 h-5 text-yellow-600 mx-auto" /> : <X className="w-5 h-5 text-gray-400 mx-auto" />
                        ) : <span className="text-sm font-medium">{item.premium}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
