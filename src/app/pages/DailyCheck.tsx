import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle, XCircle, Upload, Sparkles, Zap, Clock } from 'lucide-react';
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

type Step = 'question' | 'clean-proof' | 'forfeit-wheel' | 'forfeit-proof' | 'summary';

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
    // Backend check: if cooldown active, force to locked state regardless of UI
    const isLocked = storage.isDailyCheckLocked();
    const todayLog = storage.getTodayLog();

    if (isLocked || todayLog) {
      // Always show summary/locked if submitted within 5h
      if (todayLog) {
        setStep('summary');
        setPointsEarned(todayLog.pointsEarned);
        setIsClean(todayLog.isClean);
      } else {
        // Locked but no log yet (edge case) — show cooldown on question step
        setStep('question');
      }
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
    if (storage.isDailyCheckLocked()) return; // Backend enforcement
    let points = 25; // Clean day base points
    
    // Apply double XP if active (Premium feature)
    if (storage.isDoubleXPActive()) {
      points = points * 2;
    }
    
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

    if (createPost) {
      storage.addPost({
        userId: user.id,
        username: user.username,
        league: `${user.totalPoints}`,
        isVerified: user.isVerified,
        type: 'clean',
        photoUrl: photoPreview,
        caption: note,
      });
    }

    setPointsEarned(points);
    if (user) localStorage.setItem(`daily_check_last_${user.id}`, Date.now().toString());
    setStep('summary');
  };

  const submitForfeit = () => {
    if (storage.isDailyCheckLocked()) return; // Backend enforcement
    let points = 10; // Forfeit base points
    
    // Apply double XP if active (Premium feature)
    if (storage.isDoubleXPActive()) {
      points = points * 2;
    }
    
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
          // Don't break the streak - keep it intact
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

    if (createPost) {
      storage.addPost({
        userId: user.id,
        username: user.username,
        league: `${user.totalPoints}`,
        isVerified: user.isVerified,
        type: 'forfeit',
        photoUrl: photoPreview,
        caption: `${note} (Forfeit: ${selectedForfeit})`,
      });
    }

    setPointsEarned(points);
    if (user) localStorage.setItem(`daily_check_last_${user.id}`, Date.now().toString());
    setStep('summary');
  };

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
                Daily check-in on cooldown — come back in <span className="font-bold text-foreground">{cooldownRemaining}</span>
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
                  {isLongTermHold ? 'No investing activity today' : 'No trades today'}
                </label>
                <p className="text-xs text-muted-foreground">
                  {isLongTermHold 
                    ? 'Check this if you made no changes to your portfolio today'
                    : 'Check this if you did not execute any trades today'
                  }
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                {isLongTermHold 
                  ? 'Upload screenshot or add note (Optional)'
                  : 'Upload proof photo or screenshot of trade (Required)'
                }
              </Label>
              {isLongTermHold && (
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
                    <p className="text-sm text-muted-foreground">Click to upload</p>
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
              <Button
                onClick={submitCleanDay}
                disabled={!photoPreview || note.length < 20}
                className="flex-1"
              >
                Confirm Clean Day (+{25 + (createPost ? 5 : 0)} points)
              </Button>
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
              <Button
                onClick={submitForfeit}
                disabled={!photoPreview || note.length < 20}
                className="flex-1"
              >
                Complete Forfeit (+{10 + (createPost ? 5 : 0)} points)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'summary' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Daily Check Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="py-8">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                {isClean ? (
                  <CheckCircle className="w-12 h-12 text-green-500" />
                ) : (
                  <XCircle className="w-12 h-12 text-orange-500" />
                )}
              </div>
              
              <h3 className="text-3xl font-bold mb-2">+{pointsEarned} Points</h3>
              <p className="text-muted-foreground">
                {isClean ? 'Clean day logged successfully!' : 'Forfeit completed successfully!'}
              </p>
            </div>

            <Button onClick={() => navigate('/app')} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}