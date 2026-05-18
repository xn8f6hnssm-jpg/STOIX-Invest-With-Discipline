import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { signIn } from '../../utils/auth';

const TRADING_STYLES = ['Day Trader', 'Swing Trader', 'Long Term Hold', 'Other'];
const COMING_SOON_STYLES = ['Long Term Hold'];
const MARKETS = ['Stocks', 'Futures', 'Options', 'Forex', 'Crypto', 'Other'];

export function OnboardingProfile() {
  const navigate = useNavigate();
  const [tradingStyle, setTradingStyle] = useState('');
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [instruments, setInstruments] = useState(['', '', '']);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const onboardingData = sessionStorage.getItem('onboarding_user');
    console.log('🔍 OnboardingProfile mounted, checking for onboarding_user:', onboardingData);
    
    if (!onboardingData) {
      console.log('❌ No onboarding data found, redirecting to /');
      navigate('/');
    } else {
      console.log('✅ Onboarding data found, user can proceed');
    }
  }, [navigate]);

  const handleMarketToggle = (market: string) => {
    setSelectedMarkets(prev =>
      prev.includes(market)
        ? prev.filter(m => m !== market)
        : [...prev, market]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const filteredInstruments = instruments.filter(i => i.trim() !== '');
    
    sessionStorage.setItem('onboarding_profile', JSON.stringify({
      tradingStyle,
      markets: selectedMarkets,
      instruments: filteredInstruments,
    }));
    
    const onboardingData = sessionStorage.getItem('onboarding_user');
    if (onboardingData) {
      const userData = JSON.parse(onboardingData);
      
      console.log('🔐 Auto-logging in user:', userData.email);
      
      const result = await signIn({
        email: userData.email,
        password: userData.password
      }, true);
      
      if (result.success) {
        console.log('✅ Sign in successful, user created in localStorage');
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const currentUser = localStorage.getItem('tradeforge_currentUser');
        if (currentUser) {
          const user = JSON.parse(currentUser);
          console.log('✅ User verified in localStorage:', user);
          console.log('👤 User ID for rules:', user.id);
        } else {
          console.error('❌ CRITICAL: User not in localStorage after sign in!');
        }
        
        navigate('/onboarding/rules');
      } else {
        console.error('Auto-login failed:', result.error);
        sessionStorage.clear();
        navigate('/');
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Trading Profile</CardTitle>
          <CardDescription>Tell us about your trading style</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label>Trading Style</Label>
              <div className="grid grid-cols-2 gap-2">
                {TRADING_STYLES.map((style) => {
                  const isComingSoon = COMING_SOON_STYLES.includes(style);
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => !isComingSoon && setTradingStyle(style)}
                      disabled={isComingSoon}
                      className={`p-3 rounded-lg border-2 transition-all relative ${
                        isComingSoon
                          ? 'border-border opacity-50 cursor-not-allowed'
                          : tradingStyle === style
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span>{style}</span>
                      {isComingSoon && (
                        <span className="block text-xs text-muted-foreground mt-0.5">Coming Soon</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Markets (select all that apply)</Label>
              <div className="space-y-2">
                {MARKETS.map((market) => (
                  <div key={market} className="flex items-center space-x-2">
                    <Checkbox
                      id={market}
                      checked={selectedMarkets.includes(market)}
                      onCheckedChange={() => handleMarketToggle(market)}
                    />
                    <label
                      htmlFor={market}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {market}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Top 3 Instruments/Pairs (optional)</Label>
              <div className="space-y-2">
                {instruments.map((instrument, index) => (
                  <Input
                    key={index}
                    placeholder={`Instrument ${index + 1} (e.g., NQ, ES, GC)`}
                    value={instrument}
                    onChange={(e) => {
                      const newInstruments = [...instruments];
                      newInstruments[index] = e.target.value.toUpperCase();
                      setInstruments(newInstruments);
                    }}
                  />
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={!tradingStyle || selectedMarkets.length === 0 || isLoading}>
              {isLoading ? 'Loading...' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
