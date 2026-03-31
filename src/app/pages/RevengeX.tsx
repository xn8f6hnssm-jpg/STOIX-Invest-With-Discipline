import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { ShieldAlert, Clock, RefreshCw, BookOpen, TrendingDown, Star } from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { storage } from '../utils/storage';
import type { Rule } from '../utils/storage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { useNavigate } from 'react-router';

const QUOTES = {
  emotional: [
    "One revenge trade can erase 30 disciplined days.",
    "You are not trading the market right now. You are trading your emotions.",
    "The market punishes emotional urgency.",
    "Your edge disappears the moment you need the trade.",
    "If you feel urgency, you already lost control.",
    "This trade is about your ego, not your system.",
    "Blown accounts start with one emotional decision.",
    "Even if this trade wins, you just trained yourself to lose.",
    "You don't need this trade. Your ego does.",
    "You are one click away from regret.",
    "You are reacting, not thinking.",
    "No good trade starts with anger.",
    "You are trying to fix a feeling, not find a setup.",
    "Revenge trading is emotional gambling disguised as strategy.",
    "You are trying to fight the market. That never ends well.",
    "You're not trading price. You're trading frustration.",
  ],
  professional: [
    "Discipline pays you forever. Impulse pays you once.",
    "Professional traders skip trades every day.",
    "No setup = no trade. No exceptions.",
    "The fastest way to lose is trying to win it back.",
    "The market will always be here tomorrow. Your capital might not.",
    "Amateurs chase losses. Professionals protect capital.",
    "Your job is risk management, not money making.",
    "Real traders protect their downside first.",
    "Discipline is what separates funded traders from gamblers.",
    "Trade like a business owner, not a gambler.",
    "A professional trader can walk away.",
    "Patience is a trading skill.",
    "You don't get paid for activity. You get paid for execution.",
    "Flat is a position.",
    "Doing nothing is sometimes the best trade.",
    "Your edge is patience.",
    "Consistency beats intensity.",
    "You are building a career, not chasing a win.",
  ],
  reset: [
    "Wait 10 minutes. If it's still a good trade, it will still be there.",
    "Breathe. This feeling will pass.",
    "Step away. Come back logical.",
    "This urge is temporary. Losses from it are permanent.",
    "Walk away for 5 minutes.",
    "You don't need closure from the market.",
    "The market owes you nothing.",
    "You cannot force a win.",
    "Reset your mind before you reset your account.",
    "Take a breath. The market will still be there tomorrow.",
    "A paused mind makes better decisions.",
    "You don't need to win it back today.",
    "Losses are tuition, not emergencies.",
    "Step away. Clarity returns with space.",
    "One trade does not define you.",
    "Protect your peace before your profits.",
    "Reset your breath, then reassess.",
    "Patience pays more than panic.",
    "Calm traders survive long enough to win.",
  ],
  discipline: [
    "You don't blow accounts from bad strategy. You blow them from broken discipline.",
    "Every revenge trader thinks they will be the exception.",
    "Right now you are deciding what kind of trader you are.",
    "The market is a patience transfer machine.",
    "You either control yourself or the market controls your money.",
    "One bad decision can restart your entire journey.",
    "If you cannot control yourself, you cannot scale.",
    "The market tests emotional control more than intelligence.",
    "Your rules exist for this exact moment.",
    "This is the moment that builds traders or breaks them.",
    "Your future self is watching this decision.",
    "You control your actions, not the market.",
    "Discipline is strength in silence.",
    "Master yourself before you master markets.",
    "Emotion is weakness disguised as urgency.",
    "The wise trader accepts losses without drama.",
    "Endure the loss; avoid the chaos.",
    "Control the controllable.",
    "Impulse is temporary. Consequences are not.",
    "A disciplined trader is undefeated by emotion.",
  ],
  revenge: [
    "You cannot win a fight against liquidity.",
    "The market doesn't know you lost.",
    "The market doesn't care you want it back.",
    "You don't recover losses by abandoning discipline.",
    "Revenge trading is how small losses become big ones.",
    "The best revenge is following your rules tomorrow.",
    "A revenge trade is just a delayed bigger loss.",
    "Revenge trading is self-sabotage in real time.",
    "You're not fighting the market — you're fighting yourself.",
    "One angry click can end your account.",
    "The market feeds on emotional traders.",
    "Rage trades don't recover losses — they multiply them.",
    "Blowups begin with 'I'll show it.'",
    "Every revenge trade writes your liquidation story.",
    "Emotion is the fastest way to zero.",
    "The market punishes pride.",
    "Your worst enemy has your fingerprint.",
  ],
};

// Investor-specific quotes for Long Term Hold users
const INVESTOR_QUOTES = {
  patience: [
    "The stock market transfers money from the impatient to the patient.",
    "Volatility is the price of admission for long term returns.",
    "If nothing has changed in the business, why sell?",
    "Time in the market beats timing the market.",
    "Panic selling usually creates regret.",
    "The hardest investing skill is patience.",
    "Your winners need time.",
    "Discipline beats emotion in investing.",
    "The best investors do nothing most of the time.",
    "Great investors hold through the noise.",
  ],
  emotional: [
    "You are not reacting to data. You are reacting to price.",
    "Every panic sell is a lesson in emotion cost.",
    "The market tests patience, not intelligence.",
    "Your thesis didn't change. Only the price did.",
    "Emotional decisions create permanent regret.",
    "You cannot build wealth by reacting to fear.",
    "Short term pain often protects long term gains.",
    "You're about to sell low.",
    "Panic is expensive.",
    "Red days test your conviction, not your thesis.",
  ],
  discipline: [
    "Strong investors follow plans, not emotions.",
    "Your investment thesis is your anchor.",
    "Stay calm. Portfolios reward patience.",
    "This too shall pass. Stay disciplined.",
    "Price volatility is noise. Business performance matters.",
    "You invested for a reason. Remember it.",
    "Long term thinking wins. Every time.",
    "Ignore the noise. Focus on fundamentals.",
    "The best investment decisions are boring.",
    "Stick to your plan. Markets reward it.",
  ],
  warning: [
    "Breaking your thesis breaks your returns.",
    "One emotional sell can cost years of gains.",
    "Markets punish panic sellers.",
    "You bought for years. Don't sell for days.",
    "This decision will define your portfolio.",
    "Pause before you erase your gains.",
    "Are you selling your thesis or your fear?",
    "Every emotional exit has regret attached.",
    "Stop. Breathe. Review your thesis.",
    "Your future self is watching.",
  ],
};

type Phase = 'warning' | 'breathing' | 'reflection' | 'complete';

export function RevengeX() {
  const [phase, setPhase] = useState<Phase>('warning');
  const [breathingProgress, setBreathingProgress] = useState(0);
  const [currentQuote, setCurrentQuote] = useState('');
  const [reflection, setReflection] = useState('');
  const [showRulesDialog, setShowRulesDialog] = useState(false);
  const [showWorstDayDialog, setShowWorstDayDialog] = useState(false);
  const [userRules, setUserRules] = useState<Rule[]>([]);
  const [showAllRules, setShowAllRules] = useState(false);
  const [worstDay, setWorstDay] = useState<any>(null);

  const navigate = useNavigate();
  const currentUser = storage.getCurrentUser();
  const isLongTermHold = currentUser?.tradingStyle === 'Long Term Hold';

  // Get appropriate quote pool based on trading style
  const getAllQuotes = () => {
    if (isLongTermHold) {
      return [...INVESTOR_QUOTES.patience, ...INVESTOR_QUOTES.emotional, ...INVESTOR_QUOTES.discipline, ...INVESTOR_QUOTES.warning];
    }
    return [...QUOTES.emotional, ...QUOTES.professional, ...QUOTES.reset, ...QUOTES.discipline, ...QUOTES.revenge];
  };

  useEffect(() => {
    // Set random quote on mount
    const allQuotes = getAllQuotes();
    setCurrentQuote(allQuotes[Math.floor(Math.random() * allQuotes.length)]);

    // Find worst day from journal
    const entries = storage.getJournalEntries();
    const currentUserId = currentUser?.id;
    const userEntries = entries.filter(e => e.userId === currentUserId);
    
    if (userEntries.length === 0) return;
    
    // Group entries by date to find worst day (not just worst trade)
    const entriesByDate: Record<string, any[]> = {};
    userEntries.forEach(entry => {
      if (!entriesByDate[entry.date]) {
        entriesByDate[entry.date] = [];
      }
      entriesByDate[entry.date].push(entry);
    });
    
    // Calculate total P&L per day and find worst day
    let worstDayDate = '';
    let worstDayLoss = 0;
    let worstDayLossCount = 0;
    
    Object.entries(entriesByDate).forEach(([date, dayEntries]) => {
      let dayPnL = 0;
      let hasAnyPnL = false;
      
      dayEntries.forEach(entry => {
        // Use the new pnl field if available
        if (entry.pnl !== undefined) {
          dayPnL += entry.pnl;
          hasAnyPnL = true;
        } else if (entry.customFields?.pnl) {
          dayPnL += parseFloat(entry.customFields.pnl) || 0;
          hasAnyPnL = true;
        } else if (entry.customFields?.['P&L']) {
          dayPnL += parseFloat(entry.customFields['P&L']) || 0;
          hasAnyPnL = true;
        }
      });
      
      // If we have P&L data, use it. Otherwise, count losses
      const lossCount = dayEntries.filter(e => e.result === 'loss').length;
      
      if (hasAnyPnL && dayPnL < worstDayLoss) {
        worstDayLoss = dayPnL;
        worstDayDate = date;
        worstDayLossCount = lossCount;
      } else if (!hasAnyPnL && lossCount > worstDayLossCount) {
        // Fallback: if no P&L data, find day with most losses
        worstDayLossCount = lossCount;
        worstDayDate = date;
      }
    });
    
    // If we found a worst day, set it
    if (worstDayDate && Object.keys(entriesByDate).length > 0) {
      const worstDayEntries = entriesByDate[worstDayDate];
      const lossCount = worstDayEntries.filter(e => e.result === 'loss').length;
      
      // Find a representative entry (prefer one with description or biggest loss)
      const representativeEntry = worstDayEntries.find(e => e.description) || worstDayEntries[0];
      
      setWorstDay({
        ...representativeEntry,
        customFields: {
          ...representativeEntry.customFields,
          totalDayLoss: worstDayLoss !== 0 ? Math.abs(worstDayLoss).toFixed(2) : undefined,
          lossCount: lossCount
        }
      });
    }
  }, [currentUser?.id]);

  // Reload rules every time the rules dialog opens
  useEffect(() => {
    if (showRulesDialog) {
      const currentUser = storage.getCurrentUser();
      console.log('🔍 RevengeX - Dialog opened');
      console.log('🔍 RevengeX - Current user:', currentUser);
      console.log('🔍 RevengeX - Current user ID:', currentUser?.id);
      
      // storage.getRules() already filters by current user
      const userRules = storage.getRules();
      console.log('🔍 RevengeX - Rules for current user:', userRules);
      console.log('🔍 RevengeX - Number of user rules:', userRules.length);
      
      setUserRules(userRules);
      
      if (userRules.length === 0) {
        console.log('ℹ️ RevengeX - No rules found yet for user:', currentUser?.id, '(this is normal for new users)');
      }
    }
  }, [showRulesDialog]);

  const startBreathing = () => {
    setPhase('breathing');
    setBreathingProgress(0);
    
    // 60 second timer
    const interval = setInterval(() => {
      setBreathingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + (100 / 60); // Increment for 60 seconds
      });
    }, 1000);

    // Change quote every 10 seconds during breathing
    const quoteInterval = setInterval(() => {
      const allQuotes = getAllQuotes();
      setCurrentQuote(allQuotes[Math.floor(Math.random() * allQuotes.length)]);
    }, 10000);

    setTimeout(() => {
      clearInterval(quoteInterval);
      setPhase('reflection');
    }, 60000);
  };

  const completeReflection = () => {
    if (reflection.trim().length > 0) {
      setPhase('complete');
    }
  };

  const generateNewQuote = () => {
    const allQuotes = getAllQuotes();
    const filteredQuotes = allQuotes.filter(q => q !== currentQuote);
    setCurrentQuote(filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)]);
  };
  
  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-red-950/20 via-background to-orange-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {phase === 'warning' && (
          <Card className="border-red-500/50 shadow-xl">
            <CardContent className="pt-12 pb-12 text-center space-y-8">
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                  <ShieldAlert className="w-12 h-12 text-red-500" />
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-red-500">STOP</h1>
                <p className="text-xl md:text-2xl font-semibold">
                  {isLongTermHold 
                    ? "Pause before making an emotional investing decision"
                    : "You're about to revenge trade"
                  }
                </p>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {isLongTermHold 
                    ? "Strong investors follow plans, not emotions."
                    : "Take a moment. Breathe. Your account depends on this pause."
                  }
                </p>
              </div>

              {/* Quote Section */}
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-6 max-w-lg mx-auto">
                  <p className="text-lg font-medium leading-relaxed">
                    {currentQuote}
                  </p>
                </div>

                <Button
                  onClick={generateNewQuote}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  New Quote
                </Button>
              </div>

              {/* Two Buttons Side by Side */}
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <Button
                  onClick={() => setShowRulesDialog(true)}
                  variant="outline"
                  size="lg"
                  className="h-auto py-4"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Read My Rules
                </Button>
                <Button
                  onClick={() => {
                    if (worstDay) {
                      // Store the worst day date in localStorage so Journal can filter to it
                      localStorage.setItem('revengex_worst_day', worstDay.date);
                      navigate('/app/journal');
                    }
                  }}
                  variant="outline"
                  size="lg"
                  className="h-auto py-4"
                  disabled={!worstDay}
                >
                  <TrendingDown className="w-5 h-5 mr-2" />
                  {isLongTermHold ? 'Review Worst Decision' : 'Review Worst Day'}
                </Button>
              </div>

              {/* Breathing Button */}
              <div className="space-y-3">
                <Button
                  onClick={startBreathing}
                  size="lg"
                  className="text-lg px-8 py-6 h-auto"
                >
                  I'm Ready to Breathe
                </Button>

                <p className="text-sm text-muted-foreground">
                  Take 60 seconds. Your future self will thank you.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {phase === 'breathing' && (
          <Card className="border-blue-500/50 shadow-xl">
            <CardContent className="pt-12 pb-12 text-center space-y-8">
              <div className="flex justify-center">
                <div className="w-32 h-32 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Clock className="w-16 h-16 text-blue-500" />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-bold">Breathe</h2>
                <p className="text-xl text-muted-foreground">
                  {Math.ceil(60 - (breathingProgress * 60 / 100))} seconds remaining
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <Progress value={breathingProgress} className="h-3" />
                
                <div className="bg-muted/50 rounded-lg p-6">
                  <p className="text-lg font-medium leading-relaxed">
                    {currentQuote}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-muted-foreground">
                <p className="text-lg">Inhale for 4 seconds</p>
                <p className="text-lg">Hold for 4 seconds</p>
                <p className="text-lg">Exhale for 4 seconds</p>
              </div>
            </CardContent>
          </Card>
        )}

        {phase === 'reflection' && (
          <Card className="shadow-xl">
            <CardContent className="pt-8 pb-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">How are you feeling now?</h2>
                <p className="text-muted-foreground">
                  Write one sentence about why you felt the urge to revenge trade.
                </p>
              </div>

              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="I felt the urge because..."
                rows={4}
                className="text-lg"
              />

              <div className="bg-muted/50 rounded-lg p-6">
                <p className="text-center font-medium leading-relaxed">
                  {currentQuote}
                </p>
              </div>

              <Button
                onClick={completeReflection}
                disabled={reflection.trim().length === 0}
                className="w-full"
                size="lg"
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {phase === 'complete' && (
          <Card className="border-green-500/50 shadow-xl">
            <CardContent className="pt-12 pb-12 text-center space-y-8">
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center">
                  <ShieldAlert className="w-12 h-12 text-green-500" />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-green-500">Well Done</h2>
                <p className="text-xl">You chose discipline over impulse.</p>
                <p className="text-muted-foreground max-w-md mx-auto">
                  This pause may have saved your account. Remember this moment next time.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-6 max-w-lg mx-auto">
                <p className="font-medium mb-2">Your reflection:</p>
                <p className="text-muted-foreground italic">"{reflection}"</p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setPhase('warning');
                    setReflection('');
                    setBreathingProgress(0);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Reset RevengeX
                </Button>
                
                <p className="text-sm text-muted-foreground">
                  Consider taking a 10-minute break before trading again.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Trading Rules Dialog */}
      <Dialog open={showRulesDialog} onOpenChange={(open) => {
        setShowRulesDialog(open);
        if (!open) setShowAllRules(false); // Reset when closing
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Your Trading Rules</DialogTitle>
            <DialogDescription>
              These are the rules you committed to. Do NOT break them.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {(() => {
              const allRules = userRules;
              
              if (allRules.length === 0) {
                return (
                  <div className="text-center py-8 space-y-4">
                    <p className="text-muted-foreground">
                      You haven't set up trading rules yet.
                    </p>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-sm">
                      <p className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">
                        🔍 Troubleshooting
                      </p>
                      <p className="text-muted-foreground mb-3">
                        If you created rules during onboarding but they're not showing up, click below to check storage:
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const allStorageRules = storage.getRules();
                          const currentUser = storage.getCurrentUser();
                          console.log('=== RULES DIAGNOSTIC ===');
                          console.log('Current User ID:', currentUser?.id);
                          console.log('Total rules in storage:', allStorageRules.length);
                          console.log('All rules:', allStorageRules);
                          console.log('User IDs in rules:', [...new Set(allStorageRules.map(r => r.userId))]);
                          
                          // Attempt recovery
                          if (allStorageRules.length > 0 && currentUser) {
                            const allUsers = storage.getAllUsers();
                            const validUserIds = allUsers.map(u => u.id);
                            const orphanedRules = allStorageRules.filter(r => !validUserIds.includes(r.userId));
                            
                            if (orphanedRules.length > 0) {
                              const updatedRules = allStorageRules.map(rule => {
                                if (!validUserIds.includes(rule.userId)) {
                                  return { ...rule, userId: currentUser.id };
                                }
                                return rule;
                              });
                              
                              localStorage.setItem('tradeforge_rules', JSON.stringify(updatedRules));
                              const recovered = updatedRules.filter(r => r.userId === currentUser.id);
                              setUserRules(recovered);
                              console.log(`✅ Recovered ${orphanedRules.length} orphaned rules!`);
                              alert(`✅ Recovered ${orphanedRules.length} rules! Close and reopen this dialog.`);
                            } else {
                              alert('No orphaned rules found. Check console for details.');
                            }
                          } else {
                            alert(`Found ${allStorageRules.length} rules in storage. Check console for details.`);
                          }
                        }}
                      >
                        🔧 Diagnose & Fix Rules
                      </Button>
                    </div>
                  </div>
                );
              }

              // If showing all rules
              if (showAllRules) {
                // Group rules by category in the specified order
                const categoryOrder = ['psychology', 'risk', 'entry', 'exit', 'discipline', 'general'];
                const groupedRules = allRules.reduce((acc, rule) => {
                  const category = rule.tag || 'general';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(rule);
                  return acc;
                }, {} as Record<string, typeof allRules>);

                const categoryLabels: Record<string, string> = {
                  psychology: 'PSYCHOLOGY',
                  entry: 'ENTRY',
                  exit: 'EXIT',
                  risk: 'RISK',
                  discipline: 'DISCIPLINE',
                  general: 'DISCIPLINE'
                };

                const categoryColors: Record<string, string> = {
                  psychology: 'text-purple-500 border-purple-500/30 bg-purple-500/10',
                  entry: 'text-green-500 border-green-500/30 bg-green-500/10',
                  exit: 'text-red-500 border-red-500/30 bg-red-500/10',
                  risk: 'text-amber-500 border-amber-500/30 bg-amber-500/10',
                  discipline: 'text-slate-500 border-slate-500/30 bg-slate-500/10',
                  general: 'text-slate-500 border-slate-500/30 bg-slate-500/10'
                };

                return (
                  <>
                    {categoryOrder.map(category => {
                      const rules = groupedRules[category];
                      if (!rules || rules.length === 0) return null;
                      
                      return (
                        <div key={category}>
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border mb-3 ${categoryColors[category] || categoryColors.general}`}>
                            <h3 className="font-bold text-xs tracking-wide">
                              {categoryLabels[category] || category.toUpperCase()}
                            </h3>
                          </div>
                          <div className="space-y-2 mb-6">
                            {rules.map((rule) => (
                              <div key={rule.id} className="bg-muted/50 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                  {rule.isCritical && (
                                    <Star className="w-4 h-4 fill-amber-500 text-amber-500 mt-0.5 flex-shrink-0" />
                                  )}
                                  {!rule.isCritical && (
                                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                  )}
                                  <div className="flex-1">
                                    <p className="font-medium text-sm leading-relaxed">{rule.title}</p>
                                    {rule.description && (
                                      <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowAllRules(false)}
                    >
                      Show Less
                    </Button>
                  </>
                );
              }

              // Show 3 random rules (prioritize Psychology and Risk)
              const psychologyRules = allRules.filter(r => r.tag === 'psychology');
              const riskRules = allRules.filter(r => r.tag === 'risk');
              const otherRules = allRules.filter(r => r.tag !== 'psychology' && r.tag !== 'risk');              
              const priorityRules = [...psychologyRules, ...riskRules];
              const randomPriorityRules = priorityRules.sort(() => Math.random() - 0.5).slice(0, Math.min(2, priorityRules.length));
              const remainingSlots = 3 - randomPriorityRules.length;
              const randomOtherRules = otherRules.sort(() => Math.random() - 0.5).slice(0, remainingSlots);
              
              const selectedRules = [...randomPriorityRules, ...randomOtherRules].slice(0, 3);

              return (
                <>
                  <div className="space-y-4">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <h3 className="font-bold text-lg mb-3 text-center">Rules To Remember Right Now</h3>
                      <div className="space-y-2">
                        {selectedRules.map((rule) => (
                          <div key={rule.id} className="flex items-start gap-3 bg-background rounded-lg p-3">
                            {rule.isCritical ? (
                              <Star className="w-5 h-5 fill-amber-500 text-amber-500 flex-shrink-0 mt-0.5" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                            )}
                            <p className="font-medium text-sm leading-relaxed">{rule.title}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowAllRules(true)}
                    >
                      View All Rules
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Worst Day Dialog */}
      <Dialog open={showWorstDayDialog} onOpenChange={setShowWorstDayDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-red-500">
              {isLongTermHold ? 'Your Worst Decision' : 'Your Worst Loss Day'}
            </DialogTitle>
            <DialogDescription>
              {isLongTermHold 
                ? 'Remember what emotional decisions cost you. Stay disciplined.'
                : 'Remember this pain. Don\'t create another one.'
              }
            </DialogDescription>
          </DialogHeader>
          {worstDay ? (
            <div className="space-y-4 mt-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="text-center">
                  {worstDay.customFields?.totalDayLoss && parseFloat(worstDay.customFields.totalDayLoss) > 0 ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-1">Total Day Loss</p>
                      <p className="text-3xl font-bold text-red-500">
                        ${worstDay.customFields.totalDayLoss}
                      </p>
                      
                      {worstDay.customFields?.lossCount && (
                        <p className="text-sm text-red-400 mt-2 font-semibold">
                          {worstDay.customFields.lossCount} {worstDay.customFields.lossCount === 1 ? 'losing trade' : 'losing trades'} that day
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-1">Worst Loss Day</p>
                      <p className="text-2xl font-bold text-red-500">
                        {worstDay.customFields?.lossCount || 1} {(worstDay.customFields?.lossCount || 1) === 1 ? 'losing trade' : 'losing trades'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Add P&L amounts in your journal entries to see dollar losses
                      </p>
                    </>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(worstDay.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>

              {/* Rhetorical Question */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <p className="text-center font-medium text-amber-700 dark:text-amber-300 italic">
                  How'd you feel that day?
                </p>
              </div>

              {worstDay.description && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">What Happened:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {worstDay.description}
                  </p>
                </div>
              )}

              {worstDay.screenshots && worstDay.screenshots.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Trade Screenshot:</p>
                  <div className="grid gap-2">
                    {worstDay.screenshots.map((screenshot: string, index: number) => (
                      <img
                        key={index}
                        src={screenshot}
                        alt="Trade screenshot"
                        className="w-full rounded-lg border border-border"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                <p className="text-sm font-medium text-center">
                  Don't repeat this mistake. Walk away now.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">
                No worst day recorded yet.
              </p>
              <p className="text-sm text-muted-foreground/70">
                Keep trading with discipline and you won't need this reminder.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}