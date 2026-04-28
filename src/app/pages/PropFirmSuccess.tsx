import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Trophy, Target, Lock, ChevronRight, AlertCircle, Shield, AlertTriangle,
  CheckCircle, Calculator, BarChart3, Brain, Zap, RefreshCw, TrendingUp,
  Activity, XCircle, Flame, Lightbulb, CheckSquare, Gauge, Calendar, Star,
  ArrowUp, ArrowDown
} from 'lucide-react';
import { storage } from '../utils/storage';
import { toast } from 'sonner';

interface PropFirmSettings {
  dailyLossLimit: number;
  overallDrawdownLimit: number;
  profitTarget: number;
  currentProfit: number;
  averageDailyProfit: number;
  averageRiskPerTrade: number;
}

type Zone = 'optimal' | 'caution' | 'danger' | 'critical';

const ZONE_CONFIG = {
  optimal:  { label: '🟢 Optimal Zone',  color: 'text-green-600',  bg: 'bg-green-500/10',  border: 'border-green-500/30',  bar: 'bg-green-500'  },
  caution:  { label: '🟡 Caution Zone',  color: 'text-yellow-600', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', bar: 'bg-yellow-500' },
  danger:   { label: '🔴 Danger Zone',   color: 'text-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-500/30', bar: 'bg-orange-500' },
  critical: { label: '🚨 Stop Trading',  color: 'text-red-600',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    bar: 'bg-red-500'    },
};

const ZONE_GUIDANCE = {
  optimal:  { title: 'Optimal Zone — Trade your plan.',      msg: 'Account is in great shape. Focus on A+ setups only. Protect your gains as much as you grow them.' },
  caution:  { title: 'Caution Zone — Reduce your size.',     msg: 'You\'ve used 40%+ of your daily limit. Cut position size by 50%. Only take high-conviction setups.' },
  danger:   { title: 'Danger Zone — High violation risk.',   msg: 'You\'re approaching your limit. Strong recommendation to stop. If you continue, micro-size only.' },
  critical: { title: 'Stop Trading — Protect the account.',  msg: 'One average loss from a rule violation. Stop now. Come back tomorrow with a fresh mindset.' },
};

const INSTRUMENTS: Record<string, number> = {
  NQ: 20, MNQ: 2, ES: 50, MES: 5, YM: 5, MYM: 0.5, RTY: 50, M2K: 10, CL: 1000, GC: 100,
};

const MAX_POSITIONS = [
  { name: 'NQ', pv: 20, stop: 10 }, { name: 'MNQ', pv: 2, stop: 10 },
  { name: 'ES', pv: 50, stop: 8 },  { name: 'MES', pv: 5, stop: 8 },
];

function getZone(pct: number): Zone {
  if (pct >= 85) return 'critical';
  if (pct >= 65) return 'danger';
  if (pct >= 40) return 'caution';
  return 'optimal';
}

function getRiskBarColor(pct: number): string {
  if (pct >= 85) return 'bg-red-500';
  if (pct >= 65) return 'bg-orange-500';
  if (pct >= 40) return 'bg-yellow-500';
  return 'bg-green-500';
}

function calcBlowUpProb(lossPercent: number, tradeRisk: number, remainingLoss: number, behaviorWarnings: number): number {
  let prob = 0;
  prob += Math.min(lossPercent * 0.6, 60);
  if (remainingLoss > 0 && tradeRisk > 0) {
    const riskRatio = tradeRisk / remainingLoss;
    prob += Math.min(riskRatio * 30, 30);
  }
  prob += behaviorWarnings * 5;
  return Math.min(Math.round(prob), 99);
}

function projectBlowUpOver(currentBlowUp: number, days: number): number {
  const dailyProb = currentBlowUp / 100;
  return Math.min(99, Math.round((1 - Math.pow(1 - dailyProb, days)) * 100));
}

const CHECKLIST_ITEMS = [
  { id: 'setup',      label: 'Setup matches my trading plan' },
  { id: 'risk',       label: 'Risk is within today\'s allowed limit' },
  { id: 'no_revenge', label: 'This is NOT a revenge trade' },
  { id: 'emotion',    label: 'I am calm and not emotional' },
  { id: 'confirm',    label: 'I have waited for confirmation' },
];

// ── Number input that allows negatives and no leading zero ────────────────────
function NumInput({ value, onChange, allowNegative = false, label }: {
  value: number; onChange: (v: number) => void; allowNegative?: boolean; label: string;
}) {
  const [raw, setRaw] = useState(value === 0 ? '' : String(value));

  useEffect(() => {
    setRaw(value === 0 ? '' : String(value));
  }, [value]);

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        onWheel={e => e.currentTarget.blur()}
        value={raw}
        placeholder="0"
        onChange={e => {
          const str = e.target.value;
          setRaw(str);
          const num = parseFloat(str);
          if (!isNaN(num) && (allowNegative || num >= 0)) {
            onChange(num);
          } else if (str === '' || str === '-') {
            onChange(0);
          }
        }}
        onBlur={() => {
          const num = parseFloat(raw);
          if (isNaN(num)) { setRaw(''); onChange(0); }
          else setRaw(String(num));
        }}
      />
    </div>
  );
}

export function PropFirmSuccess() {
  const currentUser = storage.getCurrentUser();
  const isPremium = currentUser?.isPremium;

  const [showSettings, setShowSettings] = useState(false);
  const [disciplineLocked, setDisciplineLocked] = useState(false);
  const [lockConfirmText, setLockConfirmText] = useState('');
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [checklistPassed, setChecklistPassed] = useState<boolean | null>(null);
  const [disciplineImpact, setDisciplineImpact] = useState(0);
  const [autoLockTriggered, setAutoLockTriggered] = useState(false);

  const [settings, setSettings] = useState<PropFirmSettings>({
    dailyLossLimit: 2500,
    overallDrawdownLimit: 5000,
    profitTarget: 8000,
    currentProfit: 0,
    averageDailyProfit: 300,
    averageRiskPerTrade: 250,
  });

  const [instrument, setInstrument] = useState('NQ');
  const [contracts, setContracts] = useState(1);
  const [stopSize, setStopSize] = useState(10);

  useEffect(() => {
    if (currentUser) {
      const saved = localStorage.getItem(`prop_firm_settings_${currentUser.id}`);
      if (saved) setSettings(JSON.parse(saved));
      if (localStorage.getItem(`prop_firm_locked_${currentUser.id}`) === 'true') setDisciplineLocked(true);
      const impact = localStorage.getItem(`prop_firm_discipline_impact_${currentUser.id}`);
      if (impact) setDisciplineImpact(parseInt(impact) || 0);
    }
  }, [currentUser?.id]);

  const tradeRisk = contracts * stopSize * (INSTRUMENTS[instrument] ?? 20);

  // ── Use journal P&L data to calculate today's loss ──────────────────────────
  // Reads the pnl field directly from journal entries (not custom fields)
  const todayLoss = (() => {
    const today = new Date().toISOString().split('T')[0];
    const entries = storage.getJournalEntries()
      .filter(e => e.date === today && e.userId === currentUser?.id);

    let totalLoss = 0;
    entries.forEach(e => {
      // Use the dedicated pnl field first
      if (typeof e.pnl === 'number' && e.pnl < 0) {
        totalLoss += Math.abs(e.pnl);
      } else if (e.result === 'loss') {
        // Fall back to risk per trade estimate if no P&L
        totalLoss += settings.averageRiskPerTrade;
      }
    });
    return totalLoss;
  })();

  // Also calculate today's total P&L (positive or negative)
  const todayPnL = (() => {
    const today = new Date().toISOString().split('T')[0];
    return storage.getJournalEntries()
      .filter(e => e.date === today && e.userId === currentUser?.id)
      .reduce((sum, e) => sum + (typeof e.pnl === 'number' ? e.pnl : 0), 0);
  })();

  const remainingLoss = Math.max(settings.dailyLossLimit - todayLoss, 0);
  const lossPercent = Math.min((todayLoss / Math.max(settings.dailyLossLimit, 1)) * 100, 100);
  const zone = getZone(lossPercent);
  const cfg = ZONE_CONFIG[zone];
  const guidance = ZONE_GUIDANCE[zone];
  const remainingProfit = Math.max(settings.profitTarget - settings.currentProfit, 0);
  const challengeProgress = Math.min((settings.currentProfit / Math.max(settings.profitTarget, 1)) * 100, 100);
  const recommendedMaxRisk = remainingLoss * 0.30;

  useEffect(() => {
    if (lossPercent >= 100 && !disciplineLocked && !autoLockTriggered) {
      setDisciplineLocked(true);
      setAutoLockTriggered(true);
      localStorage.setItem(`prop_firm_locked_${currentUser?.id}`, 'true');
      toast.error('🔒 Auto-Lock activated — daily loss limit reached.');
    }
  }, [lossPercent]);

  const getTiltSignals = () => {
    const today = new Date().toISOString().split('T')[0];
    const entries = storage.getJournalEntries()
      .filter(e => e.date === today && e.userId === currentUser?.id);
    const signals: { text: string; level: 'warning' | 'critical' }[] = [];

    if (entries.length >= 2) {
      const last3 = entries.slice(-3);
      const consecLosses = last3.filter(e => e.result === 'loss').length;
      if (consecLosses === 3) signals.push({ text: '3 consecutive losses — tilt probability very high', level: 'critical' });
      else if (consecLosses === 2) signals.push({ text: '2 losses in a row — revenge trading risk elevated', level: 'warning' });
    }

    if (entries.length >= 3) {
      const risks = entries.slice(-3).map(e => e.riskReward || 0);
      if (risks[2] > risks[1] * 1.5 && risks[1] > risks[0] * 1.5)
        signals.push({ text: 'Position size increasing after each trade — classic tilt pattern', level: 'critical' });
    }

    const style = currentUser?.tradingStyle || 'Day Trader';
    const maxTrades = ({ 'Day Trader': 8, 'Swing Trader': 3, 'Long Term Hold': 2, 'Other': 5 } as any)[style] ?? 5;
    if (entries.length > maxTrades)
      signals.push({ text: `${entries.length} trades today — above normal for ${style}`, level: 'warning' });

    // Warn if today's loss is more than 50% of daily limit
    if (todayLoss > settings.dailyLossLimit * 0.5)
      signals.push({ text: `Lost $${todayLoss.toLocaleString()} today — over 50% of daily limit used`, level: 'warning' });

    return signals;
  };

  const tiltSignals = getTiltSignals();
  const isTilting = tiltSignals.some(s => s.level === 'critical');
  const blowUpProb = calcBlowUpProb(lossPercent, tradeRisk, remainingLoss, tiltSignals.length);
  const blowUpProb10Days = projectBlowUpOver(blowUpProb, 10);

  const getSmartTradeLimit = () => {
    const entries = storage.getJournalEntries().filter(e => e.userId === currentUser?.id);
    if (entries.length < 5) return Math.max(0, Math.floor(remainingLoss / settings.averageRiskPerTrade));
    const wins = entries.filter(e => e.result === 'win').length;
    const total = entries.filter(e => e.result === 'win' || e.result === 'loss').length;
    const winRate = total > 0 ? wins / total : 0.5;
    const rrEntries = entries.filter(e => (e.riskReward || 0) > 0);
    const avgRR = rrEntries.length > 0 ? rrEntries.reduce((s, e) => s + (e.riskReward || 0), 0) / rrEntries.length : 1;
    const kellySizing = Math.max(0.1, winRate * avgRR - (1 - winRate));
    const base = Math.max(0, Math.floor(remainingLoss / settings.averageRiskPerTrade));
    return Math.max(0, Math.floor(base * kellySizing));
  };

  const getDynamicMaxRisk = () => {
    let base = remainingLoss * 0.30;
    if (tiltSignals.length >= 2) base *= 0.5;
    else if (tiltSignals.length === 1) base *= 0.7;
    if (lossPercent >= 65) base *= 0.5;
    return Math.round(base);
  };

  const getAIRecommendation = () => {
    if (disciplineLocked) return 'Discipline Lock is active. Confirm you understand the risks before trading again.';
    if (lossPercent >= 100) return 'Daily loss limit reached. Trading is locked for today — the account is protected.';
    if (lossPercent >= 85) return 'Stop trading today. One more average loss ends the challenge. The account is more valuable than any single trade.';
    if (isTilting) return 'Tilt detected. High probability of rule-breaking behavior. Take a 30-minute break minimum before considering another trade.';
    if (tradeRisk > remainingLoss) return `This trade would violate your daily limit. Reduce to ${Math.floor(remainingLoss / (stopSize * (INSTRUMENTS[instrument] ?? 20)))} contract(s) or skip.`;
    if (tradeRisk > recommendedMaxRisk) return `Size is above recommended max. Consider ${Math.floor(getDynamicMaxRisk() / (stopSize * (INSTRUMENTS[instrument] ?? 20)))} contract(s) for safe risk management.`;
    const hour = new Date().getHours();
    if (hour >= 9 && hour < 11) return `Account in ${zone} zone. ${getSmartTradeLimit()} smart trades remaining. You're in the NY Open — historically the best window. Stay disciplined.`;
    if (hour >= 11 && hour < 13) return `Midday session — lower volatility. Account in ${zone} zone. ${getSmartTradeLimit()} smart trades remaining. Only A+ setups.`;
    return `Account in ${zone} zone. Approximately ${getSmartTradeLimit()} smart trades remain today. Stay selective.`;
  };

  const adjustDisciplineImpact = (delta: number, reason: string) => {
    const newVal = disciplineImpact + delta;
    setDisciplineImpact(newVal);
    localStorage.setItem(`prop_firm_discipline_impact_${currentUser?.id}`, String(newVal));
    if (delta > 0) toast.success(`+${delta} Discipline ${reason}`);
    else toast.error(`${delta} Discipline ${reason}`);
  };

  const activateLock = () => {
    setDisciplineLocked(true);
    localStorage.setItem(`prop_firm_locked_${currentUser?.id}`, 'true');
    adjustDisciplineImpact(+5, '— Discipline lock activated');
  };

  const unlockDiscipline = () => {
    if (lockConfirmText.toLowerCase() !== 'i understand the risk') {
      toast.error('Type exactly: I understand the risk');
      return;
    }
    setDisciplineLocked(false);
    setLockConfirmText('');
    setAutoLockTriggered(false);
    localStorage.removeItem(`prop_firm_locked_${currentUser?.id}`);
    toast.success('Lock removed. Trade with discipline.');
  };

  const handleChecklistSubmit = () => {
    const allPassed = CHECKLIST_ITEMS.every(item => checklistState[item.id]);
    setChecklistPassed(allPassed);
    if (allPassed) {
      adjustDisciplineImpact(+3, '— Pre-trade checklist followed');
      toast.success('Pre-trade checklist passed ✓ Proceed with your trade.');
    } else {
      adjustDisciplineImpact(-2, '— Checklist not fully completed');
      toast.error('Checklist failed — do not take this trade.');
    }
  };

  const saveSettings = () => {
    if (!currentUser) return;
    localStorage.setItem(`prop_firm_settings_${currentUser.id}`, JSON.stringify(settings));
    setShowSettings(false);
    toast.success('Settings saved!');
  };

  const tradeBreach  = tradeRisk > remainingLoss;
  const tradeWarning = !tradeBreach && tradeRisk > recommendedMaxRisk;

  const projectedDaysToGoal = settings.averageDailyProfit > 0 && remainingProfit > 0
    ? Math.ceil(remainingProfit / settings.averageDailyProfit) : null;
  const projectedDate = projectedDaysToGoal
    ? new Date(Date.now() + projectedDaysToGoal * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const shouldSuggestStop = (() => {
    const upSignificantly   = todayPnL > settings.averageDailyProfit * 2;
    const downSignificantly = lossPercent >= 65;
    return {
      suggest: upSignificantly || downSignificantly,
      reason: upSignificantly ? 'You\'re up significantly — protect your gains.' : 'You\'re in the danger zone — protect the account.',
    };
  })();

  if (!isPremium) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8"><h1 className="text-3xl font-bold mb-2">Prop Firm Success</h1></div>
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="py-16 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Premium Feature</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Tilt detection, blow-up probability, dynamic risk, discipline lock, and full account protection.</p>
            <Button size="lg" className="mt-4" onClick={() => window.location.href = '/app/upgrade'}>
              Upgrade to Premium <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl pb-24 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-green-600" />
          <h1 className="text-2xl font-bold">Account Protection Center</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
          <RefreshCw className="w-4 h-4 mr-2" /> Prop Firm Rules
        </Button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="border-2 border-primary/20">
          <CardHeader><CardTitle>Challenge Settings</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <NumInput label="Daily Loss Limit ($)" value={settings.dailyLossLimit} onChange={v => setSettings(s => ({ ...s, dailyLossLimit: v }))} />
              <NumInput label="Overall Drawdown ($)" value={settings.overallDrawdownLimit} onChange={v => setSettings(s => ({ ...s, overallDrawdownLimit: v }))} />
              <NumInput label="Profit Target ($)" value={settings.profitTarget} onChange={v => setSettings(s => ({ ...s, profitTarget: v }))} />
              <NumInput label="Current Profit ($)" value={settings.currentProfit} onChange={v => setSettings(s => ({ ...s, currentProfit: v }))} allowNegative />
              <NumInput label="Avg Daily Profit ($)" value={settings.averageDailyProfit} onChange={v => setSettings(s => ({ ...s, averageDailyProfit: v }))} />
              <NumInput label="Avg Risk Per Trade ($)" value={settings.averageRiskPerTrade} onChange={v => setSettings(s => ({ ...s, averageRiskPerTrade: v }))} />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              💡 Daily loss is auto-calculated from your journal P&L entries. Settings override only if no P&L is logged.
            </p>
            <div className="flex gap-2 mt-4">
              <Button onClick={saveSettings}>Save</Button>
              <Button variant="ghost" onClick={() => setShowSettings(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discipline Score */}
      <Card className={`border ${disciplineImpact >= 0 ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-amber-500" />
              <div>
                <p className="font-semibold text-sm">Today's Discipline Score Impact</p>
                <p className="text-xs text-muted-foreground">Updated on every action taken in the engine</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${disciplineImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {disciplineImpact >= 0 ? '+' : ''}{disciplineImpact}
              </span>
              {disciplineImpact >= 0 ? <ArrowUp className="w-5 h-5 text-green-500" /> : <ArrowDown className="w-5 h-5 text-red-500" />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zone Banner */}
      <Card className={`border-2 ${cfg.border} ${cfg.bg}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">Account Status</h2>
            <Badge className={`${cfg.color} text-base px-4 py-2 font-bold border ${cfg.border} ${cfg.bg}`}>{cfg.label}</Badge>
          </div>
          <p className={`font-semibold ${cfg.color} mb-1`}>{guidance.title}</p>
          <p className="text-sm text-muted-foreground">{guidance.msg}</p>
          {todayPnL !== 0 && (
            <div className={`mt-3 p-3 rounded-lg text-sm font-semibold ${todayPnL > 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
              Today's P&L from journal: {todayPnL >= 0 ? '+' : ''}${todayPnL.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Stop Suggestion */}
      {shouldSuggestStop.suggest && (
        <Card className="border-2 border-blue-500/30 bg-blue-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Gauge className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-semibold text-sm text-blue-600">Consider stopping for the day</p>
                <p className="text-xs text-muted-foreground">{shouldSuggestStop.reason}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discipline Lock */}
      {disciplineLocked ? (
        <Card className="border-2 border-red-500/50 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Lock className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-bold text-red-600">
                {autoLockTriggered ? '🔒 Auto-Lock Active — Daily Limit Reached' : 'Discipline Lock Active'}
              </h2>
            </div>
            {autoLockTriggered && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm font-bold text-red-600">Trading locked to protect account. Come back tomorrow with a fresh mindset.</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground mb-4">To unlock, type exactly: <span className="font-mono font-bold">I understand the risk</span></p>
            <div className="flex gap-3">
              <Input placeholder="Type: I understand the risk" value={lockConfirmText} onChange={e => setLockConfirmText(e.target.value)} />
              <Button variant="destructive" onClick={unlockDiscipline}>Unlock</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-muted">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-sm">Discipline Lock</p>
                  <p className="text-xs text-muted-foreground">Temporarily lock yourself out if breaking rules</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={activateLock}>Activate</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tilt Detection */}
      {tiltSignals.length > 0 && (
        <Card className={`border-2 ${isTilting ? 'border-red-500/50 bg-red-500/5' : 'border-orange-500/30 bg-orange-500/5'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Flame className={`w-6 h-6 ${isTilting ? 'text-red-600' : 'text-orange-500'}`} />
              <h2 className="text-xl font-bold">{isTilting ? '🚨 Tilt Detected' : '⚠️ Tilt Warning'}</h2>
            </div>
            {isTilting && (
              <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm font-bold text-red-600">High probability of rule-breaking — strongly recommend stopping now.</p>
              </div>
            )}
            <div className="space-y-2">
              {tiltSignals.map((s, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${s.level === 'critical' ? 'bg-red-500/10 border-red-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
                  {s.level === 'critical' ? <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />}
                  <p className="text-sm font-medium">{s.text}</p>
                </div>
              ))}
            </div>
            {isTilting && (
              <Button variant="destructive" className="w-full mt-4" onClick={activateLock}>
                <Lock className="w-4 h-4 mr-2" /> Activate Discipline Lock Now
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Blow-Up Probability */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold">Blow-Up Probability</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className={`text-5xl font-bold ${blowUpProb >= 70 ? 'text-red-600' : blowUpProb >= 40 ? 'text-orange-500' : blowUpProb >= 20 ? 'text-yellow-500' : 'text-green-600'}`}>{blowUpProb}%</div>
                <div className="text-xs text-muted-foreground mt-1">Today</div>
              </div>
              <div className="flex-1">
                <div className="w-full bg-muted rounded-full h-3 mb-1">
                  <div className={`h-3 rounded-full transition-all ${blowUpProb >= 70 ? 'bg-red-500' : blowUpProb >= 40 ? 'bg-orange-500' : blowUpProb >= 20 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${blowUpProb}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">Based on daily loss, sizing, and behavior ({tiltSignals.length} warning{tiltSignals.length !== 1 ? 's' : ''})</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted border">
              <p className="text-xs text-muted-foreground mb-1">At current behavior — 10-day projection</p>
              <p className={`text-2xl font-bold ${blowUpProb10Days >= 50 ? 'text-red-600' : blowUpProb10Days >= 25 ? 'text-orange-500' : 'text-green-600'}`}>{blowUpProb10Days}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {blowUpProb10Days >= 50 ? 'Critical risk over 10 days — change behavior now.' : blowUpProb10Days >= 25 ? 'Moderate risk over 10 days — reduce daily exposure.' : 'Risk stays manageable if behavior is consistent.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Loss Gauge */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold">Daily Loss Usage</h2>
          </div>
          <div className="relative mb-2">
            <div className="flex h-10 rounded-lg overflow-hidden">
              <div className="bg-green-500/25 flex-[40]" />
              <div className="bg-yellow-500/25 flex-[25]" />
              <div className="bg-orange-500/25 flex-[20]" />
              <div className="bg-red-500/25 flex-[15]" />
            </div>
            <div className="absolute inset-0">
              <div className={`h-10 rounded-lg transition-all duration-700 ease-out opacity-80 ${getRiskBarColor(lossPercent)}`} style={{ width: `${Math.min(lossPercent, 100)}%` }} />
            </div>
            {lossPercent > 2 && (
              <div className="absolute top-0 pointer-events-none" style={{ left: `${Math.min(lossPercent, 97)}%`, transform: 'translateX(-50%)' }}>
                <div className="w-0.5 h-10 bg-foreground" />
                <div className="mt-1 px-2 py-0.5 bg-foreground text-background text-xs font-bold rounded whitespace-nowrap">{lossPercent.toFixed(0)}%</div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1 text-xs text-center mt-8 mb-4">
            {[['0–40%','Optimal','text-green-600'],['40–65%','Caution','text-yellow-600'],['65–85%','Danger','text-orange-600'],['85–100%','Critical','text-red-600']].map(([r,l,c]) => (
              <div key={r}><div className={`font-semibold ${c}`}>{r}</div><div className="text-muted-foreground">{l}</div></div>
            ))}
          </div>
          {lossPercent >= 40 && (
            <div className={`mb-3 p-3 rounded-lg border text-xs font-medium flex items-center gap-2 ${
              lossPercent >= 85 ? 'bg-red-500/10 border-red-500/20 text-red-600'
              : lossPercent >= 65 ? 'bg-orange-500/10 border-orange-500/20 text-orange-600'
              : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400'
            }`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {lossPercent >= 85 ? '🚨 High pressure zone — one trade from a rule violation. Reduce size immediately.'
                : lossPercent >= 65 ? '⚠️ Elevated pressure zone — danger territory. Reduce size by 50%.'
                : '⚡ Caution zone — cut position size by 50% and only take high-conviction setups.'}
            </div>
          )}
          <div className="grid grid-cols-3 gap-3 mt-2">
            {[
              { label: 'Lost Today',   val: `$${todayLoss.toLocaleString()}`,    color: 'text-red-500' },
              { label: 'Remaining',    val: `$${remainingLoss.toLocaleString()}`, color: zone === 'critical' ? 'text-red-500' : 'text-green-500' },
              { label: 'Smart Trades', val: getSmartTradeLimit().toString(),       color: 'text-blue-500' },
            ].map(({ label, val, color }) => (
              <div key={label} className="p-3 rounded-lg bg-muted text-center">
                <div className={`text-xl font-bold ${color}`}>{val}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Calculator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Calculator className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold">Plan Next Trade Risk</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-1">
              <Label className="text-xs">Instrument</Label>
              <Select value={instrument} onValueChange={setInstrument}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.keys(INSTRUMENTS).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Contracts</Label>
              <Input type="number" min={1} value={contracts || ''} placeholder="1" onWheel={e => e.currentTarget.blur()} onChange={e => setContracts(parseInt(e.target.value) || 1)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Stop (pts)</Label>
              <Input type="number" min={1} value={stopSize || ''} placeholder="10" onWheel={e => e.currentTarget.blur()} onChange={e => setStopSize(parseInt(e.target.value) || 1)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Trade Risk</Label>
              <div className={`px-3 py-2 rounded-lg font-bold text-xl ${tradeBreach ? 'bg-red-500/10 text-red-600' : tradeWarning ? 'bg-amber-500/10 text-amber-600' : 'bg-green-500/10 text-green-600'}`}>
                ${tradeRisk.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
            <p className="text-xs text-muted-foreground mb-1">Dynamic Max Risk (adjusted for tilt behavior)</p>
            <p className="font-bold text-blue-600">${getDynamicMaxRisk().toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/50 border mb-4">
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-xs text-muted-foreground mb-1">Trade Risk</p><p className="text-lg font-bold">${tradeRisk.toLocaleString()}</p></div>
              <div><p className="text-xs text-muted-foreground mb-1">Buffer After Loss</p>
                <p className={`text-lg font-bold ${(remainingLoss - tradeRisk) < 0 ? 'text-red-600' : 'text-green-600'}`}>${(remainingLoss - tradeRisk).toLocaleString()}</p>
              </div>
              <div><p className="text-xs text-muted-foreground mb-1">Smart Trades Left After</p>
                <p className="text-lg font-bold text-blue-600">{tradeRisk > 0 ? Math.max(0, Math.floor((remainingLoss - tradeRisk) / settings.averageRiskPerTrade)) : '—'}</p>
              </div>
            </div>
          </div>
          {tradeBreach ? (
            <div className="p-4 rounded-lg bg-red-500/10 border-2 border-red-500/50">
              <div className="flex items-start gap-3">
                <XCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-red-600 text-base mb-1">🚫 This trade violates your risk rules.</p>
                  <p className="text-sm text-muted-foreground">Exceeds daily loss limit. Reduce to {Math.max(0, Math.floor(remainingLoss / (stopSize * (INSTRUMENTS[instrument] ?? 20))))} contracts or skip entirely.</p>
                </div>
              </div>
            </div>
          ) : tradeWarning ? (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-semibold text-amber-600">Above recommended max — consider sizing down for safer risk management.</p>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-semibold text-green-600">✓ Within safe limits</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pre-Trade Checklist */}
      <Card className="border-2 border-blue-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold">Pre-Trade Checklist</h2>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setShowChecklist(!showChecklist); setChecklistState({}); setChecklistPassed(null); }}>
              {showChecklist ? 'Close' : 'Open Checklist'}
            </Button>
          </div>
          {showChecklist && (
            <div className="space-y-3">
              {CHECKLIST_ITEMS.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <input type="checkbox" id={item.id} checked={!!checklistState[item.id]} onChange={e => setChecklistState(s => ({ ...s, [item.id]: e.target.checked }))} className="w-5 h-5 rounded" />
                  <label htmlFor={item.id} className="text-sm font-medium cursor-pointer">{item.label}</label>
                </div>
              ))}
              <Button className="w-full mt-2" onClick={handleChecklistSubmit}>Evaluate Checklist</Button>
              {checklistPassed !== null && (
                <div className={`p-4 rounded-lg border ${checklistPassed ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  <p className={`font-bold text-sm ${checklistPassed ? 'text-green-600' : 'text-red-600'}`}>
                    {checklistPassed ? '✓ All checks passed — proceed with discipline' : '✗ Checklist failed — do NOT take this trade'}
                  </p>
                </div>
              )}
            </div>
          )}
          {!showChecklist && <p className="text-sm text-muted-foreground">Run this before every trade to confirm you're not making an emotional decision.</p>}
        </CardContent>
      </Card>

      {/* AI Recommendation */}
      <Card className="border-2 border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-3">
            <Brain className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold">AI Risk Recommendation</h2>
          </div>
          <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300 leading-relaxed">{getAIRecommendation()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Max Allowed Positions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold">Max Allowed Positions</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Based on remaining buffer: <span className="font-bold text-foreground">${remainingLoss.toLocaleString()}</span></p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {MAX_POSITIONS.map(pos => {
              const max = Math.max(0, Math.floor(remainingLoss / (pos.pv * pos.stop)));
              return (
                <div key={pos.name} className={`p-4 rounded-xl text-center border ${max === 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-muted/50 border-transparent'}`}>
                  <div className="text-base font-bold mb-1">{pos.name}</div>
                  <div className={`text-3xl font-bold mb-1 ${max === 0 ? 'text-red-500' : 'text-indigo-600'}`}>{max}</div>
                  <div className="text-xs text-muted-foreground">@ {pos.stop}pt stop</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Protection */}
      {lossPercent >= 60 && (
        <Card className="border-2 border-red-500/30 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-bold">Emergency Protection</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{lossPercent.toFixed(0)}% of daily limit used — statistically the highest-risk zone for violations.</p>
            <Button variant="destructive" className="w-full mb-4" onClick={() => { activateLock(); toast.success('Protection Mode activated.'); }}>
              <Zap className="w-4 h-4 mr-2" /> Activate Protection Mode
            </Button>
            <div className="p-4 bg-background border border-red-500/20 rounded-lg space-y-2">
              {['Stop trading for today', 'Micro-size only if continuing', 'Only A+ setups with full confirmation', 'Set hard stop equal to remaining buffer'].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm"><span className="text-red-500 font-bold mt-0.5">•</span><span>{item}</span></div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Challenge Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-bold">Challenge Progress</h2>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div><p className="text-xs text-muted-foreground mb-1">Target</p><p className="text-xl font-bold">${settings.profitTarget.toLocaleString()}</p></div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Current</p>
              <p className={`text-xl font-bold ${settings.currentProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>${settings.currentProfit.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{challengeProgress.toFixed(0)}% complete</p>
            </div>
            <div><p className="text-xs text-muted-foreground mb-1">Remaining</p><p className="text-xl font-bold">${remainingProfit.toLocaleString()}</p></div>
          </div>
          <div className="w-full bg-muted rounded-full h-3 mb-3">
            <div className="h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all" style={{ width: `${challengeProgress}%` }} />
          </div>
          {projectedDate && projectedDaysToGoal && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1"><Calendar className="w-4 h-4 text-blue-500" /><span className="text-xs text-muted-foreground">Projected Completion</span></div>
                <p className="font-bold text-blue-600 text-sm">{projectedDate}</p>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-blue-500" /><span className="text-xs text-muted-foreground">Trading Days Left</span></div>
                <p className="font-bold text-blue-600 text-sm">~{projectedDaysToGoal} days</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
