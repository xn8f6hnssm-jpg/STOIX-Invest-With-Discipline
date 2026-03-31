import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { Home, BookOpen, Users, Shield, Menu, Brain, Award, UsersRound, DollarSign, CheckCircle, Trophy, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Logo } from '../components/Logo';
import { signOut } from '../utils/auth';
import { PremiumBadge } from '../components/PremiumBadge';
import { getCurrentUser } from '../utils/supabase';
import { storage } from '../utils/storage';
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

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPremium] = useState(false); // TODO: Load from user profile

  // Sync Supabase user with localStorage on mount
  useEffect(() => {
    const syncUser = async () => {
      // FIRST: Check if we have a localStorage user (for local development)
      const localUser = storage.getCurrentUser();
      
      // Check if user just completed onboarding
      const justCompletedOnboarding = sessionStorage.getItem('just_completed_onboarding');
      if (justCompletedOnboarding) {
        console.log('🎓 User just completed onboarding, skipping sync to preserve onboarding data');
        sessionStorage.removeItem('just_completed_onboarding');
        return; // Don't overwrite the onboarding data
      }
      
      // If we have a localStorage user, we're good - no need to check Supabase
      if (localUser) {
        console.log('✅ LocalStorage user found:', localUser.username);
        return; // User is logged in via localStorage
      }
      
      // Only check Supabase if no localStorage user exists
      const supabaseUser = await getCurrentUser();
      if (supabaseUser) {
        // Create or update user in localStorage from Supabase data
        const userData = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          password: '', // Not stored for security
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
        
        // Save to localStorage
        storage.setCurrentUser(userData);
        console.log('✅ User synced from Supabase to localStorage:', userData.username);
        
        // Initialize demo data for new users
        initializeDemoData();
        console.log('✅ Demo data initialized for new user');
      } else {
        // No localStorage user AND no Supabase session, redirect to login
        console.log('⚠️ No user found in localStorage or Supabase, redirecting to onboarding');
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
    if (path === '/app') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-[1200px] flex flex-col">
        {/* Top bar */}
        <div className="border-b bg-card">
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
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => {
                        navigate('/app/ai-analytics');
                        setMenuOpen(false);
                      }}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      AI Analytics
                      {isPremium && <PremiumBadge size="sm" className="ml-2" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => {
                        navigate('/app/mental-prep');
                        setMenuOpen(false);
                      }}
                    >
                      <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                      Mental Preparation
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => {
                        navigate('/app/achievements');
                        setMenuOpen(false);
                      }}
                    >
                      <Award className="w-4 h-4 mr-2" />
                      Achievements
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => {
                        navigate('/app/prop-firm-success');
                        setMenuOpen(false);
                      }}
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      Prop Firm Success
                      {isPremium && <PremiumBadge size="sm" className="ml-2" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => {
                        navigate('/app/groups');
                        setMenuOpen(false);
                      }}
                    >
                      <UsersRound className="w-4 h-4 mr-2" />
                      Groups
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => {
                        navigate('/app/messages');
                        setMenuOpen(false);
                      }}
                    >
                      Direct Messages
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => {
                        navigate('/app/notifications');
                        setMenuOpen(false);
                      }}
                    >
                      Notifications
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => {
                        navigate('/app/settings');
                        setMenuOpen(false);
                      }}
                    >
                      Settings
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => {
                        navigate('/app/edit-rules');
                        setMenuOpen(false);
                      }}
                    >
                      Edit Rules
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => {
                        navigate('/app/upgrade');
                        setMenuOpen(false);
                      }}
                    >
                      Upgrade
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

        {/* Main content */}
        <div className="flex-1 overflow-auto pb-20">
          <Outlet />
        </div>

        {/* Bottom navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t">
          <div className="container mx-auto px-2 py-2">
            <nav className="flex items-center justify-around">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                      active
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground'
                    } ${item.highlight ? 'relative' : ''}`}
                  >
                    {item.highlight && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                    )}
                    <Icon className={`w-5 h-5 ${item.highlight && active ? 'scale-110' : ''}`} />
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