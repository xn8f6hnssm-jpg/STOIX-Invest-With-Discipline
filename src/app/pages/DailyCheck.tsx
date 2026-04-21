import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle, XCircle, Upload, Sparkles, Zap, Clock, Timer, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { storage } from '../utils/storage';

const COOLDOWN_HOURS = 5;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

// Daily Check-In Component
const DEFAULT_FORFEITS = [
  '100 pushups (any sets)',
  '50 burpees',
  '3-mile run',
  '2-minute wall sit (3 rounds)',
  '200 bodyweight squats',
  '5-minute plank hold (accumulated)',
  '100 walking lunges',
  '20-minute HIIT workout',
  '40 pull-ups (any sets, must complete total)',
  'Write your trading rules 100 times',
  '1-hour backtesting session',
  '30-minute market structure study',
  'Rewatch ALL losing trades from this week and journal key mistakes',
  'Read one trading book chapter and summarize it',
  'Build a full trade plan for tomorrow before sleeping',
  '20-minute meditation session',
  'No social media for 24 hours',
  'Cold shower (minimum 2 minutes)',
  'Wake up at 5:00 AM tomorrow',
];

const INVESTOR_FORFEITS = [
  // Physical
  '100 pushups (any sets)',
  '50 burpees',
  '3-mile run',
  '2-minute wall sit (3 rounds)',
  '5-minute plank hold (accumulated)',
  'Cold shower (minimum 2 minutes)',
  'Wake up at 5:00 AM tomorrow',
  // Mental / Discipline
  'Do not check your portfolio for 24 hours',
  'Rewrite your investment thesis for your largest position',
  'Read your investing principles 5 times out loud',
  'Write why you invested originally in each position',
  'Review all past early sells and journal regret cost',
  'Wait 48 hours before making any sell decision',
  'No financial social media for 24 hours',
  'Write 10 reasons why patience wins in investing',
  'Review your invalidation conditions for all positions',
  'Re-read your long term investment plan',
  '20-minute meditation session',
  'Read one investing book chapter and summarize it',
  'No market news or financial TV for 48 hours',
  'Journal about an emotional decision you almost made',
];

// Points: random 26–30 base. Max with public post bonus = 35 (30+5)
const getRandomDailyPoints = (): number => {
  return Math.floor(Math.random() * 5) + 26; // 26, 27, 28, 29, or 30
};

type Step = 'question' | 'clean-proof' | 'forfeit-wheel' | 'forfeit-proof' | 'summary';

// ── Summary Screen Component ──────────────────────────────────────────────────
function SummaryScreen({
  isClean,
  pointsEarned,
  photoPreview,
  note,
  isNoTradeDay,
  selectedForfeit,
  onNavigate,
  userId,
}: {
  isClean: boolean;
  pointsEarned: number;
  photoPreview: string;
  note: string;
  isNoTradeDay: boolean;
  selectedForfeit: string;
  onNavigate: () => void;
  userId?: string;
}) {
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    const update = () => {
      if (!userId) return;
      const last = localStorage.getItem(`daily_check_last_${userId}`);
      if (!last) return;
      const elapsed = Date.now() - parseInt(last);
      const remaining = COOLDOWN_MS - elapsed;
      if (remaining <= 0) { setCountdown('Available now'); return; }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      setCountdown(`${h}h ${m}m`);
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  const dayType = isNoTradeDay ? 'No Trade Day' : isClean ? 'Trade Day ✓' : 'Forfeit Day ⚡';

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-1">Daily Check Logged</p>
              <h2 className="text-2xl font-bold">
                {isClean ? '✓ Clean Day' : '⚡ Forfeit Day'}
              </h2>
            </div>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isClean ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
              {isClean
                ? <CheckCircle className="w-8 h-8 text-green-500" />
                : <XCircle className="w-8 h-8 text-orange-500" />
              }
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-background border">
              <p className="text-xs text-muted-foreground mb-1">Points Earned</p>
              <p className="text-2xl font-bold text-green-500">+{pointsEarned}</p>
            </div>
            <div className="p-3 rounded-lg bg-background border">
              <div className="flex items-center gap-1.5 mb-1">
                <Timer className="w-3 h-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Next Available In</p>
              </div>
              <p className="text-lg font-bold text-blue-500">{countdown || '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What was logged */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">What You Logged</p>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isClean ? 'bg-green-500/20' : 'bg-orange-500/20'}`}>
              {isClean ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-orange-600" />}
            </div>
            <div>
              <p className="font-semibold text-sm">{dayType}</p>
              {selectedForfeit && <p className="text-xs text-muted-foreground">Forfeit: {selectedForfeit}</p>}
            </div>
          </div>

          {note && (
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Your Note</p>
              <p className="text-sm leading-relaxed">{note}</p>
            </div>
          )}

          {photoPreview && (
            <div className="rounded-lg overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> Uploaded Proof
              </p>
              <img src={photoPreview} alt="Proof" className="w-full max-h-64 object-cover rounded-lg" />
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={onNavigate} className="w-full h-12 text-base font-semibold">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Button>
    </div>
  );
}

export function DailyCheck() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('question');
  const [isClean, setIsClean] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [note, setNote] = useState('');
  const [selectedForfeit, setSelectedForfeit] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [createPost, setCreatePost] = useState(true);
  const [respinsUsed, setRespinsUsed] = useState(0);
  const [isNoTradeDay, setIsNoTradeDay] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const forfeitFileInputRef = useRef<HTMLInputElement>(null);

  const user = storage.getCurrentUser();
  const isPremium = user?.isPremium || false;
  const isLongTermHold = user?.tradingStyle === 'Long Term Hold';

  const getCooldownRemaining = (): string | null => {
    if (!user) return null;
    const last = localStorage.getItem(`daily_check_last_${user.id}`);
    if (!last) return null;
    const elapsed = Date.now() - parseInt(last);
    if (elapsed >= COOLDOWN_MS) return null;
    const remaining = COOLDOWN_MS - elapsed;
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  useEffect(() => {
    const todayLog = storage.getTodayLog();

    if (todayLog) {
      // Always show summary if they've already completed today — restore all state from log
      setStep('summary');
      setPointsEarned(todayLog.pointsEarned ?? 0);
      setIsClean(todayLog.isClean ?? true);
      setNote(todayLog.note || '');
      setPhotoPreview(todayLog.photoUrl || '');
      setSelectedForfeit(todayLog.forfeitCompleted || '');
      // isNoTradeDay: true if clean day with no forfeit and note exists but no photo required
      setIsNoTradeDay(!!todayLog.isNoTradeDay);
    }

    setCooldownRemaining(storage.getDailyCheckCooldown());
    const interval = setInterval(() => {
      setCooldownRemaining(storage.getDailyCheckCooldown());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAnswer = (clean: boolean) => {
    // Hard backend block — check cooldown before allowing any submission path
    if (storage.isDailyCheckLocked()) {
      setCooldownRemaining(storage.getDailyCheckCooldown());
      return;
    }
    setIsClean(clean);
    if (clean) {
      setStep('clean-proof');
    } else {
      setStep('forfeit-wheel');
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const spinWheel = () => {
    setIsSpinning(true);
    setTimeout(() => {
      const randomForfeit = isLongTermHold
        ? INVESTOR_FORFEITS[Math.floor(Math.random() * INVESTOR_FORFEITS.length)]
        : DEFAULT_FORFEITS[Math.floor(Math.random() * DEFAULT_FORFEITS.length)];
      setSelectedForfeit(randomForfeit);
      setIsSpinning(false);
    }, 2000);
  };

  const handleRespin = () => {
    setRespinsUsed(respinsUsed + 1);
    setSelectedForfeit('');
  };

  const acceptForfeit = () => {
    setStep('forfeit-proof');
    setPhotoPreview('');
    setNote('');
  };

  const submitCleanDay = () => {
    if (storage.isDailyCheckLocked()) return;

    // Points 26-30
    let points = getRandomDailyPoints();

    // Apply double XP if active (Premium feature)
    if (storage.isDoubleXPActive()) {
      points = points * 2;
    }

    // FIX: +5 points for posting publicly
    if (createPost) points += 5;

    const user = storage.getCurrentUser();
    if (!user) return;

    const dayLog = storage.addDayLog({
      userId: user.id,
      date: new Date().toISOString().split('T')[0],
      isClean: true,
      photoUrl: photoPreview,
      note,
      pointsEarned: points,
      posted: createPost,
    });

    // FIX: Post appears in social feed when createPost is true
    if (createPost) {
      storage.addPost({
        userId: user.id,
        username: user.username,
        avatarUrl: user.profilePicture,
        league: `${user.totalPoints}`,
        isVerified: user.isVerified || false,
        type: 'clean',
        photoUrl: photoPreview,
        images: photoPreview ? [photoPreview] : [],
        caption: note,
      });
    }

    setPointsEarned(points);
    if (user) localStorage.setItem(`daily_check_last_${user.id}`, Date.now().toString());
    setStep('summary');
  };

  const submitForfeit = () => {
    if (storage.isDailyCheckLocked()) return;

    // Points 26-30
    let points = getRandomDailyPoints();

    // Apply double XP if active (Premium feature)
    if (storage.isDoubleXPActive()) {
      points = points * 2;
    }

    // FIX: +5 points for posting publicly
    if (createPost) points += 5;

    const user = storage.getCurrentUser();
    if (!user) return;

    // Check if streak will break and offer streak saver
    const wouldBreakStreak = user.currentStreak > 0;
    if (wouldBreakStreak && user.isPremium && (user.streakSavers || 0) > 0) {
      const useStreakSaver = confirm(
        `🛡️ STREAK SAVER AVAILABLE!\n\n` +
        `Your ${user.currentStreak}-day streak is about to break!\n\n` +
        `You have ${user.streakSavers} Streak Saver${(user.streakSavers || 0) > 1 ? 's' : ''} remaining.\n\n` +
        `Use one now to protect your streak?`
      );

      if (useStreakSaver) {
        if (storage.useStreakSaver()) {
          alert(`✅ Streak Saver used! Your ${user.currentStreak}-day streak is protected!`);
        }
      }
    }

    storage.addDayLog({
      userId: user.id,
      date: new Date().toISOString().split('T')[0],
      isClean: false,
      photoUrl: photoPreview,
      note,
      forfeitCompleted: selectedForfeit,
      pointsEarned: points,
      posted: createPost,
    });

    // FIX: Post appears in social feed when createPost is true
    if (createPost) {
      storage.addPost({
        userId: user.id,
        username: user.username,
        avatarUrl: user.profilePicture,
        league: `${user.totalPoints}`,
        isVerified: user.isVerified || false,
        type: 'forfeit',
        photoUrl: photoPreview,
        images: photoPreview ? [photoPreview] : [],
        caption: `${note}${note ? ' — ' : ''}Forfeit completed: ${selectedForfeit}`,
      });
    }

    setPointsEarned(points);
    if (user) localStorage.setItem(`daily_check_last_${user.id}`, Date.now().toString());
    setStep('summary');
  };

  // FIX: For No Trade Day — photo is optional (only note required)
  // For regular clean day — photo is required
  const canSubmitCleanDay = isNoTradeDay
    ? note.length >= 20
    : (!!photoPreview && note.length >= 20);

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Double XP Banner */}
      {storage.isDoubleXPActive() && (
        <Card className="mb-6 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-6 h-6" />
              <p className="font-bold text-lg">DOUBLE XP ACTIVE TODAY!</p>
              <Zap className="w-6 h-6" />
            </div>
            <p className="text-center text-sm text-white/90 mt-1">
              You'll earn 2x points on your Daily Check-In
            </p>
          </CardContent>
        </Card>
      )}

      {/* Cooldown Banner */}
      {cooldownRemaining && step === 'question' && (
        <Card className="mb-6 bg-muted border-muted-foreground/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">
                Daily check-in on cooldown — <span className="font-bold text-foreground">Next available in {cooldownRemaining}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'question' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Daily Check-In</CardTitle>
            <CardDescription>
              {isLongTermHold
                ? 'Did you follow your investing rules today?'
                : 'Did you follow all of your rules today?'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => handleAnswer(true)}
              className="w-full h-20 text-lg bg-green-600 hover:bg-green-700"
              disabled={!!cooldownRemaining}
            >
              <CheckCircle className="w-6 h-6 mr-2" />
              Yes, I followed my rules
            </Button>

            <Button
              onClick={() => handleAnswer(false)}
              variant="destructive"
              className="w-full h-20 text-lg"
              disabled={!!cooldownRemaining}
            >
              <XCircle className="w-6 h-6 mr-2" />
              No, I broke at least one rule
            </Button>

            {cooldownRemaining && (
              <p className="text-center text-sm text-muted-foreground pt-2">
                🔒 Locked — come back in <span className="font-bold text-foreground">{cooldownRemaining}</span>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'clean-proof' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {isLongTermHold ? 'Decision Evidence (Optional)' : 'Clean Day Proof'}
            </CardTitle>
            <CardDescription>
              {isLongTermHold
                ? 'Add anything related to your investing discipline today.'
                : 'Upload proof to earn your points'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* No Trade Day checkbox */}
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <Checkbox
                id="no-trades"
                checked={isNoTradeDay}
                onCheckedChange={(checked) => setIsNoTradeDay(checked as boolean)}
              />
              <div className="space-y-1">
                <label
                  htmlFor="no-trades"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {isLongTermHold ? 'No investing activity today' : 'No Trade Day'}
                </label>
                <p className="text-xs text-muted-foreground">
                  {isLongTermHold
                    ? 'Check this if you made no changes to your portfolio today'
                    : 'Check this if you did not execute any trades today — image upload becomes optional'
                  }
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                {/* FIX: Image is optional for No Trade Day and Long Term Hold */}
                {isNoTradeDay
                  ? 'Upload proof photo (Optional for No Trade Day)'
                  : isLongTermHold
                    ? 'Upload screenshot or add note (Optional)'
                    : 'Upload proof photo or screenshot of trade (Required)'
                }
              </Label>
              {/* Helper text showing what to upload */}
              <p className="text-xs text-muted-foreground">
                You can upload: • Trade proof &nbsp;• Discipline proof &nbsp;• Rule break / forfeit proof
              </p>
              {isLongTermHold && !isNoTradeDay && (
                <p className="text-xs text-muted-foreground mb-2">
                  Examples: Portfolio screenshot, research notes, position update, broker screenshot, or short discipline note.
                </p>
              )}
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="max-h-64 mx-auto rounded" />
                ) : (
                  <div className="space-y-2 pointer-events-none">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {isNoTradeDay ? 'Click to upload (optional)' : 'Click to upload'}
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">
                {isLongTermHold ? 'Discipline Note (Required, min 20 characters)' : 'Note (Required, min 20 characters)'}
              </Label>
              {isLongTermHold && (
                <p className="text-xs text-muted-foreground mb-2">
                  Example: "I wanted to sell during the drop but stayed patient."
                </p>
              )}
              <Textarea
                id="note"
                placeholder={isLongTermHold
                  ? 'Any thoughts about your investing discipline today...'
                  : 'Any notes about today...'
                }
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
              {note.length > 0 && note.length < 20 && (
                <p className="text-xs text-red-500">
                  {20 - note.length} more characters needed
                </p>
              )}
            </div>

            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="post"
                  checked={createPost}
                  onCheckedChange={(checked) => setCreatePost(checked as boolean)}
                />
                <label htmlFor="post" className="text-sm font-medium">
                  Post publicly (+5 points)
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('question')} className="flex-1">
                Back
              </Button>
              <div className="flex-1 flex flex-col gap-1">
                <Button
                  onClick={submitCleanDay}
                  disabled={!canSubmitCleanDay}
                  className="w-full h-12 text-base font-semibold"
                >
                  Complete Daily Check
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Earn {26}–{30 + (createPost ? 5 : 0)} points
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'forfeit-wheel' && (
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
          <CardHeader>
            <CardTitle className="text-2xl">Forfeit Wheel</CardTitle>
            <CardDescription>Spin to receive your forfeit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative">
              <div className={`aspect-square max-w-sm mx-auto rounded-full border-8 border-primary bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ${isSpinning ? 'animate-spin' : ''}`}>
                {selectedForfeit ? (
                  <div className="text-center p-8">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <p className="font-semibold text-lg">{selectedForfeit}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center p-8">
                    Click the button below to spin
                  </p>
                )}
              </div>
            </div>

            {!selectedForfeit ? (
              <Button
                onClick={spinWheel}
                disabled={isSpinning}
                className="w-full h-14 text-lg"
              >
                {isSpinning ? 'Spinning...' : 'Spin Wheel'}
              </Button>
            ) : (
              <div className="space-y-3">
                <Button onClick={acceptForfeit} className="w-full h-14 text-lg">
                  Accept Forfeit
                </Button>
                {(isPremium || respinsUsed === 0) && (
                  <Button
                    onClick={handleRespin}
                    variant="outline"
                    className="w-full"
                  >
                    {isPremium ? 'Re-spin (Unlimited ∞)' : 'Re-spin (1 allowed)'}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'forfeit-proof' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Forfeit Completion</CardTitle>
            <CardDescription>Upload proof that you completed: {selectedForfeit}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge className="text-sm">{selectedForfeit}</Badge>

            <div className="space-y-2">
              <Label>Upload proof photo or screenshot of trade (Required)</Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => forfeitFileInputRef.current?.click()}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="max-h-64 mx-auto rounded" />
                ) : (
                  <div className="space-y-2 pointer-events-none">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload</p>
                  </div>
                )}
                <input
                  ref={forfeitFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>What did you learn? (Required, min 20 characters)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Reflect on what you learned from this experience..."
                rows={4}
              />
            </div>

            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="post-forfeit"
                  checked={createPost}
                  onCheckedChange={(checked) => setCreatePost(checked as boolean)}
                />
                <label htmlFor="post-forfeit" className="text-sm font-medium">
                  Post publicly (+5 points)
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('forfeit-wheel')} className="flex-1">
                Back
              </Button>
              <div className="flex-1 flex flex-col gap-1">
                <Button
                  onClick={submitForfeit}
                  disabled={!photoPreview || note.length < 20}
                  className="w-full h-12 text-base font-semibold"
                >
                  Complete Daily Check
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Earn {26}–{30 + (createPost ? 5 : 0)} points
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'summary' && (
        <SummaryScreen
          isClean={isClean}
          pointsEarned={pointsEarned}
          photoPreview={photoPreview}
          note={note}
          isNoTradeDay={isNoTradeDay}
          selectedForfeit={selectedForfeit}
          onNavigate={() => navigate('/app')}
          userId={user?.id}
        />
      )}
    </div>
  );
}
