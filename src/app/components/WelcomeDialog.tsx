import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { ArrowRight, Crown } from 'lucide-react';
import { storage } from '../utils/storage';
import { useNavigate } from 'react-router';

const STEPS = [
  {
    icon: '👋',
    tab: null,
    title: 'Welcome to STOIX',
    subtitle: 'The Ultimate Traders Dashboard',
    description: 'Everything you need to become a more disciplined, consistent, and profitable trader — all in one place. Let us show you around.',
    color: '#C9A84C',
    premium: null,
  },
  {
    icon: '✅',
    tab: 'Dashboard',
    title: 'Your Dashboard',
    subtitle: 'Track your progress at a glance',
    description: 'Your home base. See your discipline rate, league rank, streak, trading stats, and recent activity all in one place. The more you log, the more accurate your stats become.',
    color: '#22c55e',
    premium: null,
  },
  {
    icon: '📅',
    tab: 'Daily Check',
    title: 'Daily Check-In',
    subtitle: 'Build discipline one day at a time',
    description: 'Every day, log whether you followed your trading rules. Clean day = +25 points. Forfeit day = you set the consequences. Your discipline % and league rank are built entirely from this habit.',
    color: '#3b82f6',
    premium: null,
  },
  {
    icon: '🛡️',
    tab: 'RevengeX',
    title: 'RevengeX',
    subtitle: 'Stop revenge trading before it starts',
    description: 'Feeling emotional after a loss? Hit RevengeX before entering another trade. It analyses your journal history and shows you exactly why you should stop — using your own data against you.',
    color: '#ef4444',
    premium: null,
  },
  {
    icon: '📓',
    tab: 'Journal',
    title: 'Trading Journal',
    subtitle: 'Log every trade. Find your edge.',
    description: 'Log every trade with entry, exit, P&L, screenshots, and custom fields. The more detail you add, the better the AI can find your patterns.',
    color: '#8b5cf6',
    premium: {
      title: 'Unlock with Premium',
      points: [
        'Unlimited custom fields per trade',
        'AI Strategy Builder finds your highest-probability setups',
        'Backtesting journal to test strategies on past data',
        'A+ Trade tracking — log only your best setups',
      ],
    },
  },
  {
    icon: '🤖',
    tab: 'AI Analytics',
    title: 'AI Analytics',
    subtitle: 'Premium — Your personal trading coach',
    description: 'After logging trades, the AI builds your personal strategy — best sessions, best pairs, what to avoid, and your A+ setups. It turns your journal into an actual edge.',
    color: '#f59e0b',
    premium: {
      title: 'Premium Feature',
      points: [
        'Live Trading analysis with win/loss patterns',
        'Backtesting — test your strategy on historical trades',
        'A+ Trade identification — find your highest R:R setups',
        'Detailed session analysis (best time of day to trade)',
      ],
    },
  },
  {
    icon: '🧠',
    tab: 'Mental Prep',
    title: 'Mental Preparation',
    subtitle: 'Get in the right mindset before the market opens',
    description: 'A customisable pre-session routine to prepare your mind before trading. Go through your affirmations, rules review, and mental checklist. Edit your routine anytime through Settings.',
    color: '#06b6d4',
    premium: null,
  },
  {
    icon: '📋',
    tab: 'Rules',
    title: 'Your Trading Rules',
    subtitle: 'Set your rules. Trade by them.',
    description: 'Define your max daily loss, max drawdown, max contracts, and consistency rules. These are the rules you check against every day. Add or change them anytime from the Edit Rules page.',
    color: '#C9A84C',
    premium: {
      title: 'Premium unlocks more',
      points: [
        'Account Protection Mode — auto-blocks trading when rules are breached',
        'Pre-Trade Checklist — verify rules before every trade',
        'Prop firm rule templates (FTMO, MyFundedFX, etc.)',
      ],
    },
  },
  {
    icon: '🏆',
    tab: null,
    title: "You're Ready!",
    subtitle: "Let's build your edge",
    description: 'Start with your first Daily Check-In to earn points and begin your streak. The more consistent you are, the higher you climb — from Bronze all the way to Platinum.',
    color: '#C9A84C',
    isFinal: true,
    premium: null,
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
        <div className="p-6 space-y-3">
          {/* Tab label */}
          {current.tab && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: `${current.color}20`, color: current.color }}>
              {current.tab}
            </div>
          )}
          <div className="text-4xl">{current.icon}</div>
          <div>
            <h2 className="text-xl font-bold mb-0.5">{current.title}</h2>
            <p className="text-sm font-medium" style={{ color: current.color }}>{current.subtitle}</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>

          {/* Premium upsell */}
          {current.premium && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-500" />
                <p className="text-xs font-bold text-amber-500">{current.premium.title}</p>
              </div>
              <ul className="space-y-1">
                {current.premium.points.map((p, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span style={{ color: '#C9A84C' }} className="mt-0.5 flex-shrink-0">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-2">
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

        <p className="text-center text-xs text-muted-foreground pb-4">{step + 1} of {STEPS.length}</p>
      </DialogContent>
    </Dialog>
  );
}
