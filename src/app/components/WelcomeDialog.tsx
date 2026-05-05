import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { CheckCircle, Shield, Target, Trophy, Users, BookOpen, Brain, ArrowRight } from 'lucide-react';
import { storage } from '../utils/storage';
import { useNavigate } from 'react-router';

const STEPS = [
  {
    icon: '👋',
    title: "Welcome to STOIX",
    subtitle: "The Ultimate Traders Dashboard",
    description: "Everything you need to become a more disciplined, consistent, and profitable trader — all in one place.",
    color: '#C9A84C',
  },
  {
    icon: '✅',
    title: "Daily Check-In",
    subtitle: "Build the discipline habit",
    description: "Every day log whether you followed your trading rules. Earn points for clean days, complete forfeits when you don't. Your streak and league rank reflect your real discipline.",
    color: '#22c55e',
  },
  {
    icon: '📓',
    title: "Trading Journal",
    subtitle: "Track every trade",
    description: "Log your trades with custom fields, screenshots, and strategy tags. The AI analyses your patterns and shows you exactly what makes your best setups work.",
    color: '#3b82f6',
  },
  {
    icon: '🛡️',
    title: "RevengeX",
    subtitle: "Stop revenge trading",
    description: "When you're about to make an emotional trade, hit the RevengeX button. It analyses your journal history and shows you why you should stop.",
    color: '#ef4444',
  },
  {
    icon: '🤖',
    title: "AI Analytics",
    subtitle: "Find your edge",
    description: "After logging a few trades, the AI builds your personal strategy — your highest-probability setups, best sessions, and what to avoid.",
    color: '#8b5cf6',
  },
  {
    icon: '🏆',
    title: "You're Ready!",
    subtitle: "Let's start your journey",
    description: "Start with your first Daily Check-In to earn points and begin building your streak. Your first step to trading discipline starts now.",
    color: '#C9A84C',
    isFinal: true,
  },
];

export function WelcomeDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const user = storage.getCurrentUser();

  useEffect(() => {
    const key = user ? `hasSeenWelcome_${user.id}` : 'hasSeenWelcome';
    if (!localStorage.getItem(key)) setOpen(true);
  }, []);

  const handleClose = (goToCheck = false) => {
    const key = user ? `hasSeenWelcome_${user.id}` : 'hasSeenWelcome';
    localStorage.setItem(key, 'true');
    setOpen(false);
    if (goToCheck) navigate('/app/daily-check');
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm p-0 overflow-hidden gap-0" style={{ borderRadius: 16 }}>
        {/* Progress bar */}
        <div className="flex gap-1 p-4 pb-0">
          {STEPS.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
              style={{ background: i <= step ? '#C9A84C' : '#1f1f1f' }} />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          <div className="text-6xl mb-2">{current.icon}</div>
          <div>
            <h2 className="text-xl font-bold mb-1">{current.title}</h2>
            <p className="text-sm font-medium" style={{ color: current.color }}>{current.subtitle}</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
        </div>

        {/* Actions */}
        <div className="p-4 pt-0 space-y-2">
          {isLast ? (
            <>
              <Button className="w-full" size="lg" onClick={() => handleClose(true)}
                style={{ background: '#C9A84C', color: '#000', fontWeight: 700 }}>
                Do My First Check-In →
              </Button>
              <Button variant="ghost" className="w-full text-sm text-muted-foreground" onClick={() => handleClose(false)}>
                Explore on my own
              </Button>
            </>
          ) : (
            <>
              <Button className="w-full" size="lg" onClick={() => setStep(s => s + 1)}
                style={{ background: '#C9A84C', color: '#000', fontWeight: 700 }}>
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="ghost" className="w-full text-sm text-muted-foreground" onClick={() => setStep(STEPS.length - 1)}>
                Skip intro
              </Button>
            </>
          )}
        </div>

        {/* Step counter */}
        <p className="text-center text-xs text-muted-foreground pb-4">{step + 1} of {STEPS.length}</p>
      </DialogContent>
    </Dialog>
  );
}
