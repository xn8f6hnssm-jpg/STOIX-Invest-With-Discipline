import { useNavigate } from 'react-router';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Brain, TrendingUp, TrendingDown, Lightbulb, Target, AlertCircle,
  CheckCircle2, XCircle, Zap, BarChart3, Clock, ChevronRight,
  Sparkles, Activity, Shield, Trophy, Lock, FlaskConical,
  Gauge, GitMerge, ToggleLeft, ToggleRight, Sigma, Repeat
} from 'lucide-react';
import { storage } from '../utils/storage';
import { PremiumUpgradeModal } from '../components/PremiumUpgradeModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SetupPerformance {
  conditions: string[];
  winRate: number;
  profitFactor: number;
  tradesAnalyzed: number;
  avgPnL: number;
  totalPnL: number;
  avgRR: number;
  insight: string;
}

interface BehaviorInsight {
  behavior: string;
  withBehavior: { winRate: number; trades: number };
  withoutBehavior: { winRate: number; trades: number };
  impact: number;
  insight: string;
}

interface RRAnalysis {
  bestRange: string;
  bestWinRate: number;
  bestTrades: number;
  worstRange: string;
  worstWinRate: number;
  insight: string;
}

interface TimeAnalysis {
  bestSession: string;
  bestWinRate: number;
  worstSession: string;
  worstWinRate: number;
  insight: string;
}

interface ExecutionGap {
  backtestingWinRate: number;
  liveWinRate: number;
  gap: number;
  backtestingTrades: number;
  liveTrades: number;
  insight: string;
}

interface EdgeScore { name: string; score: number; winRate: number; trades: number; confidence: 'High' | 'Medium' | 'Low'; }
interface AvoidPattern { description: string; winRate: number; trades: number; recommendation: string; }
interface Cluster { name: string; description: string; trades: number; winRate: number; totalPnL: number; }
interface EdgeDecay { recent10WR: number; previous20WR: number; drift: number; detected: boolean; }
interface ProfitLeak { description: string; estimatedImpact: string; trades: number; }
interface Playbook { rules: string[]; estimatedWinRate: number; confidence: 'High' | 'Medium' | 'Low'; }

// NEW: Additional metric types
interface Expectancy { value: number; avgWin: number; avgLoss: number; winRate: number; lossRate: number; }
interface ConsistencyScore { score: number; stdDev: number; insight: string; }
interface ContradictionInsight { description: string; detail: string; }
interface WhatIfResult { originalWinRate: number; simulatedWinRate: number; originalPnL: number; simulatedPnL: number; improvement: number; tradesRemoved: number; filterApplied: string; }

interface AnalysisResults {
  dataMode: 'live' | 'backtesting';
  totalTrades: number;
  overallWinRate: number;
  winCount: number;
  lossCount: number;
  avgRR: number;
  bestSetup: SetupPerformance | null;
  worstSetup: SetupPerformance | null;
  behaviorLeaks: BehaviorInsight[];
  rrAnalysis: RRAnalysis | null;
  timeAnalysis: TimeAnalysis | null;
  executionGap: ExecutionGap | null;
  confluenceInsights: ConfluenceInsight[];
  edgeScores: EdgeScore[];
  avoidPatterns: AvoidPattern[];
  clusters: Cluster[];
  edgeDecay: EdgeDecay | null;
  profitLeaks: ProfitLeak[];
  playbook: Playbook | null;
  recommendations: string[];
  hasMinimumData: boolean;
  // NEW: Enhanced metrics
  expectancy: Expectancy | null;
  consistencyScore: ConsistencyScore | null;
  contradictions: ContradictionInsight[];
  whatIf: WhatIfResult | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calcWinRate = (entries: any[]): number => {
  const wins = entries.filter(e => e.result === 'win').length;
  const losses = entries.filter(e => e.result === 'loss').length;
  return wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
};

const generateSetupInsight = (conditions: string[], winRate: number, trades: number, profitFactor: number): string => {
  const label = conditions.slice(0, 2).join(' + ') || 'this setup';
  if (winRate >= 65)
    return `Your ${label} combination wins ${winRate}% of the time across ${trades} trades. This is your highest-edge setup — prioritise it and trade it with full confidence.`;
  if (winRate <= 40)
    return `Trades taken with ${label} only win ${winRate}% of the time across ${trades} trades. This setup is actively hurting your performance — consider removing it until you understand why it fails.`;
  return `${label} shows a ${winRate}% win rate with a ${profitFactor.toFixed(1)}x profit factor across ${trades} trades. Results are moderate — look for confluence improvements to sharpen the edge.`;
};

// ─── Named Confluence Analysis (SMT, IFVG, Liquidity Sweep, etc.) ────────────

interface ConfluenceInsight {
  name: string;
  withWinRate: number;
  withoutWinRate: number;
  withCount: number;
  withoutCount: number;
  avgPnlWith: number;
  impact: number;
  verdict: 'strong' | 'weak' | 'neutral';
  insight: string;
}

const KNOWN_CONFLUENCES = [
  'SMT', 'IFVG', 'FVG', 'Liquidity Sweep', 'Liquidity', 'MSS', 'Market Structure',
  'CISD', 'OB', 'Order Block', 'Breaker', 'Mitigation', 'VWAP', 'POI', 'HTF',
  'Confirmation', 'Checklist', 'Volume', 'News', 'Session', 'NY Open', 'London',
];

function analyzeNamedConfluences(entries: any[]): ConfluenceInsight[] {
  const customFields = storage.getJournalFields();
  const results: ConfluenceInsight[] = [];

  const detectedConfluences = new Set<string>();

  customFields.forEach((f: any) => {
    KNOWN_CONFLUENCES.forEach(kw => {
      if (f.name.toLowerCase().includes(kw.toLowerCase())) {
        detectedConfluences.add(f.name);
      }
    });
  });

  const kwMatches = new Set<string>();
  entries.forEach(entry => {
    const text = `${entry.description || ''} ${JSON.stringify(entry.customFields || {})}`.toLowerCase();
    KNOWN_CONFLUENCES.forEach(kw => {
      if (text.includes(kw.toLowerCase())) kwMatches.add(kw);
    });
  });

  const calcWR = (arr: any[]) => {
    const w = arr.filter(e => e.result === 'win').length;
    const l = arr.filter(e => e.result === 'loss').length;
    return w + l > 0 ? Math.round((w / (w + l)) * 100) : 0;
  };

  detectedConfluences.forEach(fieldName => {
    const withConf = entries.filter(e => {
      const v = e.customFields?.[fieldName];
      return v === true || v === 'true' || (typeof v === 'string' && v.trim() !== '');
    });
    const withoutConf = entries.filter(e => {
      const v = e.customFields?.[fieldName];
      return !v || v === false || v === 'false' || v === '';
    });

    if (withConf.length < 3 || withoutConf.length < 3) return;

    const withWR = calcWR(withConf);
    const withoutWR = calcWR(withoutConf);
    const impact = withWR - withoutWR;
    const avgPnlWith = withConf.reduce((s, e) => s + (e.pnl || 0), 0) / withConf.length;

    const verdict: 'strong' | 'weak' | 'neutral' = impact >= 15 ? 'strong' : impact <= -10 ? 'weak' : 'neutral';
    const insight = verdict === 'strong'
      ? `Trades with ${fieldName} win ${withWR}% vs ${withoutWR}% without it — a ${impact}% edge boost. Prioritise setups that include this condition.`
      : verdict === 'weak'
      ? `Trades with ${fieldName} only win ${withWR}% — ${Math.abs(impact)}% worse than trades without it. This condition may be adding noise, not signal.`
      : `${fieldName} shows minimal impact (${withWR}% with vs ${withoutWR}% without). Continue tracking to build a larger sample.`;

    results.push({ name: fieldName, withWinRate: withWR, withoutWinRate: withoutWR, withCount: withConf.length, withoutCount: withoutConf.length, avgPnlWith: parseFloat(avgPnlWith.toFixed(2)), impact, verdict, insight });
  });

  kwMatches.forEach(kw => {
    if (Array.from(detectedConfluences).some(f => f.toLowerCase().includes(kw.toLowerCase()))) return;
    const withConf = entries.filter(e => {
      const text = `${e.description || ''} ${JSON.stringify(e.customFields || {})}`.toLowerCase();
      return text.includes(kw.toLowerCase());
    });
    const withoutConf = entries.filter(e => {
      const text = `${e.description || ''} ${JSON.stringify(e.customFields || {})}`.toLowerCase();
      return !text.includes(kw.toLowerCase());
    });
    if (withConf.length < 5 || withoutConf.length < 5) return;
    const withWR = calcWR(withConf);
    const withoutWR = calcWR(withoutConf);
    const impact = withWR - withoutWR;
    const verdict: 'strong' | 'weak' | 'neutral' = impact >= 15 ? 'strong' : impact <= -10 ? 'weak' : 'neutral';
    const avgPnlWith = withConf.reduce((s, e) => s + (e.pnl || 0), 0) / withConf.length;
    const insight = verdict === 'strong'
      ? `Trades mentioning ${kw} win ${withWR}% vs ${withoutWR}% without — a clear ${impact}% edge. Include this in your checklist.`
      : verdict === 'weak'
      ? `Trades mentioning ${kw} only win ${withWR}% — ${Math.abs(impact)}% worse than trades that don't. Reconsider how you use this condition.`
      : `${kw} shows ${Math.abs(impact)}% difference in win rate. Keep tracking.`;
    results.push({ name: kw, withWinRate: withWR, withoutWinRate: withoutWR, withCount: withConf.length, withoutCount: withoutConf.length, avgPnlWith: parseFloat(avgPnlWith.toFixed(2)), impact, verdict, insight });
  });

  return results.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 8);
}

// ─── Analysis Engine ──────────────────────────────────────────────────────────

function analyzeBestWorstSetups(entries: any[]): { bestSetup: SetupPerformance | null; worstSetup: SetupPerformance | null } {
  const customFields = storage.getJournalFields();
  const confluenceFields = customFields.filter((f: any) =>
    ['confluence', 'setup', 'entry', 'model', 'pattern'].some(kw => f.name.toLowerCase().includes(kw))
  );
  if (confluenceFields.length === 0) return { bestSetup: null, worstSetup: null };

  const groups = new Map<string, any[]>();
  entries.forEach(entry => {
    const conditions: string[] = [];
    confluenceFields.forEach((field: any) => {
      const v = entry.customFields?.[field.name];
      if (!v || v === false || v === 'false' || v === '') return;
      if (field.type === 'checkbox' && (v === true || v === 'true')) conditions.push(field.name);
      else if (field.type !== 'checkbox') conditions.push(`${field.name}: ${v}`);
    });
    if (entry.riskReward) {
      conditions.push(entry.riskReward < 1.5 ? 'RR < 1.5' : entry.riskReward < 2 ? 'RR 1.5–2' : 'RR > 2');
    }
    const key = conditions.sort().join(' + ') || 'No Setup Defined';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({ ...entry, conditions });
  });

  const perfs: SetupPerformance[] = [];
  groups.forEach(trades => {
    if (trades.length < 5) return;
    const wins = trades.filter((t: any) => t.result === 'win').length;
    const losses = trades.filter((t: any) => t.result === 'loss').length;
    const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
    const totalPnL = trades.reduce((s: number, t: any) => s + (t.pnl || 0), 0);
    const avgRR = trades.reduce((s: number, t: any) => s + (t.riskReward || 0), 0) / trades.length;
    const gp = trades.filter((t: any) => t.result === 'win').reduce((s: number, t: any) => s + Math.abs(t.pnl || 1), 0);
    const gl = trades.filter((t: any) => t.result === 'loss').reduce((s: number, t: any) => s + Math.abs(t.pnl || 1), 0);
    const pf = gl > 0 ? parseFloat((gp / gl).toFixed(2)) : gp > 0 ? 2 : 0;
    perfs.push({
      conditions: trades[0].conditions,
      winRate, profitFactor: pf, tradesAnalyzed: trades.length,
      avgPnL: parseFloat((totalPnL / trades.length).toFixed(2)),
      totalPnL: parseFloat(totalPnL.toFixed(2)),
      avgRR: parseFloat(avgRR.toFixed(2)),
      insight: generateSetupInsight(trades[0].conditions, winRate, trades.length, pf),
    });
  });

  perfs.sort((a, b) => (b.winRate * 0.6 + b.profitFactor * 20) - (a.winRate * 0.6 + a.profitFactor * 20));
  return { bestSetup: perfs[0] || null, worstSetup: perfs[perfs.length - 1] || null };
}

function analyzeRR(entries: any[]): RRAnalysis | null {
  const ranges = [
    { label: 'RR < 1', f: (e: any) => e.riskReward > 0 && e.riskReward < 1 },
    { label: 'RR 1–1.5', f: (e: any) => e.riskReward >= 1 && e.riskReward < 1.5 },
    { label: 'RR 1.5–2.5', f: (e: any) => e.riskReward >= 1.5 && e.riskReward < 2.5 },
    { label: 'RR 2.5+', f: (e: any) => e.riskReward >= 2.5 },
  ];
  const res = ranges.map(r => ({ label: r.label, trades: entries.filter(r.f) }))
    .filter(r => r.trades.length >= 5)
    .map(r => ({ label: r.label, winRate: calcWinRate(r.trades), count: r.trades.length }));
  if (res.length < 2) return null;
  const best = res.reduce((a, b) => a.winRate > b.winRate ? a : b);
  const worst = res.reduce((a, b) => a.winRate < b.winRate ? a : b);
  return {
    bestRange: best.label, bestWinRate: best.winRate, bestTrades: best.count,
    worstRange: worst.label, worstWinRate: worst.winRate,
    insight: `Your trades perform best at ${best.label} with a ${best.winRate}% win rate. Trades in the ${worst.label} range only win ${worst.winRate}%. Raise your minimum target to ${best.label}.`,
  };
}

function analyzeTime(entries: any[]): TimeAnalysis | null {
  const fields = storage.getJournalFields();
  const timeField = fields.find((f: any) => f.type === 'time' || f.name.toLowerCase().includes('time'));
  if (!timeField) return null;
  const sessions = [
    { label: 'Pre-Market (before 9:30)', f: (h: number) => h < 9 },
    { label: 'Open (9:30–11:00)', f: (h: number) => h >= 9 && h < 11 },
    { label: 'Midday (11:00–13:00)', f: (h: number) => h >= 11 && h < 13 },
    { label: 'Afternoon (13:00–16:00)', f: (h: number) => h >= 13 && h < 16 },
    { label: 'After Hours (16:00+)', f: (h: number) => h >= 16 },
  ];
  const res = sessions.map(s => ({
    label: s.label,
    trades: entries.filter(e => {
      const t = e.customFields?.[timeField.name];
      if (!t) return false;
      return s.f(parseInt(String(t).split(':')[0]));
    }),
  })).filter(r => r.trades.length >= 5).map(r => ({ label: r.label, winRate: calcWinRate(r.trades), count: r.trades.length }));
  if (res.length < 2) return null;
  const best = res.reduce((a, b) => a.winRate > b.winRate ? a : b);
  const worst = res.reduce((a, b) => a.winRate < b.winRate ? a : b);
  return {
    bestSession: best.label, bestWinRate: best.winRate,
    worstSession: worst.label, worstWinRate: worst.winRate,
    insight: `Focus on ${best.label} — your win rate is ${best.winRate}% during this window. Avoid ${worst.label} where your win rate drops to ${worst.winRate}%.`,
  };
}

function analyzeBehavior(entries: any[]): BehaviorInsight[] {
  const insights: BehaviorInsight[] = [];
  const fields = storage.getJournalFields();

  const withCheck = entries.filter(e => e.customFields?.['Checklist Completed'] === true || e.customFields?.['Checklist Completed'] === 'true');
  const withoutCheck = entries.filter(e => !withCheck.includes(e));
  if (withCheck.length >= 5 && withoutCheck.length >= 5) {
    const impact = calcWinRate(withCheck) - calcWinRate(withoutCheck);
    insights.push({
      behavior: 'Checklist Completion', impact,
      withBehavior: { winRate: calcWinRate(withCheck), trades: withCheck.length },
      withoutBehavior: { winRate: calcWinRate(withoutCheck), trades: withoutCheck.length },
      insight: impact > 10
        ? `Following your checklist improves win rate by ${impact}%. Your checklist is working — never skip it.`
        : impact < -5
        ? `Your checklist may need refinement — trades without it perform similarly. Review what's on it.`
        : `Checklist shows a ${impact}% impact. Add more specific filters to increase its effectiveness.`,
    });
  }

  const emotField = fields.find((f: any) => ['emotion', 'state', 'feeling'].some(kw => f.name.toLowerCase().includes(kw)));
  if (emotField) {
    const calm = entries.filter(e => { const v = String(e.customFields?.[emotField.name] || '').toLowerCase(); return ['calm', 'confident', 'focused'].some(w => v.includes(w)); });
    const emotional = entries.filter(e => { const v = String(e.customFields?.[emotField.name] || '').toLowerCase(); return ['revenge', 'fomo', 'fear', 'frustrated', 'anxious'].some(w => v.includes(w)); });
    if (calm.length >= 5 && emotional.length >= 5) {
      const impact = calcWinRate(calm) - calcWinRate(emotional);
      insights.push({
        behavior: 'Emotional State', impact,
        withBehavior: { winRate: calcWinRate(calm), trades: calm.length },
        withoutBehavior: { winRate: calcWinRate(emotional), trades: emotional.length },
        insight: impact > 15
          ? `Emotional trading is costing you ${impact}% in win rate. You break rules most often after a loss — consider a hard stop after 2 consecutive losses.`
          : impact > 0
          ? `Calm trading outperforms emotional trading by ${impact}%. Build a pre-trade mindset routine.`
          : `Emotional state shows minimal measured impact. Your system may be robust, or emotion tracking needs more specificity.`,
      });
    }
  }

  const followed = entries.filter(e => e.followedRules === true || e.rulesFollowed === true);
  const broke = entries.filter(e => e.followedRules === false || e.rulesFollowed === false);
  if (followed.length >= 5 && broke.length >= 5) {
    const impact = calcWinRate(followed) - calcWinRate(broke);
    insights.push({
      behavior: 'Rule Adherence', impact,
      withBehavior: { winRate: calcWinRate(followed), trades: followed.length },
      withoutBehavior: { winRate: calcWinRate(broke), trades: broke.length },
      insight: impact > 10
        ? `Your rules are ${impact}% more effective when followed. Rule violations are your biggest performance leak.`
        : `Following or breaking rules currently shows a ${impact}% difference. Consider making your rules more specific.`,
    });
  }

  return insights;
}

function calcExecutionGap(live: any[], bt: any[]): ExecutionGap | null {
  if (live.length < 10 || bt.length < 10) return null;
  const liveWR = calcWinRate(live), btWR = calcWinRate(bt), gap = liveWR - btWR;
  return {
    backtestingWinRate: btWR, liveWinRate: liveWR, gap,
    backtestingTrades: bt.length, liveTrades: live.length,
    insight: gap < -10
      ? `Your backtested strategy wins ${btWR}% but live execution only ${liveWR}% — a ${Math.abs(gap)}% gap. This is an execution problem, not a strategy problem. Focus on discipline in live markets.`
      : gap > 10
      ? `Your live trading (${liveWR}%) outperforms your backtest (${btWR}%). Document what you're doing differently — you're adapting well.`
      : `Live and backtesting results are within ${Math.abs(gap)}% of each other. Strong execution consistency.`,
  };
}

function buildEdgeScores(confluenceInsights: ConfluenceInsight[]): EdgeScore[] {
  return confluenceInsights.map(ci => {
    const impact = Math.max(ci.withWinRate, 1);
    const absence = Math.max(ci.withoutWinRate, 1);
    const rawScore = (impact / absence) * 5;
    const score = Math.min(10, parseFloat(rawScore.toFixed(1)));
    const confidence: 'High' | 'Medium' | 'Low' = ci.withCount >= 20 ? 'High' : ci.withCount >= 10 ? 'Medium' : 'Low';
    return { name: ci.name, score, winRate: ci.withWinRate, trades: ci.withCount, confidence };
  }).sort((a, b) => b.score - a.score);
}

function buildAvoidPatterns(entries: any[], confluenceInsights: ConfluenceInsight[], rrAnalysis: RRAnalysis | null): AvoidPattern[] {
  const patterns: AvoidPattern[] = [];
  const calcWR = (arr: any[]) => { const w = arr.filter(e => e.result === 'win').length; const l = arr.filter(e => e.result === 'loss').length; return w + l > 0 ? Math.round((w/(w+l))*100) : 0; };

  if (rrAnalysis) {
    const lowRR = entries.filter(e => e.riskReward > 0 && e.riskReward < 2);
    if (lowRR.length >= 5 && calcWR(lowRR) < 45) {
      patterns.push({ description: `Trades with RR below 2.0`, winRate: calcWR(lowRR), trades: lowRR.length, recommendation: `Remove trades with RR < 2.0. Your data shows only ${calcWR(lowRR)}% win rate at this range.` });
    }
  }

  confluenceInsights.filter(ci => ci.verdict === 'weak').forEach(ci => {
    patterns.push({ description: `Trades using ${ci.name}`, winRate: ci.withWinRate, trades: ci.withCount, recommendation: `${ci.name} is producing a ${ci.withWinRate}% win rate. Remove or requalify before including this in your checklist.` });
  });

  const sorted = [...entries].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const afterLoss = sorted.filter((e, i) => i > 0 && sorted[i-1].result === 'loss');
  if (afterLoss.length >= 5) {
    const afterLossWR = calcWR(afterLoss);
    const baseWR = calcWR(entries);
    if (afterLossWR < baseWR - 10) {
      patterns.push({ description: `Trades taken immediately after a loss`, winRate: afterLossWR, trades: afterLoss.length, recommendation: `Your win rate drops ${baseWR - afterLossWR}% after a loss. Implement a mandatory pause before re-entering.` });
    }
  }
  return patterns;
}

function buildClusters(entries: any[]): Cluster[] {
  const calcWR = (arr: any[]) => { const w = arr.filter(e => e.result === 'win').length; const l = arr.filter(e => e.result === 'loss').length; return w + l > 0 ? Math.round((w/(w+l))*100) : 0; };
  const pnl = (arr: any[]) => arr.reduce((s, e) => s + (e.pnl || 0), 0);

  const highConf = entries.filter(e => Object.keys(e.customFields || {}).length >= 3);
  const lowConf  = entries.filter(e => Object.keys(e.customFields || {}).length < 2);
  const highRR   = entries.filter(e => e.riskReward >= 2.5);
  const lowRR    = entries.filter(e => e.riskReward > 0 && e.riskReward < 1.5);

  const clusters: Cluster[] = [];
  if (highConf.length >= 5) clusters.push({ name: 'High Confluence', description: '3+ conditions confirmed', trades: highConf.length, winRate: calcWR(highConf), totalPnL: pnl(highConf) });
  if (lowConf.length >= 5)  clusters.push({ name: 'Low Confirmation', description: 'Fewer than 2 conditions', trades: lowConf.length, winRate: calcWR(lowConf), totalPnL: pnl(lowConf) });
  if (highRR.length >= 5)   clusters.push({ name: 'Aggressive RR (2.5+)', description: 'High reward targets', trades: highRR.length, winRate: calcWR(highRR), totalPnL: pnl(highRR) });
  if (lowRR.length >= 5)    clusters.push({ name: 'Low RR (< 1.5)', description: 'Conservative targets', trades: lowRR.length, winRate: calcWR(lowRR), totalPnL: pnl(lowRR) });

  return clusters.sort((a, b) => b.totalPnL - a.totalPnL);
}

function detectEdgeDecay(entries: any[]): EdgeDecay | null {
  if (entries.length < 30) return null;
  const sorted = [...entries].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const calcWR = (arr: any[]) => { const w = arr.filter(e => e.result === 'win').length; const l = arr.filter(e => e.result === 'loss').length; return w + l > 0 ? Math.round((w/(w+l))*100) : 0; };
  const recent10 = sorted.slice(-10);
  const previous20 = sorted.slice(-30, -10);
  const recent10WR = calcWR(recent10);
  const previous20WR = calcWR(previous20);
  const drift = previous20WR - recent10WR;
  return { recent10WR, previous20WR, drift, detected: drift >= 15 };
}

function detectProfitLeaks(entries: any[], confluenceInsights: ConfluenceInsight[]): ProfitLeak[] {
  const leaks: ProfitLeak[] = [];
  const calcWR = (arr: any[]) => { const w = arr.filter(e => e.result === 'win').length; const l = arr.filter(e => e.result === 'loss').length; return w + l > 0 ? Math.round((w/(w+l))*100) : 0; };

  const lowRR = entries.filter(e => e.riskReward > 0 && e.riskReward < 2);
  const highRR = entries.filter(e => e.riskReward >= 2);
  if (lowRR.length >= 5 && highRR.length >= 5) {
    const lowWR = calcWR(lowRR);
    const highWR = calcWR(highRR);
    if (lowWR < highWR - 10) {
      const pnlLost = lowRR.filter(e => e.result === 'loss').reduce((s,e) => s + Math.abs(e.pnl || 0), 0);
      leaks.push({ description: `Trades with RR below 2.0 underperform by ${highWR - lowWR}%`, estimatedImpact: `Removing these trades would improve overall performance by reducing $${pnlLost.toFixed(0)} in losses`, trades: lowRR.length });
    }
  }

  confluenceInsights.filter(ci => ci.verdict === 'weak' && ci.withCount >= 5).forEach(ci => {
    leaks.push({ description: `${ci.name} reduces win rate by ${Math.abs(ci.impact)}%`, estimatedImpact: `Filtering out trades that rely solely on ${ci.name} would remove your weakest setup cluster`, trades: ci.withCount });
  });

  return leaks;
}

function buildPlaybook(entries: any[], confluenceInsights: ConfluenceInsight[], rrAnalysis: RRAnalysis | null, timeAnalysis: TimeAnalysis | null): Playbook | null {
  const rules: string[] = [];
  const calcWR = (arr: any[]) => { const w = arr.filter(e => e.result === 'win').length; const l = arr.filter(e => e.result === 'loss').length; return w + l > 0 ? Math.round((w/(w+l))*100) : 0; };

  const strongConfs = confluenceInsights.filter(ci => ci.verdict === 'strong').slice(0, 3);
  strongConfs.forEach(ci => rules.push(`Require ${ci.name} before entry (${ci.withWinRate}% WR)`));

  if (rrAnalysis) rules.push(`Only take trades with RR ≥ ${rrAnalysis.bestRange.replace('RR ', '').split('–')[0] || '2.0'}`);
  if (timeAnalysis) rules.push(`Focus on ${timeAnalysis.bestSession} session (${timeAnalysis.bestWinRate}% WR)`);

  const weakConfs = confluenceInsights.filter(ci => ci.verdict === 'weak').slice(0, 2);
  weakConfs.forEach(ci => rules.push(`Do NOT trade when ${ci.name} is the only confirmation`));

  if (rules.length < 2) return null;

  const strongTrades = entries.filter(e =>
    strongConfs.some(ci => {
      const v = e.customFields?.[ci.name];
      return v === true || v === 'true' || (typeof v === 'string' && v.trim() !== '');
    })
  );
  const estWR = strongTrades.length >= 5 ? calcWR(strongTrades) : calcWR(entries);
  const confidence: 'High' | 'Medium' | 'Low' = entries.length >= 50 ? 'High' : entries.length >= 20 ? 'Medium' : 'Low';

  return { rules, estimatedWinRate: estWR, confidence };
}

function buildRecs(entries: any[], best: SetupPerformance | null, worst: SetupPerformance | null, leaks: BehaviorInsight[], rr: RRAnalysis | null, time: TimeAnalysis | null, gap: ExecutionGap | null): string[] {
  const recs: string[] = [];
  if (best && best.winRate >= 60) recs.push(`Double down on ${best.conditions.slice(0, 2).join(' + ')} — your ${best.winRate}% win rate here is your true edge. Only take trades that match this setup.`);
  if (worst && worst.winRate <= 40 && worst !== best) recs.push(`Eliminate ${worst.conditions.slice(0, 2).join(' + ')} from your playbook — this setup loses more than it wins at ${worst.winRate}%.`);
  if (rr) recs.push(`Optimal risk:reward is ${rr.bestRange} (${rr.bestWinRate}% win rate). Raise your minimum RR threshold and stop taking sub-optimal setups.`);
  if (time) recs.push(`Trade primarily during ${time.bestSession} (${time.bestWinRate}% win rate). Avoid ${time.worstSession} (${time.worstWinRate}% win rate).`);
  leaks.forEach(leak => {
    if (leak.behavior === 'Checklist Completion' && leak.impact > 10) recs.push(`Your checklist gives you a ${leak.impact}% edge. Treat it as non-negotiable — no checklist, no trade.`);
    if (leak.behavior === 'Emotional State' && leak.impact > 10) recs.push(`Stop trading after 2 consecutive losses. Emotional trades are costing you ${leak.impact}% in win rate.`);
    if (leak.behavior === 'Rule Adherence' && leak.impact > 10) recs.push(`Rule violations are your #1 performance killer — ${leak.impact}% lower win rate when you break them. Simplify your rules if they're hard to follow consistently.`);
  });
  if (gap && gap.gap < -15) recs.push(`Your strategy is proven in backtesting — close the ${Math.abs(gap.gap)}% execution gap by journaling every rule you break in live trading.`);
  return recs;
}

// ─── NEW: Confidence level based on sample size ───────────────────────────────
function getConfidenceLevel(trades: number): 'High' | 'Medium' | 'Low' {
  if (trades >= 15) return 'High';
  if (trades >= 5) return 'Medium';
  return 'Low';
}

const CONFIDENCE_TOOLTIP = 'Confidence is based on number of trades in this sample.';

// ─── NEW: Expectancy Per Trade ────────────────────────────────────────────────
function calcExpectancy(entries: any[]): Expectancy | null {
  const wins = entries.filter(e => e.result === 'win');
  const losses = entries.filter(e => e.result === 'loss');
  if (wins.length < 3 || losses.length < 3) return null;
  const avgWin = wins.reduce((s, e) => s + Math.abs(e.pnl || e.riskReward || 1), 0) / wins.length;
  const avgLoss = losses.reduce((s, e) => s + Math.abs(e.pnl || 1), 0) / losses.length;
  const winRate = wins.length / (wins.length + losses.length);
  const lossRate = 1 - winRate;
  const value = parseFloat(((winRate * avgWin) - (lossRate * avgLoss)).toFixed(2));
  return { value, avgWin: parseFloat(avgWin.toFixed(2)), avgLoss: parseFloat(avgLoss.toFixed(2)), winRate, lossRate };
}

// ─── NEW: Consistency Score ───────────────────────────────────────────────────
function calcConsistencyScore(entries: any[]): ConsistencyScore | null {
  const rrValues = entries.filter(e => e.riskReward > 0).map(e => e.riskReward);
  if (rrValues.length < 5) return null;
  const mean = rrValues.reduce((s, v) => s + v, 0) / rrValues.length;
  const variance = rrValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / rrValues.length;
  const stdDev = Math.sqrt(variance);
  // Normalize: low stdDev = high consistency. Cap at mean*2 for normalization
  const maxAcceptable = Math.max(mean * 2, 1);
  const rawScore = Math.max(0, 100 - (stdDev / maxAcceptable) * 100);
  const score = Math.min(100, Math.round(rawScore));
  const insight = score >= 75
    ? 'High consistency — your results are repeatable. This is a genuine edge, not luck.'
    : score >= 50
    ? 'Moderate consistency — some variance in outcomes. Tighten your entry criteria to stabilize results.'
    : 'Low consistency — highly variable results suggest random performance. Focus on one setup before expanding.';
  return { score, stdDev: parseFloat(stdDev.toFixed(2)), insight };
}

// ─── NEW: Contradiction Detection ─────────────────────────────────────────────
function detectContradictions(entries: any[], rrAnalysis: RRAnalysis | null, timeAnalysis: TimeAnalysis | null, confluenceInsights: ConfluenceInsight[]): ContradictionInsight[] {
  const contradictions: ContradictionInsight[] = [];
  const calcWR = (arr: any[]) => { const w = arr.filter(e => e.result === 'win').length; const l = arr.filter(e => e.result === 'loss').length; return w + l > 0 ? Math.round((w/(w+l))*100) : 0; };

  // High RR trades — check if they only work in certain sessions
  if (rrAnalysis && timeAnalysis) {
    const fields = storage.getJournalFields();
    const timeField = fields.find((f: any) => f.type === 'time' || f.name.toLowerCase().includes('time'));
    if (timeField) {
      const highRR = entries.filter(e => e.riskReward >= 2.5);
      const bestHour = timeAnalysis.bestSession.match(/(\d+)/)?.[1];
      if (highRR.length >= 5 && bestHour) {
        const highRRInBestSession = highRR.filter(e => {
          const t = e.customFields?.[timeField.name];
          if (!t) return false;
          return parseInt(String(t).split(':')[0]) >= parseInt(bestHour) && parseInt(String(t).split(':')[0]) < parseInt(bestHour) + 2;
        });
        const highRROutside = highRR.filter(e => !highRRInBestSession.includes(e));
        if (highRRInBestSession.length >= 3 && highRROutside.length >= 3) {
          const inWR = calcWR(highRRInBestSession);
          const outWR = calcWR(highRROutside);
          if (inWR - outWR >= 20) {
            contradictions.push({
              description: 'High RR only works in specific session',
              detail: `High RR trades perform best ONLY during ${timeAnalysis.bestSession} (${inWR}% WR). Outside this window, performance drops to ${outWR}%. Don't take high-RR trades outside your best session.`,
            });
          }
        }
      }
    }
  }

  // Confluence that only works with another confluence
  if (confluenceInsights.length >= 2) {
    const strong = confluenceInsights.filter(ci => ci.verdict === 'strong');
    const weak = confluenceInsights.filter(ci => ci.verdict === 'weak');
    strong.forEach(s => {
      weak.forEach(w => {
        const both = entries.filter(e => {
          const sv = e.customFields?.[s.name];
          const wv = e.customFields?.[w.name];
          return (sv === true || sv === 'true' || (typeof sv === 'string' && sv.trim() !== ''))
            && (wv === true || wv === 'true' || (typeof wv === 'string' && wv.trim() !== ''));
        });
        if (both.length >= 3 && calcWR(both) < s.withWinRate - 15) {
          contradictions.push({
            description: `${s.name} edge cancels when combined with ${w.name}`,
            detail: `${s.name} alone gives ${s.withWinRate}% WR, but combined with ${w.name} performance drops significantly. Avoid taking trades that require both conditions simultaneously.`,
          });
        }
      });
    });
  }

  return contradictions.slice(0, 3);
}

// ─── NEW: What-If Simulator ────────────────────────────────────────────────────
function runWhatIfSimulation(entries: any[], rrAnalysis: RRAnalysis | null): WhatIfResult | null {
  if (entries.length < 10) return null;
  const calcWR = (arr: any[]) => { const w = arr.filter(e => e.result === 'win').length; const l = arr.filter(e => e.result === 'loss').length; return w + l > 0 ? Math.round((w/(w+l))*100) : 0; };
  const calcPnL = (arr: any[]) => arr.reduce((s, e) => s + (e.pnl || 0), 0);

  // Find best filter: remove trades below optimal RR
  const minRR = rrAnalysis ? parseFloat(rrAnalysis.bestRange.replace('RR ', '').split('–')[0].replace('+', '') || '2') : 2;
  const filtered = entries.filter(e => !e.riskReward || e.riskReward >= minRR);
  const removed = entries.filter(e => e.riskReward > 0 && e.riskReward < minRR);

  if (filtered.length < 5 || removed.length < 3) return null;

  const originalWR = calcWR(entries);
  const simulatedWR = calcWR(filtered);
  const originalPnL = calcPnL(entries);
  const simulatedPnL = calcPnL(filtered);
  const improvement = simulatedPnL - originalPnL;

  return {
    originalWinRate: originalWR,
    simulatedWinRate: simulatedWR,
    originalPnL: parseFloat(originalPnL.toFixed(0)),
    simulatedPnL: parseFloat(simulatedPnL.toFixed(0)),
    improvement: parseFloat(improvement.toFixed(0)),
    tradesRemoved: removed.length,
    filterApplied: `Remove trades with RR < ${minRR}`,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AIAnalytics() {
  const navigate = useNavigate();
  const isPremium = storage.isPremium();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [dataMode, setDataMode] = useState<'live' | 'backtesting'>('live');
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [strictMode, setStrictMode] = useState(false); // NEW: Playbook strict mode
  const currentUser = storage.getCurrentUser();

  // FIX: runAnalysis with safety checks — null user guard, proper state updates, loading indicator
  const runAnalysis = () => {
    // FIX: Safety check — ensure user exists before running
    if (!currentUser) {
      console.error('No user found, cannot run analysis');
      return;
    }

    // FIX: Set loading state immediately so button shows "Analysing..."
    setIsAnalyzing(true);
    setResults(null); // FIX: Clear previous results

    setTimeout(() => {
      try {
        // FIX: Safe data loading with fallback to empty arrays
        const live = storage.getJournalEntries().filter((e: any) => e.userId === currentUser.id) || [];
        const bt = (storage as any).getBacktestingEntries?.()?.filter((e: any) => e.userId === currentUser.id) ?? [];
        const entries = dataMode === 'live' ? live : bt;

        // FIX: Ensure entries is a valid array
        if (!Array.isArray(entries) || entries.length === 0) {
          setResults({
            dataMode, totalTrades: 0, overallWinRate: 0, winCount: 0, lossCount: 0, avgRR: 0,
            bestSetup: null, worstSetup: null, behaviorLeaks: [], rrAnalysis: null, timeAnalysis: null,
            executionGap: null, confluenceInsights: [], edgeScores: [], avoidPatterns: [], clusters: [],
            edgeDecay: null, profitLeaks: [], playbook: null, recommendations: [], hasMinimumData: false,
            expectancy: null, consistencyScore: null, contradictions: [], whatIf: null,
          });
          setIsAnalyzing(false);
          return;
        }

        if (entries.length < 10) {
          setResults({
            dataMode, totalTrades: entries.length, overallWinRate: 0, winCount: 0, lossCount: 0, avgRR: 0,
            bestSetup: null, worstSetup: null, behaviorLeaks: [], rrAnalysis: null, timeAnalysis: null,
            executionGap: null, confluenceInsights: [], edgeScores: [], avoidPatterns: [], clusters: [],
            edgeDecay: null, profitLeaks: [], playbook: null, recommendations: [], hasMinimumData: false,
            expectancy: null, consistencyScore: null, contradictions: [], whatIf: null,
          });
          setIsAnalyzing(false);
          return;
        }

        const wins = entries.filter((e: any) => e.result === 'win').length;
        const losses = entries.filter((e: any) => e.result === 'loss').length;
        const rrEntries = entries.filter((e: any) => e.riskReward > 0);
        const avgRR = rrEntries.length > 0 ? rrEntries.reduce((s: number, e: any) => s + e.riskReward, 0) / rrEntries.length : 0;

        const { bestSetup, worstSetup } = analyzeBestWorstSetups(entries);
        const behaviorLeaks = analyzeBehavior(entries);
        const rrAnalysis = analyzeRR(entries);
        const timeAnalysis = analyzeTime(entries);
        const executionGap = calcExecutionGap(live, bt);
        const confluenceInsights = analyzeNamedConfluences(entries);
        const edgeScores = buildEdgeScores(confluenceInsights);
        const avoidPatterns = buildAvoidPatterns(entries, confluenceInsights, rrAnalysis);
        const clusters = buildClusters(entries);
        const edgeDecay = detectEdgeDecay(entries);
        const profitLeaks = detectProfitLeaks(entries, confluenceInsights);
        const playbook = buildPlaybook(entries, confluenceInsights, rrAnalysis, timeAnalysis);
        const recommendations = buildRecs(entries, bestSetup, worstSetup, behaviorLeaks, rrAnalysis, timeAnalysis, executionGap);
        // NEW: Additional enhanced metrics
        const expectancy = calcExpectancy(entries);
        const consistencyScore = calcConsistencyScore(entries);
        const contradictions = detectContradictions(entries, rrAnalysis, timeAnalysis, confluenceInsights);
        const whatIf = runWhatIfSimulation(entries, rrAnalysis);

        // FIX: Set results — this triggers the UI to render
        setResults({
          dataMode,
          totalTrades: entries.length,
          overallWinRate: wins + losses > 0 ? Math.round(wins / (wins + losses) * 100) : 0,
          winCount: wins,
          lossCount: losses,
          avgRR: parseFloat(avgRR.toFixed(2)),
          bestSetup, worstSetup, behaviorLeaks, rrAnalysis, timeAnalysis, executionGap,
          confluenceInsights, edgeScores, avoidPatterns, clusters, edgeDecay, profitLeaks, playbook,
          recommendations, hasMinimumData: true,
          // NEW
          expectancy, consistencyScore, contradictions, whatIf,
        });
      } catch (err) {
        console.error('Analysis error:', err);
        // FIX: Don't silently fail — show empty state
        setResults(null);
      } finally {
        // FIX: Always clear loading state
        setIsAnalyzing(false);
      }
    }, 800);
  };

  // Paywall
  if (!isPremium) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <PremiumUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={() => {
            storage.upgradeToPremium();
            setShowUpgradeModal(false);
            navigate('/premium');
          }}
          feature="AI Strategy Performance Coach"
        />
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2"><Brain className="w-8 h-8 text-purple-500" />AI Strategy Coach</h1>
          <p className="text-muted-foreground">Deep pattern analysis to refine your edge</p>
        </div>
        <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardContent className="py-16 text-center space-y-4">
            <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto"><Lock className="w-8 h-8 text-purple-500" /></div>
            <h2 className="text-2xl font-bold">Premium Feature</h2>
            <p className="text-muted-foreground max-w-md mx-auto">AI coaching that detects which setups win, which lose, when you trade best, and what behaviours are costing you money.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto text-left mt-6">
              {['Best setup detection', 'RR optimisation', 'Time-of-day analysis', 'Behaviour leak detection', 'Rule violation patterns', 'Backtest vs live gap'].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-purple-500 flex-shrink-0" />{f}</div>
              ))}
            </div>
            <Button size="lg" className="mt-4 bg-purple-600 hover:bg-purple-700" onClick={() => setShowUpgradeModal(true)}>Unlock AI Coach<ChevronRight className="w-4 h-4 ml-2" /></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl pb-24">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-1"><Brain className="w-8 h-8 text-purple-500" />AI Strategy Coach</h1>
        <p className="text-muted-foreground">Finds what actually makes you profitable</p>
      </div>

      {/* Mode + Run */}
      <Card className="mb-6">
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold mb-2">Dataset to Analyse</p>
              <div className="flex gap-2">
                {(['live', 'backtesting'] as const).map(mode => (
                  <button key={mode} onClick={() => { setDataMode(mode); setResults(null); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${dataMode === mode ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'border-border text-muted-foreground hover:border-purple-500/40'}`}>
                    {mode === 'live' ? '📈 Live Trading' : '🔬 Backtesting'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Datasets are kept separate — AI will not mix live and backtesting data.</p>
            </div>
            {/* FIX: Button directly calls runAnalysis() with no intermediate logic */}
            <Button onClick={runAnalysis} disabled={isAnalyzing} className="bg-purple-600 hover:bg-purple-700 min-w-36" size="lg">
              {isAnalyzing
                ? <span className="flex items-center gap-2"><Activity className="w-4 h-4 animate-pulse" />Analysing...</span>
                : <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" />Run Analysis</span>
              }
            </Button>
          </div>
        </CardContent>
      </Card>

      {!results && !isAnalyzing && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
            <h3 className="text-lg font-semibold mb-2">Ready to Coach You</h3>
            <p className="text-sm text-muted-foreground">Select a dataset and run the analysis. Minimum 10 trades required.</p>
          </CardContent>
        </Card>
      )}

      {results && !results.hasMinimumData && (
        <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>Only {results.totalTrades} {dataMode} trade{results.totalTrades !== 1 ? 's' : ''} found. At least 10 are required. Keep journaling!</AlertDescription></Alert>
      )}

      {results && results.hasMinimumData && (
        <div className="space-y-6">

          {/* Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Trades Analysed', value: results.totalTrades, icon: BarChart3, color: 'text-blue-500' },
              { label: 'Overall Win Rate', value: `${results.overallWinRate}%`, icon: Target, color: results.overallWinRate >= 50 ? 'text-green-500' : 'text-red-500' },
              { label: 'Wins / Losses', value: `${results.winCount} / ${results.lossCount}`, icon: Activity, color: 'text-purple-500' },
              { label: 'Avg R:R', value: results.avgRR > 0 ? `${results.avgRR}` : '—', icon: TrendingUp, color: 'text-amber-500' },
            ].map(stat => { const Icon = stat.icon; return (
              <Card key={stat.label}><CardContent className="pt-4 pb-4"><Icon className={`w-5 h-5 ${stat.color} mb-2`} /><p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p><p className="text-xs text-muted-foreground mt-1">{stat.label}</p></CardContent></Card>
            ); })}
          </div>

          {/* NEW: Expectancy + Consistency row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Expectancy */}
            {results.expectancy ? (
              <Card className={`border-2 ${results.expectancy.value >= 0 ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sigma className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold">Expected Profit Per Trade</h3>
                    <span className="text-xs text-muted-foreground ml-auto" title="Top 1% trader metric">🏆 Elite Metric</span>
                  </div>
                  <div className={`text-4xl font-bold mb-1 ${results.expectancy.value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {results.expectancy.value >= 0 ? '+' : ''}${results.expectancy.value}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">per trade on average</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-background"><span className="text-muted-foreground">Avg Win: </span><span className="font-bold text-green-600">${results.expectancy.avgWin}</span></div>
                    <div className="p-2 rounded bg-background"><span className="text-muted-foreground">Avg Loss: </span><span className="font-bold text-red-600">${results.expectancy.avgLoss}</span></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {results.expectancy.value > 0
                      ? `Positive expectancy — your edge is mathematically real. Every trade you take should average +$${results.expectancy.value}.`
                      : `Negative expectancy — you are losing money on average per trade. Fix this before scaling size.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-dashed">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Sigma className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-bold text-muted-foreground">Expected Profit Per Trade</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Not enough data yet — keep trading to unlock this insight.</p>
                </CardContent>
              </Card>
            )}

            {/* Consistency Score */}
            {results.consistencyScore ? (
              <Card className={`border-2 ${results.consistencyScore.score >= 75 ? 'border-green-500/30 bg-green-500/5' : results.consistencyScore.score >= 50 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Gauge className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold">Consistency Score</h3>
                  </div>
                  <div className={`text-4xl font-bold mb-1 ${results.consistencyScore.score >= 75 ? 'text-green-500' : results.consistencyScore.score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {results.consistencyScore.score}%
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mb-3">
                    <div className={`h-2 rounded-full transition-all ${results.consistencyScore.score >= 75 ? 'bg-green-500' : results.consistencyScore.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${results.consistencyScore.score}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">{results.consistencyScore.insight}</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-dashed">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-bold text-muted-foreground">Consistency Score</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Not enough data yet — keep trading to unlock this insight.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* NEW: Expectancy + Consistency Row */}
          {(results.expectancy || results.consistencyScore) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Expectancy */}
              {results.expectancy && (
                <Card className="border-2 border-purple-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Sigma className="w-4 h-4 text-purple-500" />
                      Expected Profit Per Trade
                      <span className="text-xs text-muted-foreground font-normal ml-auto" title={CONFIDENCE_TOOLTIP}>
                        {getConfidenceLevel(results.winCount + results.lossCount)} confidence
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-4xl font-bold mb-2 ${results.expectancy.value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {results.expectancy.value >= 0 ? '+' : ''}{results.expectancy.value >= 0 && results.expectancy.avgWin > 10
                        ? `$${results.expectancy.value.toFixed(0)}`
                        : `${results.expectancy.value.toFixed(2)}R`}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="p-2 rounded bg-green-500/10">
                        <p className="text-muted-foreground">Avg Win</p>
                        <p className="font-bold text-green-600">{results.expectancy.avgWin > 10 ? `$${results.expectancy.avgWin.toFixed(0)}` : `${results.expectancy.avgWin.toFixed(2)}R`}</p>
                      </div>
                      <div className="p-2 rounded bg-red-500/10">
                        <p className="text-muted-foreground">Avg Loss</p>
                        <p className="font-bold text-red-600">{results.expectancy.avgLoss > 10 ? `$${results.expectancy.avgLoss.toFixed(0)}` : `${results.expectancy.avgLoss.toFixed(2)}R`}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {results.expectancy.value > 0
                        ? `Positive expectancy — on average you make money on every trade you take.`
                        : `Negative expectancy — you lose money on average per trade. Fix your win rate or RR before scaling size.`}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Consistency Score */}
              {results.consistencyScore && (
                <Card className="border-2 border-blue-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Gauge className="w-4 h-4 text-blue-500" />
                      Consistency Score
                      <span className="text-xs text-muted-foreground font-normal ml-auto" title={CONFIDENCE_TOOLTIP}>
                        {getConfidenceLevel(results.totalTrades)} confidence
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-3">
                      <div className={`text-4xl font-bold ${results.consistencyScore.score >= 75 ? 'text-green-500' : results.consistencyScore.score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {results.consistencyScore.score}%
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div className={`h-2.5 rounded-full transition-all ${results.consistencyScore.score >= 75 ? 'bg-green-500' : results.consistencyScore.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${results.consistencyScore.score}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">R:R std dev: {results.consistencyScore.stdDev}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{results.consistencyScore.insight}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* NEW: Contradiction Detection */}
          {results.contradictions && results.contradictions.length > 0 && (
            <Card className="border-2 border-yellow-500/30 bg-yellow-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><GitMerge className="w-5 h-5 text-yellow-600" />Conflicting Edge Detected</CardTitle>
                <CardDescription>Your data contains contradictions that may be costing you money</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {results.contradictions.map((c, i) => (
                  <div key={i} className="p-4 rounded-xl bg-background border border-yellow-500/20">
                    <p className="font-semibold text-sm text-yellow-700 dark:text-yellow-400 mb-1">⚡ {c.description}</p>
                    <p className="text-sm text-muted-foreground">{c.detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* NEW: What-If Simulator */}
          {results.whatIf && (
            <Card className="border-2 border-indigo-500/30 bg-indigo-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FlaskConical className="w-5 h-5 text-indigo-500" />What If You Followed Your Rules?</CardTitle>
                <CardDescription>Simulates your performance after removing your weakest trade type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-3 rounded-lg bg-background border border-indigo-500/20 mb-4">
                  <p className="text-xs text-muted-foreground mb-1">Filter Applied</p>
                  <p className="font-semibold text-sm">{results.whatIf.filterApplied}</p>
                  <p className="text-xs text-muted-foreground mt-1">{results.whatIf.tradesRemoved} trades removed from simulation</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-4 rounded-xl bg-muted text-center">
                    <p className="text-xs text-muted-foreground mb-1">Actual Results</p>
                    <p className="text-2xl font-bold">{results.whatIf.originalWinRate}%</p>
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                    {results.whatIf.originalPnL !== 0 && (
                      <p className={`text-sm font-bold mt-1 ${results.whatIf.originalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {results.whatIf.originalPnL >= 0 ? '+' : ''}${results.whatIf.originalPnL.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Simulated Results</p>
                    <p className="text-2xl font-bold text-indigo-600">{results.whatIf.simulatedWinRate}%</p>
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                    {results.whatIf.simulatedPnL !== 0 && (
                      <p className={`text-sm font-bold mt-1 ${results.whatIf.simulatedPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {results.whatIf.simulatedPnL >= 0 ? '+' : ''}${results.whatIf.simulatedPnL.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                {results.whatIf.improvement !== 0 && (
                  <div className={`p-4 rounded-xl border ${results.whatIf.improvement > 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <p className={`font-bold text-sm ${results.whatIf.improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {results.whatIf.improvement > 0
                        ? `✓ Following your playbook would have improved profits by $${results.whatIf.improvement.toLocaleString()}`
                        : `The filtered trades actually helped — reconsider removing them`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Best Setup */}
          {results.bestSetup && (
            <Card className="border-2 border-green-500/30 bg-green-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400"><Trophy className="w-5 h-5" />Best Performing Setup</CardTitle>
                <CardDescription>Your highest-edge combination</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">{results.bestSetup.conditions.map((c, i) => <Badge key={i} className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30">{c}</Badge>)}</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[{ l: 'Win Rate', v: `${results.bestSetup.winRate}%`, h: true }, { l: 'Trades', v: results.bestSetup.tradesAnalyzed }, { l: 'Profit Factor', v: `${results.bestSetup.profitFactor}x` }, { l: 'Avg R:R', v: results.bestSetup.avgRR > 0 ? results.bestSetup.avgRR : '—' }].map(s => (
                    <div key={s.l} className="p-3 rounded-lg bg-background"><p className={`text-2xl font-bold ${s.h ? 'text-green-500' : ''}`}>{s.v}</p><p className="text-xs text-muted-foreground">{s.l}</p></div>
                  ))}
                </div>
                <div className="p-4 rounded-lg bg-background border"><div className="flex gap-3"><Lightbulb className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" /><div><p className="text-xs font-bold text-muted-foreground mb-1">COACHING INSIGHT</p><p className="text-sm leading-relaxed">{results.bestSetup.insight}</p></div></div></div>
              </CardContent>
            </Card>
          )}

          {/* Worst Setup */}
          {results.worstSetup && results.worstSetup !== results.bestSetup && (
            <Card className="border-2 border-red-500/30 bg-red-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400"><TrendingDown className="w-5 h-5" />Worst Performing Pattern</CardTitle>
                <CardDescription>What's costing you the most</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">{results.worstSetup.conditions.map((c, i) => <Badge key={i} className="bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30">{c}</Badge>)}</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[{ l: 'Win Rate', v: `${results.worstSetup.winRate}%`, h: true }, { l: 'Trades', v: results.worstSetup.tradesAnalyzed }, { l: 'Profit Factor', v: `${results.worstSetup.profitFactor}x` }, { l: 'Avg R:R', v: results.worstSetup.avgRR > 0 ? results.worstSetup.avgRR : '—' }].map(s => (
                    <div key={s.l} className="p-3 rounded-lg bg-background"><p className={`text-2xl font-bold ${s.h ? 'text-red-500' : ''}`}>{s.v}</p><p className="text-xs text-muted-foreground">{s.l}</p></div>
                  ))}
                </div>
                <div className="p-4 rounded-lg bg-background border"><div className="flex gap-3"><AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" /><div><p className="text-xs font-bold text-muted-foreground mb-1">COACHING INSIGHT</p><p className="text-sm leading-relaxed">{results.worstSetup.insight}</p></div></div></div>
              </CardContent>
            </Card>
          )}

          {/* RR Optimisation */}
          {results.rrAnalysis && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-blue-500" />R:R Optimisation</CardTitle>
                    <CardDescription>Where your edge is strongest by risk:reward</CardDescription>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getConfidenceLevel(results.rrAnalysis.bestTrades) === 'High' ? 'bg-green-500/20 text-green-600' : getConfidenceLevel(results.rrAnalysis.bestTrades) === 'Medium' ? 'bg-yellow-500/20 text-yellow-600' : 'bg-muted text-muted-foreground'}`}
                    title={CONFIDENCE_TOOLTIP}>
                    {getConfidenceLevel(results.rrAnalysis.bestTrades)} confidence
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20"><p className="text-xs text-muted-foreground mb-1">Best R:R Range</p><p className="text-xl font-bold text-green-600">{results.rrAnalysis.bestRange}</p><p className="text-2xl font-bold text-green-500 mt-1">{results.rrAnalysis.bestWinRate}%</p><p className="text-xs text-muted-foreground">{results.rrAnalysis.bestTrades} trades</p></div>
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20"><p className="text-xs text-muted-foreground mb-1">Weakest R:R Range</p><p className="text-xl font-bold text-red-600">{results.rrAnalysis.worstRange}</p><p className="text-2xl font-bold text-red-500 mt-1">{results.rrAnalysis.worstWinRate}%</p></div>
                </div>
                <div className="p-4 rounded-lg bg-muted"><div className="flex gap-3"><Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" /><p className="text-sm leading-relaxed">{results.rrAnalysis.insight}</p></div></div>
              </CardContent>
            </Card>
          )}

          {/* Time of Day */}
          {results.timeAnalysis && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-amber-500" />Time-of-Day Performance</CardTitle><CardDescription>When you trade best and worst</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20"><p className="text-xs text-muted-foreground mb-1">Best Window</p><p className="font-bold text-green-600 text-sm">{results.timeAnalysis.bestSession}</p><p className="text-2xl font-bold text-green-500 mt-1">{results.timeAnalysis.bestWinRate}%</p></div>
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20"><p className="text-xs text-muted-foreground mb-1">Weakest Window</p><p className="font-bold text-red-600 text-sm">{results.timeAnalysis.worstSession}</p><p className="text-2xl font-bold text-red-500 mt-1">{results.timeAnalysis.worstWinRate}%</p></div>
                </div>
                <div className="p-4 rounded-lg bg-muted"><div className="flex gap-3"><Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" /><p className="text-sm leading-relaxed">{results.timeAnalysis.insight}</p></div></div>
              </CardContent>
            </Card>
          )}

          {/* Behaviour Leaks */}
          {results.behaviorLeaks.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-orange-500" />Behaviour Coaching</CardTitle><CardDescription>Discipline patterns that affect your profitability</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {results.behaviorLeaks.map((leak, i) => (
                  <div key={i} className={`p-4 rounded-lg border-2 ${Math.abs(leak.impact) >= 15 ? 'border-orange-500/30 bg-orange-500/5' : 'border-border bg-muted/30'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold">{leak.behavior}</h4>
                      <Badge className={`${leak.impact > 0 ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'} font-bold`}>{leak.impact > 0 ? '+' : ''}{leak.impact}% impact</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className={`p-3 rounded-lg ${leak.impact > 0 ? 'bg-green-500/10 border border-green-500/20' : 'bg-background'}`}><div className="flex items-center gap-1 mb-1"><CheckCircle2 className="w-3 h-3 text-green-500" /><span className="text-xs">With</span></div><p className="text-2xl font-bold">{leak.withBehavior.winRate}%</p><p className="text-xs text-muted-foreground">{leak.withBehavior.trades} trades</p></div>
                      <div className={`p-3 rounded-lg ${leak.impact < 0 ? 'bg-green-500/10 border border-green-500/20' : 'bg-background'}`}><div className="flex items-center gap-1 mb-1"><XCircle className="w-3 h-3 text-red-500" /><span className="text-xs">Without</span></div><p className="text-2xl font-bold">{leak.withoutBehavior.winRate}%</p><p className="text-xs text-muted-foreground">{leak.withoutBehavior.trades} trades</p></div>
                    </div>
                    <div className="p-3 rounded-lg bg-background border"><div className="flex gap-2"><Brain className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" /><p className="text-sm leading-relaxed">{leak.insight}</p></div></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Execution Gap */}
          {results.executionGap && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-purple-500" />Execution Gap — Backtest vs Live</CardTitle><CardDescription>How closely your live trading mirrors your strategy</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-background border"><p className="text-sm text-muted-foreground mb-1">Backtesting</p><p className="text-3xl font-bold text-blue-500">{results.executionGap.backtestingWinRate}%</p><p className="text-xs text-muted-foreground">{results.executionGap.backtestingTrades} trades</p></div>
                  <div className="p-4 rounded-lg bg-background border"><p className="text-sm text-muted-foreground mb-1">Live Trading</p><p className="text-3xl font-bold text-green-500">{results.executionGap.liveWinRate}%</p><p className="text-xs text-muted-foreground">{results.executionGap.liveTrades} trades</p></div>
                </div>
                <div className={`p-4 rounded-lg border-2 ${Math.abs(results.executionGap.gap) >= 15 ? 'border-red-500/30 bg-red-500/5' : Math.abs(results.executionGap.gap) >= 5 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-green-500/30 bg-green-500/5'}`}>
                  <p className="text-sm text-muted-foreground mb-1">Gap</p>
                  <p className={`text-3xl font-bold ${results.executionGap.gap > 0 ? 'text-green-500' : 'text-red-500'}`}>{results.executionGap.gap > 0 ? '+' : ''}{results.executionGap.gap}%</p>
                </div>
                <div className="p-4 rounded-lg bg-muted"><div className="flex gap-3"><Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" /><p className="text-sm leading-relaxed">{results.executionGap.insight}</p></div></div>
              </CardContent>
            </Card>
          )}

          {/* Confluence Insights */}
          {results.confluenceInsights && results.confluenceInsights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-blue-500" />Confluence Analysis</CardTitle>
                <CardDescription>Win rate impact of each condition — data-driven, not assumptions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.confluenceInsights.filter(c => c.verdict === 'strong').length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">✅ Best Performing Conditions</p>
                    <div className="space-y-2">
                      {results.confluenceInsights.filter(c => c.verdict === 'strong').map((ci, i) => (
                        <div key={i} className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm">{ci.name}</span>
                            <div className="flex gap-2 text-xs">
                              <span className="text-green-600 font-bold">With: {ci.withWinRate}%</span>
                              <span className="text-muted-foreground">Without: {ci.withoutWinRate}%</span>
                              <span className="text-green-600 font-bold">+{ci.impact}% edge</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{ci.insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.confluenceInsights.filter(c => c.verdict === 'weak').length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">⚠️ Weak Conditions</p>
                    <div className="space-y-2">
                      {results.confluenceInsights.filter(c => c.verdict === 'weak').map((ci, i) => (
                        <div key={i} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm">{ci.name}</span>
                            <div className="flex gap-2 text-xs">
                              <span className="text-red-600 font-bold">With: {ci.withWinRate}%</span>
                              <span className="text-muted-foreground">Without: {ci.withoutWinRate}%</span>
                              <span className="text-red-600 font-bold">{ci.impact}% impact</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{ci.insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.confluenceInsights.filter(c => c.verdict === 'neutral').length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">📊 Neutral — Still Building Sample</p>
                    <div className="grid grid-cols-2 gap-2">
                      {results.confluenceInsights.filter(c => c.verdict === 'neutral').map((ci, i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/50 border">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm truncate">{ci.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">{ci.withWinRate}% WR</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{ci.withCount} trades tracked</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Edge Score Table */}
          {results.edgeScores && results.edgeScores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-500" />Setup Quality Scores</CardTitle>
                <CardDescription>Edge score per condition — confidence based on sample size. Hover confidence badge for details.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.edgeScores.map((es, i) => {
                    // NEW: Minimum data filter — hide insights with < 3 trades
                    if (es.trades < 3) return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 opacity-60">
                        <div className="w-6 text-xs text-muted-foreground font-bold">{i + 1}</div>
                        <div className="flex-1">
                          <span className="text-sm font-medium">{es.name}</span>
                          <span className="text-xs text-muted-foreground ml-3">Not enough data yet — keep trading to unlock this insight.</span>
                        </div>
                      </div>
                    );
                    const dataConfidence = getConfidenceLevel(es.trades);
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-6 text-xs text-muted-foreground font-bold">{i + 1}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm">{es.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{es.winRate}% WR · {es.trades} trades</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-help ${dataConfidence === 'High' ? 'bg-green-500/20 text-green-600' : dataConfidence === 'Medium' ? 'bg-yellow-500/20 text-yellow-600' : 'bg-muted text-muted-foreground'}`}
                                title={CONFIDENCE_TOOLTIP}>
                                {dataConfidence}
                              </span>
                              <span className={`font-bold text-sm ${es.score >= 7 ? 'text-green-500' : es.score >= 5 ? 'text-yellow-500' : 'text-red-500'}`}>{es.score}/10</span>
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${es.score >= 7 ? 'bg-green-500' : es.score >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${es.score * 10}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Avoid Patterns */}
          {results.avoidPatterns && results.avoidPatterns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><XCircle className="w-5 h-5 text-red-500" />Trades You Should Stop Taking</CardTitle>
                <CardDescription>Patterns your data shows are consistently unprofitable</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {results.avoidPatterns.map((ap, i) => (
                  <div key={i} className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{ap.description}</span>
                      <div className="flex gap-2 text-xs">
                        <span className="text-red-500 font-bold">{ap.winRate}% WR</span>
                        <span className="text-muted-foreground">{ap.trades} trades</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{ap.recommendation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Performance Clusters */}
          {results.clusters && results.clusters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-blue-500" />Performance Clusters</CardTitle>
                <CardDescription>How your trades group by type — which cluster makes money</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {results.clusters.map((cl, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${cl.totalPnL >= 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{cl.name}</p>
                        <p className="text-xs text-muted-foreground">{cl.description} · {cl.trades} trades</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${cl.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>{cl.winRate}% WR</p>
                        {cl.totalPnL !== 0 && <p className={`text-xs font-medium ${cl.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>{cl.totalPnL >= 0 ? '+' : ''}${cl.totalPnL.toFixed(0)} P&L</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Edge Decay */}
          {results.edgeDecay && (
            <Card className={results.edgeDecay.detected ? 'border-2 border-orange-500/30' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingDown className="w-5 h-5 text-orange-500" />Edge Decay Detection</CardTitle>
                <CardDescription>Comparing recent 10 trades vs previous 20</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-xs text-muted-foreground mb-1">Last 10 Trades</p>
                    <p className={`text-2xl font-bold ${results.edgeDecay.recent10WR < results.edgeDecay.previous20WR - 10 ? 'text-red-500' : 'text-green-500'}`}>{results.edgeDecay.recent10WR}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-xs text-muted-foreground mb-1">Previous 20 Trades</p>
                    <p className="text-2xl font-bold text-blue-500">{results.edgeDecay.previous20WR}%</p>
                  </div>
                </div>
                {results.edgeDecay.detected ? (
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-sm font-semibold text-orange-600">⚠ Execution drift detected — {results.edgeDecay.drift}% drop in recent performance. Review your last 10 trades for rule violations or setup quality decline.</p>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-sm text-green-600">✓ Performance is consistent. No significant edge decay detected.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Profit Leaks */}
          {results.profitLeaks && results.profitLeaks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" />Profit Leak Detector</CardTitle>
                <CardDescription>Mistakes costing you money that your data reveals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {results.profitLeaks.map((pl, i) => (
                  <div key={i} className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                    <p className="font-semibold text-sm mb-1">{pl.description}</p>
                    <p className="text-xs text-muted-foreground">{pl.estimatedImpact}</p>
                    <p className="text-xs text-muted-foreground mt-1">{pl.trades} trades analyzed</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* NEW: What-If Simulator */}
          {results.whatIf && (
            <Card className="border-2 border-indigo-500/30 bg-indigo-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <FlaskConical className="w-5 h-5" />What If You Followed Your Rules?
                </CardTitle>
                <CardDescription>Simulation: {results.whatIf.filterApplied}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-background border">
                    <p className="text-xs text-muted-foreground mb-1">Actual (All Trades)</p>
                    <p className="text-2xl font-bold">{results.whatIf.originalWinRate}% WR</p>
                    {results.whatIf.originalPnL !== 0 && (
                      <p className={`text-sm font-medium ${results.whatIf.originalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {results.whatIf.originalPnL >= 0 ? '+' : ''}${results.whatIf.originalPnL} P&L
                      </p>
                    )}
                  </div>
                  <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Simulated (Rules Only)</p>
                    <p className="text-2xl font-bold text-indigo-600">{results.whatIf.simulatedWinRate}% WR</p>
                    {results.whatIf.simulatedPnL !== 0 && (
                      <p className={`text-sm font-medium ${results.whatIf.simulatedPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {results.whatIf.simulatedPnL >= 0 ? '+' : ''}${results.whatIf.simulatedPnL} P&L
                      </p>
                    )}
                  </div>
                </div>
                <div className={`p-4 rounded-lg border ${results.whatIf.improvement > 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-muted border-transparent'}`}>
                  <div className="flex items-center gap-3">
                    <Lightbulb className={`w-5 h-5 flex-shrink-0 ${results.whatIf.improvement > 0 ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <p className="text-sm font-medium">
                      {results.whatIf.improvement > 0
                        ? `Following your playbook would have increased profits by $${results.whatIf.improvement} by removing ${results.whatIf.tradesRemoved} low-quality trade${results.whatIf.tradesRemoved !== 1 ? 's' : ''}.`
                        : `Filtering these ${results.whatIf.tradesRemoved} trades shows minimal P&L impact — your edge may come from other factors.`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* NEW: Contradiction Detection */}
          {results.contradictions && results.contradictions.length > 0 && (
            <Card className="border-2 border-orange-500/30 bg-orange-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <GitMerge className="w-5 h-5" />Conflicting Edge Detected
                </CardTitle>
                <CardDescription>Your data contains contradictions that could be costing you money</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {results.contradictions.map((c, i) => (
                  <div key={i} className="p-4 rounded-lg bg-background border border-orange-500/20">
                    <p className="font-semibold text-sm text-orange-600 mb-1">⚡ {c.description}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{c.detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Personal Playbook */}
          {results.playbook && (
            <Card className="border-2 border-green-500/30 bg-green-500/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" />Your Personal Playbook</CardTitle>
                    <CardDescription>AI-built optimal rule set based on your actual trading data</CardDescription>
                  </div>
                  {/* NEW: Strict Mode Toggle */}
                  <button
                    onClick={() => setStrictMode(s => !s)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${strictMode ? 'bg-green-500/20 border-green-500/40 text-green-700 dark:text-green-300' : 'bg-muted border-border text-muted-foreground'}`}
                  >
                    {strictMode ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    Strict Mode {strictMode ? 'ON' : 'OFF'}
                  </button>
                </div>
                {strictMode && (
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                    Strict Mode: Only showing rules with ≥70% win rate and Medium+ confidence
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {results.playbook.rules
                    .filter(rule => {
                      if (!strictMode) return true;
                      // In strict mode only show rules that mention high WR
                      const wrMatch = rule.match(/(\d+)%/);
                      const wr = wrMatch ? parseInt(wrMatch[1]) : 0;
                      return wr >= 70 || wr === 0; // keep rules without WR mentioned
                    })
                    .map((rule, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-background">
                      <span className="text-green-500 font-bold mt-0.5">✓</span>
                      <p className="text-sm">{rule}</p>
                    </div>
                  ))}
                  {strictMode && results.playbook.rules.filter(r => { const m = r.match(/(\d+)%/); return m ? parseInt(m[1]) < 70 : false; }).length > 0 && (
                    <p className="text-xs text-muted-foreground px-2">
                      {results.playbook.rules.filter(r => { const m = r.match(/(\d+)%/); return m ? parseInt(m[1]) < 70 : false; }).length} lower-confidence rules hidden in Strict Mode
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div>
                    <p className="text-xs text-muted-foreground">Estimated Win Rate</p>
                    <p className="text-2xl font-bold text-green-500">{results.playbook.estimatedWinRate}%</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${results.playbook.confidence === 'High' ? 'bg-green-500/20 text-green-600' : results.playbook.confidence === 'Medium' ? 'bg-yellow-500/20 text-yellow-600' : 'bg-muted text-muted-foreground'}`}>{results.playbook.confidence} Confidence</span>
                    <p className="text-xs text-muted-foreground mt-1" title={CONFIDENCE_TOOLTIP}>Based on {results.totalTrades} trades</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Plan */}
          {results.recommendations.length > 0 && (
            <Card className="border-2 border-purple-500/30 bg-purple-500/5">
              <CardHeader><CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400"><Lightbulb className="w-5 h-5" />Your Improvement Action Plan</CardTitle><CardDescription>Specific, ranked steps to increase profitability</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-3 p-4 rounded-lg bg-background border">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-600 font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                      <p className="text-sm leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      )}
    </div>
  );
}
