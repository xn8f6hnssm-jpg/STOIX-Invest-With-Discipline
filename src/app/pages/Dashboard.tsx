import { useState, useEffect, useRef } from 'react';
import { WelcomeDialog } from '../components/WelcomeDialog';
import { DisciplineShareCard } from '../components/DisciplineShareCard';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router';
import { PremiumBadge } from '../components/PremiumBadge';
import { PremiumFeatures } from '../components/PremiumFeatures';
import { AccountRulesWidget } from '../components/AccountRulesWidget';
import { storage, getLeague, getDisciplineRate, checkDemotion } from '../utils/storage';
import { supabase } from '../utils/supabase';
import { Card, CardContent } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Plus, Trophy, XCircle, Target, TrendingUp, Trash2, Edit, Users, Share2 } from 'lucide-react';

const TIER_GRADIENTS: Record<string, { bg: string; shield: string; text: string }> = {
  Bronze:   { bg: 'from-amber-700 to-amber-900',   shield: '#b45309', text: '#fef3c7' },
  Silver:   { bg: 'from-slate-400 to-slate-600',   shield: '#94a3b8', text: '#f1f5f9' },
  Gold:     { bg: 'from-yellow-400 to-yellow-600', shield: '#ca8a04', text: '#fefce8' },
  Diamond:  { bg: 'from-cyan-400 to-blue-600',     shield: '#0891b2', text: '#e0f2fe' },
  Platinum: { bg: 'from-cyan-200 to-slate-400',    shield: '#67e8f9', text: '#083344' },
};

function LeagueBadgeIcon({ tier, size = 36 }: { tier: string; size?: number }) {
  const colors = TIER_GRADIENTS[tier] || TIER_GRADIENTS.Bronze;
  const id = `shield-${tier}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 46" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="40" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={colors.shield} stopOpacity="1" />
          <stop offset="100%" stopColor={colors.shield} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <path d="M20 2 L36 8 L36 22 C36 32 28 40 20 44 C12 40 4 32 4 22 L4 8 Z" fill={`url(#${id})`} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      <path d="M20 6 L33 11 L33 22 C33 30 26 37 20 40 C14 37 7 30 7 22 L7 11 Z" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <circle cx="20" cy="21" r="5" fill="rgba(255,255,255,0.35)" />
      <path d="M20 16 L21.2 19.5 L25 19.5 L22 21.8 L23.1 25.3 L20 23 L16.9 25.3 L18 21.8 L15 19.5 L18.8 19.5 Z" fill="rgba(255,255,255,0.9)" />
    </svg>
  );
}

const isWeekend = (date: Date): boolean => {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
};

const getLastWeekday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let day = today.getDay();
  // If today is Sunday (0), last weekday was Friday (2 days ago)
  // If today is Monday (1), last weekday was Friday (3 days ago)
  // If today is Saturday (6), last weekday was Friday (1 day ago)
  if (day === 0) today.setDate(today.getDate() - 2);
  else if (day === 1) today.setDate(today.getDate() - 3);
  else if (day === 6) today.setDate(today.getDate() - 1);
  else today.setDate(today.getDate() - 1);
  return today;
};

const checkAndResetStreak = () => {
  const user = storage.getCurrentUser();
  if (!user || user.currentStreak === 0) return;
  const logs = storage.getDayLogs();
  const userLogs = logs.filter(l => l.userId === user.id);
  if (userLogs.length === 0) return;
  const sortedLogs = [...userLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lastLog = sortedLogs[0];
  const lastLogDate = new Date(lastLog.date);
  lastLogDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If today is a weekend, don't reset streak
  if (isWeekend(today)) return;

  // If last log was today, streak is fine
  if (lastLogDate.getTime() === today.getTime()) return;

  // If last log was yesterday (weekday), streak is fine
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (lastLogDate.getTime() === yesterday.getTime()) return;

  // If today is Monday, check if last log was Friday (weekend gap is ok)
  if (today.getDay() === 1) {
    const lastFriday = new Date(today);
    lastFriday.setDate(today.getDate() - 3);
    if (lastLogDate.getTime() >= lastFriday.getTime()) return;
  }

  // Missed a weekday — reset streak
  storage.updateCurrentUser({ currentStreak: 0 });
};

export function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(storage.getCurrentUser());
  const [posts, setPosts] = useState(storage.getPosts());
  const [league, setLeague] = useState(getLeague(storage.getCurrentUser()?.totalPoints || 0));
  const [isDemoted, setIsDemoted] = useState(false);
  const [disciplineRate, setDisciplineRate] = useState(0);
  const [hasLoggedToday, setHasLoggedToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null);
  const [showShareCard, setShowShareCard] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followerList, setFollowerList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const [profilePic, setProfilePic] = useState<string>('');
  const [uploadingPic, setUploadingPic] = useState(false);

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingPic(true);

    // Show instant preview with object URL
    const objectUrl = URL.createObjectURL(file);
    setProfilePic(objectUrl);

    try {
      // Convert to base64
      const base64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload to Supabase Storage with unique filename
      const filename = `avatar_${Date.now()}`;
      const url = await storage.uploadImage(base64, user.id, filename, 'profile', 'profile');

      if (!url) throw new Error('Upload failed - no URL returned');

      // Update Supabase users table
      const { error } = await supabase.from('users').update({ profile_picture: url }).eq('id', user.id);
      if (error) throw new Error('DB update failed: ' + error.message);

      // Update localStorage
      const u = storage.getCurrentUser();
      if (u) {
        u.profilePicture = url;
        localStorage.setItem('tradeforge_current_user', JSON.stringify(u));
        const allUsers = JSON.parse(localStorage.getItem('tradeforge_all_users') || '[]');
        const idx = allUsers.findIndex((au: any) => au.id === u.id);
        if (idx !== -1) { allUsers[idx].profilePicture = url; localStorage.setItem('tradeforge_all_users', JSON.stringify(allUsers)); }
      }

      // Set final URL with cache buster
      setProfilePic(url + '?t=' + Date.now());
    } catch (err) {
      console.error('Profile picture upload error:', err);
      // Revert preview on error
      const u = storage.getCurrentUser();
      setProfilePic(u?.profilePicture || '');
    } finally {
      setUploadingPic(false);
    }
  };

  const refreshData = async () => {
    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      // Only update user state if not currently uploading a profile pic
      if (!uploadingPic) {
        setUser({ ...currentUser });
      }
      const cleanDays = currentUser.cleanDays ?? 0;
      const forfeitDays = currentUser.forfeitDays ?? 0;
      const totalDays = cleanDays + forfeitDays;
      setDisciplineRate(getDisciplineRate(cleanDays, totalDays));
      setLeague(getLeague(currentUser.totalPoints ?? 0));
      setIsDemoted(checkDemotion(currentUser.id));

      // Load posts from Supabase for recent activity
      try {
        const { data } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('timestamp', { ascending: false })
          .limit(20);
        if (data) {
          const mapped = data.map((p: any) => ({
            id: p.id, userId: p.user_id, username: p.username,
            avatarUrl: p.avatar_url || '', league: p.league || '0',
            isVerified: p.is_verified || false, type: p.type || 'general',
            photoUrl: p.photo_url || '', images: p.images || [],
            caption: p.caption || '', likes: p.likes || 0,
            comments: [], timestamp: p.timestamp || Date.now(),
            journalData: p.journal_data || null,
          }));
          setPosts(mapped);
        } else {
          setPosts(storage.getPosts().filter(p => p.userId === currentUser.id));
        }
      } catch {
        setPosts(storage.getPosts().filter(p => p.userId === currentUser.id));
      }
    }
    setHasLoggedToday(!!storage.getTodayLog());
  };

  useEffect(() => {
    const init = async () => {
      checkAndResetStreak();
      await refreshData();
      setIsLoading(false);
    };
    init();
    // Always load profile picture from Supabase on mount - single source of truth
    const loadPic = async () => {
      const u = storage.getCurrentUser();
      if (!u) return;
      const { data } = await supabase.from('users').select('profile_picture').eq('id', u.id).maybeSingle();
      if (data?.profile_picture) {
        setProfilePic(data.profile_picture + '?t=' + Date.now());
        // Update localStorage
        u.profilePicture = data.profile_picture;
        localStorage.setItem('tradeforge_current_user', JSON.stringify(u));
      } else if (u.profilePicture && !u.profilePicture.startsWith('data:image')) {
        setProfilePic(u.profilePicture);
      }
    };
    loadPic();
  }, []);

  useEffect(() => {
    const loadFollowData = async () => {
      const u = storage.getCurrentUser();
      if (!u) return;

      // Get counts
      const [{ data: followers }, { data: following }] = await Promise.all([
        supabase.from('following').select('follower_id').eq('following_id', u.id),
        supabase.from('following').select('following_id').eq('follower_id', u.id),
      ]);
      setFollowerCount(followers?.length || 0);
      setFollowingCount(following?.length || 0);

      // Get follower user details
      const followerIds = (followers || []).map((r: any) => r.follower_id);
      const followingIds = (following || []).map((r: any) => r.following_id);

      if (followerIds.length > 0) {
        const { data: fUsers } = await supabase.from('users').select('id, username, name, profile_picture, total_points').in('id', followerIds);
        setFollowerList(fUsers || []);
      }
      if (followingIds.length > 0) {
        const { data: fgUsers } = await supabase.from('users').select('id, username, name, profile_picture, total_points').in('id', followingIds);
        setFollowingList(fgUsers || []);
      }
    };
    loadFollowData();
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) { checkAndResetStreak(); refreshData(); }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const handleDeletePost = async (postId: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      // Remove from local state immediately
      setPosts(prev => prev.filter((p: any) => p.id !== postId));
      // Delete from localStorage
      storage.deletePost(postId);
      // Delete from Supabase
      try {
        await supabase.from('posts').delete().eq('id', postId);
        await supabase.from('comments').delete().eq('post_id', postId);
      } catch (err) {
        console.error('Delete post error:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-muted-foreground">Unable to load user data. Please try refreshing.</p>
        </div>
      </div>
    );
  }

  const userPosts = posts.filter(p => p.userId === user.id);
  const journalEntries = storage.getJournalEntries().filter(e => e.userId === user.id);
  const isLongTermHold = user.tradingStyle === 'Long Term Hold';
  const entriesForStats = isLongTermHold ? journalEntries.filter(e => e.action === 'sell') : journalEntries;

  const tradingStats = {
    totalTrades: isLongTermHold ? entriesForStats.length : journalEntries.length,
    wins: entriesForStats.filter(e => e.result === 'win' || e.result === 'breakeven').length,
    losses: entriesForStats.filter(e => e.result === 'loss').length,
    winRate: entriesForStats.length > 0 ? Math.round((entriesForStats.filter(e => e.result === 'win' || e.result === 'breakeven').length / entriesForStats.length) * 100) : 0,
    avgRR: entriesForStats.length > 0 ? (entriesForStats.reduce((sum, e) => sum + (e.riskReward || 0), 0) / entriesForStats.length).toFixed(2) : '0.00',
  };

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const totalPnL = entriesForStats.reduce((sum, e) => sum + (e.pnl || 0), 0);
  const dailyPnL = entriesForStats.filter(e => e.date === todayStr).reduce((sum, e) => sum + (e.pnl || 0), 0);
  const weeklyPnL = entriesForStats.filter(e => e.date >= weekStartStr).reduce((sum, e) => sum + (e.pnl || 0), 0);
  const fmtPnL = (val: number) => `${val >= 0 ? '+' : ''}$${Math.abs(val).toFixed(0)}`;

  // followerList and followingList loaded from Supabase in useEffect above

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <WelcomeDialog />

      {/* Getting Started Checklist — only shows until all steps done */}
      {(() => {
        if (!user) return null;
        const hasJournal = storage.getJournalEntries().filter(e => e.userId === user.id).length > 0;
        const hasDailyCheck = (user.cleanDays || 0) + (user.forfeitDays || 0) > 0;
        const hasPost = userPosts.length > 0;
        const hasRules = storage.getAccountRules()?.maxDailyLoss || storage.getAccountRules()?.consistencyRules;
        const allDone = hasJournal && hasDailyCheck && hasPost;
        if (allDone) return null;

        const steps = [
          { label: 'Complete your first Daily Check-In', done: hasDailyCheck, path: '/app/daily-check', icon: '✅' },
          { label: 'Add your first journal entry', done: hasJournal, path: '/app/journal', icon: '📓' },
          { label: 'Share your first post on Social', done: hasPost, path: '/app/social', icon: '📸' },
        ];
        const doneCount = steps.filter(s => s.done).length;

        return (
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-sm">Getting Started</p>
                  <p className="text-xs text-muted-foreground">{doneCount} of {steps.length} complete</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-yellow-600">{Math.round(doneCount / steps.length * 100)}%</p>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mb-3">
                <div className="h-1.5 rounded-full bg-yellow-500 transition-all" style={{ width: `${doneCount / steps.length * 100}%` }} />
              </div>
              <div className="space-y-2">
                {steps.map((s, i) => (
                  <div key={i} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${s.done ? 'opacity-50' : 'hover:bg-yellow-500/10'}`}
                    onClick={() => !s.done && navigate(s.path)}>
                    <span className="text-base">{s.done ? '✅' : s.icon}</span>
                    <span className={`text-sm flex-1 ${s.done ? 'line-through text-muted-foreground' : ''}`}>{s.label}</span>
                    {!s.done && <span className="text-xs text-yellow-600 font-medium">Go →</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Followers / Following Modal */}
      <Dialog open={!!followModal} onOpenChange={() => setFollowModal(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {followModal === 'followers' ? 'Followers' : 'Following'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {(followModal === 'followers' ? followerList : followingList).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {followModal === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
              </p>
            ) : (
              (followModal === 'followers' ? followerList : followingList).map(u => {
                const uLeague = getLeague(u.total_points || u.totalPoints || 0);
                return (
                  <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors" onClick={() => { setFollowModal(null); navigate(`/app/profile/${u.id}`); }}>
                    <Avatar className="w-9 h-9 flex-shrink-0">
                      <AvatarImage src={u.profile_picture || u.profilePicture} />
                      <AvatarFallback className="text-sm">{u.name?.[0] || u.username?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{u.username}</p>
                      <p className="text-xs text-muted-foreground">{uLeague.name} League</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Card Dialog */}
      <Dialog open={showShareCard} onOpenChange={setShowShareCard}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Share Your Card</DialogTitle>
          </DialogHeader>
          <DisciplineShareCard />
        </DialogContent>
      </Dialog>

      {/* Daily Check CTA */}
      {!hasLoggedToday && (
        <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white border-0">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Ready to log your day?</h3>
                <p className="text-blue-100 text-sm">Keep your streak alive and earn points!</p>
              </div>
              <Button onClick={() => navigate('/app/daily-check')} variant="secondary" size="lg">Daily Check-In</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Premium Features */}
      {user.isPremium && <PremiumFeatures />}

      {/* Account Rules Monitor */}
      <AccountRulesWidget />

      {/* Profile Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  {profilePic ? (
                    <AvatarImage src={profilePic} alt="Profile Picture" key={profilePic} />
                  ) : (
                    <AvatarFallback className="text-2xl">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  )}
                  {uploadingPic && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    </div>
                  )}
                </Avatar>
                <button onClick={() => profilePicInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-lg border-2 border-background">
                  <Plus className="w-4 h-4" />
                </button>
                <input ref={profilePicInputRef} type="file" accept="image/*" onChange={handleProfilePictureChange} className="hidden" />
              </div>
              <div className={`relative px-4 py-3 rounded-xl bg-gradient-to-br ${TIER_GRADIENTS[league.tier]?.bg || 'from-slate-400 to-slate-600'} text-white shadow-lg flex flex-col items-center gap-1`}>
                <LeagueBadgeIcon tier={league.tier} size={36} />
                <div className="text-center leading-tight">
                  <div className="text-xs font-semibold opacity-90 tracking-wide">{league.tier}</div>
                  <div className="text-sm font-bold">{league.roman}</div>
                </div>
              </div>
              {isDemoted && <Badge variant="destructive" className="text-xs">⚠ Demotion Risk</Badge>}
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{disciplineRate}%</div>
                <div className="text-xs text-muted-foreground">Discipline</div>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold truncate">{user.name}</h2>
                    {storage.isPremium() && <PremiumBadge size="md" />}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-muted-foreground text-sm">@{user.username}</p>
                    {user.tradingStyle && (
                      <div className="flex items-center gap-1 text-sm font-medium text-primary">
                        <TrendingUp className="w-3 h-3" />{user.tradingStyle}
                      </div>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate(`/app/profile/${user.id}`)} className="flex items-center gap-1 flex-shrink-0 text-xs px-2">
                  <Edit className="w-3 h-3" /> Edit
                </Button>
              </div>

              <div className="flex gap-6 text-sm">
                <button className="text-left hover:opacity-70 transition-opacity" onClick={() => setFollowModal('followers')}>
                  <span className="font-bold">{followerCount}</span>
                  <span className="text-muted-foreground ml-1">Followers</span>
                </button>
                <button className="text-left hover:opacity-70 transition-opacity" onClick={() => setFollowModal('following')}>
                  <span className="font-bold">{followingCount}</span>
                  <span className="text-muted-foreground ml-1">Following</span>
                </button>
              </div>

              {user.instruments.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Pairs traded:</p>
                  <p className="font-medium">{user.instruments.join(', ')}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />{user.currentStreak ?? 0} Day Streak
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share Card Button */}
      <Card className="border border-border">
        <CardContent className="pt-4 pb-4">
          <Button className="w-full" variant="outline" onClick={() => setShowShareCard(true)}>
            <Share2 className="w-4 h-4 mr-2" /> Share Card
          </Button>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <div className="text-2xl font-bold">{user.cleanDays ?? 0}</div>
            <div className="text-sm text-muted-foreground">Clean Days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-orange-500" />
              </div>
            </div>
            <div className="text-2xl font-bold">{user.forfeitDays ?? 0}</div>
            <div className="text-sm text-muted-foreground">Forfeit Days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <div className="text-2xl font-bold">{user.totalPoints ?? 0}</div>
            <div className="text-sm text-muted-foreground">Total Points</div>
          </CardContent>
        </Card>
      </div>

      {/* Trading Stats */}
      {tradingStats.totalTrades > 0 && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4 text-sm">Trading Performance</h3>
            <div className="grid grid-cols-5 gap-3 mb-4">
              <div className="text-center"><div className="text-xl font-bold">{tradingStats.totalTrades}</div><div className="text-xs text-muted-foreground">Total</div></div>
              <div className="text-center"><div className="text-xl font-bold text-green-500">{tradingStats.wins}</div><div className="text-xs text-muted-foreground">Wins</div></div>
              <div className="text-center"><div className="text-xl font-bold text-red-500">{tradingStats.losses}</div><div className="text-xs text-muted-foreground">Losses</div></div>
              <div className="text-center"><div className="text-xl font-bold text-blue-500">{tradingStats.winRate}%</div><div className="text-xs text-muted-foreground">Win Rate</div></div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-500">{isLongTermHold ? `${Number(tradingStats.avgRR) > 0 ? '+' : ''}${tradingStats.avgRR}%` : tradingStats.avgRR}</div>
                <div className="text-xs text-muted-foreground">{isLongTermHold ? '% Gain' : 'Avg R:R'}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-purple-200/50 dark:border-purple-800/30">
              <div className="text-center"><div className={`text-lg font-bold ${dailyPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>{fmtPnL(dailyPnL)}</div><div className="text-xs text-muted-foreground">Today P&L</div></div>
              <div className="text-center"><div className={`text-lg font-bold ${weeklyPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>{fmtPnL(weeklyPnL)}</div><div className="text-xs text-muted-foreground">This Week</div></div>
              <div className="text-center"><div className={`text-lg font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>{fmtPnL(totalPnL)}</div><div className="text-xs text-muted-foreground">All Time</div></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        {userPosts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No posts yet. Complete your daily check to get started!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {userPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group">
                <div className="aspect-square bg-muted relative">
                  {post.photoUrl ? (
                    <img src={post.photoUrl} alt="Post" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                  )}
                  <Badge className="absolute top-1 right-1 text-xs py-0" variant={post.type === 'clean' ? 'default' : 'secondary'}>
                    {post.type === 'clean' ? '✓' : '⚡'}
                  </Badge>
                  <Button onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }} size="sm" variant="destructive" className="absolute top-1 left-1 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <CardContent className="p-2">
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{post.likes} ♥</span>
                    <span>{post.comments.length} 💬</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
