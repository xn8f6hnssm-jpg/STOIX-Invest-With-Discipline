import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { Home, BookOpen, Users, Shield, Menu, Brain, Award, UsersRound, CheckCircle, Trophy, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Logo } from '../components/Logo';
import { signOut, syncUserToSupabase } from '../utils/auth';
import { PremiumBadge } from '../components/PremiumBadge';
import { getCurrentUser } from '../utils/supabase';
import { storage } from '../utils/storage';
import { supabase } from '../utils/supabase';
import { initializeDemoData } from '../utils/demo-data';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../components/ui/sheet';
import { Separator } from '../components/ui/separator';

// Load user's journal entries and day logs from Supabase into localStorage
async function syncDataFromSupabase(userId: string) {
  try {
    // Sync journal entries
    const { data: journalData } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(200);

    if (journalData && journalData.length > 0) {
      const mapped = journalData.map((e: any) => ({
        id: e.id,
        userId: e.user_id,
        date: e.date,
        result: e.result,
        description: e.description || '',
        screenshots: e.screenshots || [],
        customFields: e.custom_fields || {},
        riskReward: e.risk_reward || 0,
        pnl: e.pnl || null,
        isNoTradeDay: e.is_no_trade_day || false,
        pointsAwarded: e.points_awarded || false,
        timestamp: e.timestamp || Date.now(),
        strategyId: e.strategy_id || null,
        assetName: e.asset_name || null,
        action: e.action || null,
        investmentThesis: e.investment_thesis || null,
        sellReason: e.sell_reason || null,
        beResolution: e.be_resolution || null,
      }));
      localStorage.setItem('tradeforge_journal_entries', JSON.stringify(mapped));
      console.log(`✅ Synced ${mapped.length} journal entries from Supabase`);
    }

    // Sync day logs
    const { data: logsData } = await supabase
      .from('day_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(100);

    if (logsData && logsData.length > 0) {
      const mapped = logsData.map((l: any) => ({
        id: l.id,
        userId: l.user_id,
        date: l.date,
        isClean: l.is_clean,
        photoUrl: l.photo_url || '',
        note: l.note || '',
        forfeitCompleted: l.forfeit_completed || null,
        pointsEarned: l.points_earned || 0,
        posted: l.posted || false,
      }));
      localStorage.setItem('tradeforge_daily_logs', JSON.stringify(mapped));
      console.log(`✅ Synced ${mapped.length} day logs from Supabase`);
    }

    // Sync strategies
    const { data: strategiesData } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', userId);

    if (strategiesData && strategiesData.length > 0) {
      const existing = JSON.parse(localStorage.getItem('tradeforge_strategies') || '[]');
      const mapped = strategiesData.map((s: any) => ({
        id: s.id,
        userId: s.user_id,
        name: s.name,
        description: s.description || '',
        color: s.color || '#3b82f6',
        createdAt: s.created_at || Date.now(),
      }));
      const merged = [...mapped, ...existing.filter((e: any) => !mapped.find((m: any) => m.id === e.id))];
      localStorage.setItem('tradeforge_strategies', JSON.stringify(merged));
      console.log(`✅ Synced ${mapped.length} strategies from Supabase`);
    }

    // Sync custom journal fields (confluences etc)
    const { data: fieldsData } = await supabase
      .from('journal_fields')
      .select('*')
      .eq('user_id', userId);

    if (fieldsData && fieldsData.length > 0) {
      const mapped = fieldsData.map((f: any) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        options: f.options || [],
        category: f.category || 'confluence',
        otherLabel: f.other_label || '',
      }));
      localStorage.setItem(`tradeforge_journal_fields_${userId}`, JSON.stringify(mapped));
      console.log(`✅ Synced ${mapped.length} journal fields from Supabase`);
    }

    // Sync daily check cooldown — check if user already logged today in Supabase
    // This fixes the cross-device "can log again" issue
    const today = new Date().toISOString().split('T')[0];
    const { data: todayLog } = await supabase
      .from('day_logs')
      .select('id, date')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (todayLog) {
      // They already logged today on another device — set the cooldown locally
      const cooldownKey = `daily_check_last_${userId}`;
      const existing = localStorage.getItem(cooldownKey);
      if (!existing) {
        // Set it to now so cooldown kicks in (they logged today, block re-log)
        localStorage.setItem(cooldownKey, Date.now().toString());
        console.log('✅ Daily check cooldown synced from Supabase — already logged today');
      }
    }

  } catch (err) {
    console.error('syncDataFromSupabase error:', err);
  }
}

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPremium] = useState(false);

  useEffect(() => {
    const syncUser = async () => {
      const localUser = storage.getCurrentUser();

      const justCompletedOnboarding = sessionStorage.getItem('just_completed_onboarding');
      if (justCompletedOnboarding) {
        console.log('🎓 User just completed onboarding, skipping sync');
        sessionStorage.removeItem('just_completed_onboarding');
        await syncUserToSupabase();
        return;
      }

      if (localUser) {
        console.log('✅ LocalStorage user found:', localUser.username);
        // Sync data FROM Supabase on every load to keep cross-device in sync
        syncDataFromSupabase(localUser.id).catch(console.error);
        syncUserToSupabase().catch(err => console.error('Background sync failed:', err));
        return;
      }

      const supabaseUser = await getCurrentUser();
      if (supabaseUser) {
        const userData = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          password: '',
          username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || '',
          name: supabaseUser.user_metadata?.name || 'Trader',
          tradingStyle: supabaseUser.user_metadata?.tradingStyle || '',
          instruments: supabaseUser.user_metadata?.instruments || [],
          rules: [],
          totalPoints: 0,
          cleanDays: 0,
          forfeitDays: 0,
          currentStreak: 0,
          followers: 0,
          following: 0,
          isVerified: false,
          profilePicture: '',
          isPremium: false,
        };
        storage.setCurrentUser(userData);
        console.log('✅ User synced from Supabase to localStorage:', userData.username);
        await syncUserToSupabase();
        // Also pull their data from Supabase
        await syncDataFromSupabase(supabaseUser.id);
        initializeDemoData();
      } else {
        console.log('⚠️ No user found, redirecting to onboarding');
        navigate('/');
      }
    };

    syncUser();
  }, [navigate]);

  const navigation = [
    { name: 'Dashboard', path: '/app', icon: Home, label: 'Dashboard' },
    { name: 'Daily Check', path: '/app/daily-check', icon: CheckCircle, label: 'Daily Check' },
    { name: 'RevengeX', path: '/app/revengex', icon: Shield, label: 'RevengeX' },
    { name: 'Journal', path: '/app/journal', icon: BookOpen, label: 'Journal' },
    { name: 'Social', path: '/app/social', icon: Users, label: 'Social' },
  ];

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await signOut();
      navigate('/');
    }
  };

  const isActive = (path: string) => {
    if (path === '/app') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="w-full max-w-2xl mx-auto flex flex-col min-h-screen overflow-x-hidden">
        {/* Top bar */}
        <div className="border-b bg-card sticky top-0 z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <Logo size="sm" />
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription>Manage your account and settings</SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-4">
                  <Separator />
                  <nav className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate('/app/ai-analytics'); setMenuOpen(false); }}>
                      <Brain className="w-4 h-4 mr-2" /> AI Analytics
                      {isPremium && <PremiumBadge size="sm" className="ml-2" />}
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate('/app/mental-prep'); setMenuOpen(false); }}>
                      <Sparkles className="w-4 h-4 mr-2 text-purple-500" /> Mental Preparation
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate('/app/achievements'); setMenuOpen(false); }}>
                      <Award className="w-4 h-4 mr-2" /> Achievements
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate('/app/prop-firm-success'); setMenuOpen(false); }}>
                      <Trophy className="w-4 h-4 mr-2" /> Prop Firm Success
                      {isPremium && <PremiumBadge size="sm" className="ml-2" />}
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate('/app/groups'); setMenuOpen(false); }}>
                      <UsersRound className="w-4 h-4 mr-2" /> Groups
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate('/app/messages'); setMenuOpen(false); }}>
                      Direct Messages
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate('/app/notifications'); setMenuOpen(false); }}>
                      Notifications
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate('/app/settings'); setMenuOpen(false); }}>
                      Settings
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate('/app/edit-rules'); setMenuOpen(false); }}>
                      Edit Rules
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate('/app/upgrade'); setMenuOpen(false); }}>
                      Upgrade
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate('/app/legal'); setMenuOpen(false); }}>
                      Legal
                    </Button>
                  </nav>
                  <Separator />
                  <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Main content — full width on mobile, padded on desktop */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-20 w-full">
          <div style={{ animation: 'fadeIn 0.15s ease-out' }}>
            <style>{`
              @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
              * { -webkit-tap-highlight-color: transparent; }
              button, a { touch-action: manipulation; }
            `}</style>
            <Outlet />
          </div>
        </div>

        {/* Bottom navigation — full width, fixed */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t z-10">
          <div className="max-w-2xl mx-auto px-2 py-2">
            <nav className="flex items-center justify-around">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                      active ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
