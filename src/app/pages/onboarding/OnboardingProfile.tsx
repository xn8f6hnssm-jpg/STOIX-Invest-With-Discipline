import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { signIn } from '../../utils/auth';

const TRADING_STYLES = ['Day Trader', 'Swing Trader', 'Long Term Hold', 'Other'];
const MARKETS = ['Stocks', 'Futures', 'Options', 'Forex', 'Crypto', 'Other'];

export function OnboardingProfile() {
  const navigate = useNavigate();
  const [tradingStyle, setTradingStyle] = useState('');
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [instruments, setInstruments] = useState(['', '', '']);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if we have signup data
    const onboardingData = sessionStorage.getItem('onboarding_user');
    console.log('🔍 OnboardingProfile mounted, checking for onboarding_user:', onboardingData);
    
    if (!onboardingData) {
      // No signup data, redirect to signup
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
    
    // Store profile data in sessionStorage to use after login
    sessionStorage.setItem('onboarding_profile', JSON.stringify({
      tradingStyle,
      markets: selectedMarkets,
      instruments: filteredInstruments,
    }));
    
    // Get signup data and auto-login
    const onboardingData = sessionStorage.getItem('onboarding_user');
    if (onboardingData) {
      const userData = JSON.parse(onboardingData);
      
      console.log('🔐 Auto-logging in user:', userData.email);
      
      // Sign in the user (skip profile fetch during onboarding)
      const result = await signIn({
        email: userData.email,
        password: userData.password
      }, true); // skipProfileFetch = true for onboarding
      
      if (result.success) {
        console.log('✅ Sign in successful, user created in localStorage');
        
        // Wait a tiny bit to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Verify user is in localStorage
        const currentUser = localStorage.getItem('tradeforge_currentUser');
        if (currentUser) {
          const user = JSON.parse(currentUser);
          console.log('✅ User verified in localStorage:', user);
          console.log('👤 User ID for rules:', user.id);
        } else {
          console.error('❌ CRITICAL: User not in localStorage after sign in!');
        }
        
        // Navigate to rules setup
        navigate('/onboarding/rules');
      } else {
        console.error('Auto-login failed:', result.error);
        // Clear session and redirect to login
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
                {TRADING_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setTradingStyle(style)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      tradingStyle === style
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {style}
                  </button>
                ))}
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