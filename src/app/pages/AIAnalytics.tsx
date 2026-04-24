import { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { storage } from '../utils/storage';
import {
  Brain, Target, TrendingUp, AlertTriangle, CheckCircle2, XCircle,
  Clock, Zap, ChevronRight, BookOpen, Shield, Lock, Crosshair,
  BarChart3, Activity, Flame, Lightbulb, ToggleLeft, ToggleRight,
  GitMerge, FlaskConical, TrendingDown, DollarSign
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Confidence = 'High' | 'Medium' | 'Low';
interface TimeWindow   { label: string; winRate: number; count: number; pnl: number; conf: Confidence; type: string; }
interface Combo        { signals: string[]; winRate: number; count: number; pnl: number; conf: Confidence; }
interface BehaviorLeak { type: string; detail: string; impact: 'high' | 'medium'; count: number; }
interface RRBracket    { label: string; count: number; winRate: number; pnl: number; }
interface EdgeScore    { signal: string; winRate: number; count: number; avgPnL: number; conf: Confidence; }
interface ProfitLeak   { reason: string; loss: number; count: number; }
interface Contradiction{ title: string; detail: string; }
interface NNRule       { rule: string; evidence: string; strength: 'strong' | 'moderate'; }
interface ElimPattern  { what: string; winRate: number; count: number; why: string; }
interface WhatIf       { filter: string; origWR: number; simWR: number; origPnL: number; simPnL: number; delta: number; removed: number; }
interface Cluster      { signals: string[]; winRate: number; count: number; pnl: number; conf: Confidence; uplift: number; insight: string; }

interface Results {
  totalTrades: number; wins: number; losses: number; wr: number; avgRR: number; hasPnL: boolean; hasMinData: boolean;
  detectedFields: { conf: string|null; time: string|null; tradeNum: string|null; emotion: string|null; allCustomKeys: string[]; hasCategoryFields: boolean; };
  missingFields: string[];
  // sessions
  sessions: TimeWindow[]; bestSession: TimeWindow|null; worstSession: TimeWindow|null; sessionRule: string;
  // confluence
  topCombos: Combo[]; strategyCore: Combo|null;
  edgeScores: EdgeScore[];
  // rules
  nnRules: NNRule[]; elimPatterns: ElimPattern[];
  // blueprint
  blueprint: { marketConditions: string[]; entryModel: string[]; riskModel: string[]; executionRules: string[]; } | null;
  // deep analysis
  rrAnalysis: { brackets: RRBracket[]; best: string; worst: string; } | null;
  execGap: { msg: string; planned: number; actual: number; } | null;
  behaviorLeaks: BehaviorLeak[];
  profitLeaks: ProfitLeak[];
  edgeDecay: { decaying: boolean; msg: string; recentWR: number; overallWR: number; } | null;
  clusters: Cluster[];
  contradictions: Contradiction[];
  whatIf: WhatIf | null;
  playbook: { rules: string[]; estWR: number; conf: Confidence; } | null;
  tradeNumStats: { num: number; winRate: number; count: number; pnl: number }[];
  emotionStats: { emotion: string; winRate: number; count: number; pnl: number }[];
  setupQuality: { count: number; winRate: number; trades: number; pnl: number; label: string }[];
  winningThreshold: number | null;
  // confidence + drift
  conf: Confidence; confReason: string;
  nextSteps: string[];
}

// ─── Time windows — 4 main sessions + 3 kill zones ───────────────────────────
const SESSIONS = [
  // Main sessions
  { label: 'Asia Session (18:00–00:00)',     s: 18,    e: 24,    type: 'session'   },
  { label: 'London Session (00:00–06:00)',   s: 0,     e: 6,     type: 'session'   },
  { label: 'New York Session (06:00–12:00)', s: 6,     e: 12,    type: 'session'   },
  { label: 'PM Session (12:00–18:00)',       s: 12,    e: 18,    type: 'session'   },
  // Kill zones — highest-probability windows within sessions
  { label: 'Asia Kill Zone (20:00–00:00)',   s: 20,    e: 24,    type: 'killzone'  },
  { label: 'London Kill Zone (02:00–05:00)', s: 2,     e: 5,     type: 'killzone'  },
  { label: 'NY Kill Zone (09:30–11:00)',     s: 9.5,   e: 11,    type: 'killzone'  },
];

// ─── Field auto-detection ────────────────────────────────────────────────────
// Matches against many common names users might use
const TIME_ALIASES  = ['entry time','time','entrytime','trade time','open time','entry','timestamp','entered'];
const CONF_ALIASES  = ['confluences','confluence','confluences used','setup','setups','signals','indicators','entry model','trigger','confluences/setups','tags','reasons','criteria','conditions','entry criteria'];
const INST_ALIASES  = ['instrument','ticker','symbol','pair','asset','market','currency pair','commodity','index'];
const DIR_ALIASES   = ['direction','bias','side','trade direction','long/short','long short','trade side'];

function detectKey(entries: any[], aliases: string[]): string | null {
  const seen = new Set<string>();
  entries.forEach(e => { if (e.customFields) Object.keys(e.customFields).forEach(k => seen.add(k)); });
  for (const alias of aliases) {
    for (const k of seen) {
      if (k.toLowerCase().trim() === alias || k.toLowerCase().includes(alias) || alias.includes(k.toLowerCase().trim())) {
        return k;
      }
    }
  }
  return null;
}

function fv(entry: any, key: string | null): string {
  if (!key || !entry.customFields) return '';
  const val = entry.customFields[key];
  return val != null ? String(val).trim() : '';
}

function parseHour(timeStr: string): number | null {
  if (!timeStr) return null;
  const s = timeStr.trim().toUpperCase();
  const m = s.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/);
  if (m) {
    let h = parseInt(m[1]), min = parseInt(m[2]);
    if (m[3] === 'PM' && h < 12) h += 12;
    if (m[3] === 'AM' && h === 12) h = 0;
    return h + min / 60;
  }
  const bare = s.match(/^(\d{1,2})$/);
  if (bare) return parseInt(bare[1]);
  return null;
}

function parseSignals(raw: string): string[] {
  if (!raw) return [];
  return raw.split(/[,;|/+\n&]+/).map(s => s.trim()).filter(s => s.length > 0 && s.length < 80);
}

// ─── Core helpers ─────────────────────────────────────────────────────────────
function gc(n: number): Confidence { return n >= 20 ? 'High' : n >= 10 ? 'Medium' : 'Low'; }
function ccls(c: Confidence) {
  if (c === 'High')   return 'bg-green-500/20 text-green-600 border border-green-500/30';
  if (c === 'Medium') return 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30';
  return 'bg-slate-500/15 text-slate-500 border border-slate-500/20';
}
const iw = (e: any) => {
  if (e.result === 'win') return true;
  if (e.result === 'breakeven') {
    // If user specified how BE resolved, use that
    if (e.beResolution === 'continued_win') return true;
    if (e.beResolution === 'continued_loss') return false;
    // No resolution or stayed_breakeven = counts as win (neutral/positive)
    return true;
  }
  return false;
};

// ─── ANALYSIS ENGINE ──────────────────────────────────────────────────────────
function analyze(rawEntries: any[], userId: string): Results {
  // Sort oldest first for decay detection
  const entries = [...rawEntries].sort((a, b) => a.date < b.date ? -1 : 1);
  const wins = entries.filter(iw);
  const wr = entries.length > 0 ? Math.round(wins.length / entries.length * 100) : 0;
  const rrEs = entries.filter(e => (e.riskReward || 0) > 0);
  const avgRR = rrEs.length > 0 ? Math.round(rrEs.reduce((s, e) => s + e.riskReward, 0) / rrEs.length * 10) / 10 : 0;
  const hasPnL = entries.some(e => (e.pnl || 0) !== 0);

  // ── READ FIELDS BY CATEGORY ───────────────────────────────────────────────────
  const allCustomKeys = Array.from(new Set(entries.flatMap(e => e.customFields ? Object.keys(e.customFields) : [])));
  const allFields: any[] = (() => {
    try {
      const userKey = `tradeforge_journal_fields_${userId}`;
      const userFields = JSON.parse(localStorage.getItem(userKey) || '[]');
      if (userFields.length > 0) return userFields;
      // Fallback to global keys for backwards compatibility
      return JSON.parse(localStorage.getItem('tradeforge_journal_fields') || localStorage.getItem('tradeforge_custom_fields') || '[]');
    } catch { return []; }
  })();

  // Find field names by category
  const confFields    = allFields.filter(f => f.category === 'confluence').map(f => f.name);
  const timeFields    = allFields.filter(f => f.category === 'time').map(f => f.name);
  const tradeNumFields= allFields.filter(f => f.category === 'trade_number').map(f => f.name);
  const emotionFields = allFields.filter(f => f.category === 'emotion').map(f => f.name);

  // Primary keys (first field of each category, or null)
  const confKey    = confFields[0]    || null;
  const timeKey    = timeFields[0]    || null;
  const tradeNumKey= tradeNumFields[0]|| null;
  const emotionKey = emotionFields[0] || null;

  // Fallback: if no categorised fields exist yet, try legacy auto-detect
  const legacyConfKey = confKey ? null : detectKey(entries, CONF_ALIASES);
  const legacyTimeKey = timeKey ? null : detectKey(entries, TIME_ALIASES);
  const effectiveConfKey = confKey || legacyConfKey;
  const effectiveTimeKey = timeKey || legacyTimeKey;

  const missing: string[] = [];
  if (!effectiveConfKey) missing.push('Confluence / Setup field — Journal → ⚙️ Fields → Add Field → choose "Confluence / Setup" category');
  if (!effectiveTimeKey) missing.push('Entry Time field — Journal → ⚙️ Fields → Add Field → choose "Entry Time" category');

  // ── SIGNAL EXTRACTION ─────────────────────────────────────────────────────────
  // For checkbox fields: field name IS the signal (include if "true", exclude if "false")
  // For text/dropdown fields: parse the value as comma-separated signal names
  function getSignals(e: any): string[] {
    const sigs: string[] = [];

    for (const field of allFields.filter((f: any) => f.category === 'confluence')) {
      const v = fv(e, field.name);
      if (!v) continue;

      if (field.type === 'checkbox') {
        // Checkbox: include the field NAME as a signal only when checked
        if (v === 'true' || v === true) sigs.push(field.name);
      } else {
        // Text/dropdown: value contains signal name(s), parse them
        const parsed = parseSignals(v);
        if (parsed.length > 0) sigs.push(...parsed);
      }
    }

    // Legacy fallback for uncategorised fields
    if (sigs.length === 0 && legacyConfKey) {
      const v = fv(e, legacyConfKey);
      if (v) sigs.push(...parseSignals(v));
    }

    // Last resort: capitalised acronyms in description
    if (sigs.length === 0 && e.description) {
      const caps = e.description.match(/\b[A-Z]{2,}(?:\s[A-Z]{2,})*/g);
      if (caps) sigs.push(...[...new Set(caps)].slice(0, 5));
    }

    return [...new Set(sigs)];
  }

  function getHour(e: any): number | null {
    // Try category-tagged time field first
    if (effectiveTimeKey) return parseHour(fv(e, effectiveTimeKey));
    return null;
  }

  function getTradeNum(e: any): number | null {
    if (!tradeNumKey) return null;
    const v = fv(e, tradeNumKey);
    if (!v) return null;
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  }

  function getEmotion(e: any): string | null {
    if (!emotionKey) return null;
    return fv(e, emotionKey) || null;
  }

  // ── SESSION ANALYSIS ────────────────────────────────────────────────────────
  const sessions: TimeWindow[] = SESSIONS.map(w => {
    const es = entries.filter(e => {
      const h = getHour(e);
      if (h === null) return false;
      return w.e > 24 ? (h >= w.s || h < w.e - 24) : (h >= w.s && h < w.e);
    });
    return {
      label: w.label,
      winRate: es.length ? Math.round(es.filter(iw).length / es.length * 100) : 0,
      count: es.length,
      pnl: Math.round(es.reduce((s, e) => s + (e.pnl || 0), 0)),
      conf: gc(es.length),
      type: w.type,
    };
  }).filter(w => w.count > 0);

  const srtSess = [...sessions].sort((a, b) => b.winRate - a.winRate);
  const bestSession  = srtSess[0] || null;
  const worstSession = srtSess[srtSess.length - 1] || null;
  const sessionRule = bestSession ? `You perform best between ${bestSession.label} (${bestSession.winRate}% WR across ${bestSession.count} trades). Make this your primary trading window.` : '';

  // ── CONFLUENCE COMBOS ────────────────────────────────────────────────────────
  const cmap = new Map<string, { w: number; n: number; pnl: number }>();
  entries.forEach(e => {
    const sigs = getSignals(e);
    if (!sigs.length) return;
    const w = iw(e) ? 1 : 0;
    const p = e.pnl || 0;
    // Singles
    sigs.forEach(s => { const c = cmap.get(s) || { w:0,n:0,pnl:0 }; cmap.set(s, { w:c.w+w, n:c.n+1, pnl:c.pnl+p }); });
    // Pairs
    for (let i = 0; i < sigs.length; i++) for (let j = i+1; j < sigs.length; j++) {
      const k = [sigs[i],sigs[j]].sort().join(' + ');
      const c = cmap.get(k)||{w:0,n:0,pnl:0}; cmap.set(k,{w:c.w+w,n:c.n+1,pnl:c.pnl+p});
    }
    // Triples
    for (let i = 0; i < sigs.length; i++) for (let j = i+1; j < sigs.length; j++) for (let k2 = j+1; k2 < sigs.length; k2++) {
      const k = [sigs[i],sigs[j],sigs[k2]].sort().join(' + ');
      const c = cmap.get(k)||{w:0,n:0,pnl:0}; cmap.set(k,{w:c.w+w,n:c.n+1,pnl:c.pnl+p});
    }
  });

  const allCombos: Combo[] = Array.from(cmap.entries())
    .filter(([,v]) => v.n >= 2)
    .map(([k,v]) => ({ signals: k.split(' + '), winRate: Math.round(v.w/v.n*100), count: v.n, pnl: Math.round(v.pnl), conf: gc(v.n) }))
    .sort((a,b) => b.winRate - a.winRate || b.count - a.count);

  const topCombos    = allCombos.slice(0, 6);
  const strategyCore = allCombos.find(c => c.signals.length >= 2) || allCombos[0] || null;
  const singles      = allCombos.filter(c => c.signals.length === 1);
  const edgeScores: EdgeScore[] = singles.map(c => ({ signal: c.signals[0], winRate: c.winRate, count: c.count, avgPnL: c.count > 0 ? Math.round(c.pnl/c.count) : 0, conf: c.conf }));

  // ── R:R ANALYSIS ────────────────────────────────────────────────────────────
  const rrDefs = [
    { l:'RR < 1',  es: entries.filter(e => (e.riskReward||0)>0 && e.riskReward<1)  },
    { l:'RR 1–2',  es: entries.filter(e => (e.riskReward||0)>=1 && e.riskReward<2) },
    { l:'RR 2–3',  es: entries.filter(e => (e.riskReward||0)>=2 && e.riskReward<3) },
    { l:'RR ≥ 3',  es: entries.filter(e => (e.riskReward||0)>=3)                   },
  ].filter(b => b.es.length > 0);
  const rrBrackets: RRBracket[] = rrDefs.map(b => ({ label:b.l, count:b.es.length, winRate: Math.round(b.es.filter(iw).length/b.es.length*100), pnl: Math.round(b.es.reduce((s,e)=>s+(e.pnl||0),0)) }));
  const srtRR = [...rrBrackets].sort((a,b) => b.winRate - a.winRate);
  const rrAnalysis = rrBrackets.length > 0 ? { brackets: rrBrackets, best: srtRR[0]?.label||'', worst: srtRR[srtRR.length-1]?.label||'' } : null;

  // ── EXECUTION GAP ────────────────────────────────────────────────────────────
  let execGap = null;
  const pnlEs = entries.filter(e => (e.pnl||0)!==0 && (e.riskReward||0)>0);
  if (pnlEs.length >= 5 && avgRR > 0) {
    const wPnL = pnlEs.filter(iw); const lPnL = pnlEs.filter(e=>!iw(e));
    const avgW = wPnL.length  > 0 ? wPnL.reduce((s,e)=>s+Math.abs(e.pnl||0),0)/wPnL.length  : 0;
    const avgL = lPnL.length > 0 ? lPnL.reduce((s,e)=>s+Math.abs(e.pnl||0),0)/lPnL.length : 0;
    const actRR = avgL > 0 ? Math.round(avgW/avgL*10)/10 : 0;
    if (actRR > 0 && Math.abs(actRR - avgRR) > 0.3)
      execGap = { msg: actRR < avgRR ? `You plan for ${avgRR}R but only capture ${actRR}R on average — you may be exiting winners too early` : `Actual RR (${actRR}R) beats planned (${avgRR}R) — excellent execution`, planned: avgRR, actual: actRR };
  }

  // ── BEHAVIOR LEAKS ────────────────────────────────────────────────────────────
  const leaks: BehaviorLeak[] = [];

  // Overtrading
  const byDay: Record<string,any[]> = {};
  entries.forEach(e => { byDay[e.date] = byDay[e.date]||[]; byDay[e.date].push(e); });
  const overtradeDays = Object.values(byDay).filter(d => d.length > 5).length;
  if (overtradeDays > 0)
    leaks.push({ type:'Overtrading', detail:`${overtradeDays} day(s) with 5+ trades — performance typically declines after the 3rd trade of the day`, impact:'high', count:overtradeDays });

  // Revenge trading
  let revenge = 0;
  Object.values(byDay).forEach(d => { for (let i=1;i<d.length;i++) if (!iw(d[i-1]) && (d[i].riskReward||0) > (d[i-1].riskReward||0)*1.5) revenge++; });
  if (revenge > 1)
    leaks.push({ type:'Revenge Trading', detail:`${revenge} instances of increasing size after a loss — classic tilt pattern`, impact:'high', count:revenge });

  // No-setup entries
  const noTag = entries.filter(e => getSignals(e).length === 0);
  if (noTag.length >= 3) {
    const noTagWR = Math.round(noTag.filter(iw).length / noTag.length * 100);
    leaks.push({ type:'Unplanned Entries', detail:`${noTag.length} trades with no setup tagged (${noTagWR}% WR) — likely impulsive`, impact: noTagWR < 45 ? 'high' : 'medium', count:noTag.length });
  }

  // Sub-1R leak
  const sub1 = entries.filter(e => (e.riskReward||0)>0 && e.riskReward<1);
  if (sub1.length >= 3) {
    const sub1WR = Math.round(sub1.filter(iw).length/sub1.length*100);
    if (sub1WR < 55) leaks.push({ type:'Sub-1R Trades', detail:`${sub1.length} trades with RR < 1 (${sub1WR}% WR) — risk not justified by reward`, impact:'medium', count:sub1.length });
  }

  // Late session leak (only if we have time data)
  if (timeKey) {
    const lateEs = entries.filter(e => { const h=getHour(e); return h!==null&&(h>=11.517&&h<14||h>=18); });
    if (lateEs.length > 3 && lateEs.length/entries.length > 0.25) {
      const lateWR = Math.round(lateEs.filter(iw).length/lateEs.length*100);
      if (lateWR < wr - 10)
        leaks.push({ type:'Late Session Trading', detail:`${lateEs.length} trades in low-probability sessions (${lateWR}% WR vs ${wr}% overall)`, impact:'medium', count:lateEs.length });
    }
  }

  // ── PROFIT LEAKS ──────────────────────────────────────────────────────────────
  const pLeaks: ProfitLeak[] = [];
  const sub1PnL = sub1.reduce((s,e)=>s+(e.pnl||0),0);
  if (sub1PnL < 0 && sub1.length >= 3) pLeaks.push({ reason:'Taking sub-1R trades', loss:Math.abs(Math.round(sub1PnL)), count:sub1.length });
  const noTagPnL = noTag.reduce((s,e)=>s+(e.pnl||0),0);
  if (noTagPnL < 0 && noTag.length >= 3) pLeaks.push({ reason:'Unplanned / untagged entries', loss:Math.abs(Math.round(noTagPnL)), count:noTag.length });
  if (worstSession && worstSession.pnl < 0 && worstSession.count >= 3)
    pLeaks.push({ reason:`Trading during ${worstSession.label}`, loss:Math.abs(worstSession.pnl), count:worstSession.count });

  // ── CONFLUENCE PERFORMANCE CLUSTERS ─────────────────────────────────────────
  const confClusters: Cluster[] = [];

  if (allCombos.length >= 2) {
    allCombos.filter(c => c.signals.length >= 2 && c.count >= 2).forEach(combo => {
      const componentWRs = combo.signals.map(s => {
        const single = singles.find(ss => ss.signals[0] === s);
        return single ? single.winRate : 0;
      });
      const bestComponentWR = componentWRs.length > 0 ? Math.max(...componentWRs) : 0;
      const uplift = combo.winRate - bestComponentWR;

      let insight = '';
      if (uplift >= 15) insight = `Adding ${combo.signals.slice(1).join(' + ')} to ${combo.signals[0]} boosts win rate by +${uplift}% — strong confirmation effect`;
      else if (uplift >= 5) insight = `Moderate improvement of +${uplift}% over the strongest individual signal`;
      else if (uplift >= 0) insight = `Minimal uplift (+${uplift}%) — these signals are likely correlated, not additive`;
      else insight = `This combination reduces win rate vs individual signals (${uplift}%) — the signals may conflict`;

      confClusters.push({ signals: combo.signals, winRate: combo.winRate, count: combo.count, pnl: combo.pnl, conf: combo.conf, uplift, insight });
    });
    confClusters.sort((a, b) => b.uplift - a.uplift || b.winRate - a.winRate);
  }
  const clusters = confClusters.slice(0, 6);

  // ── TRADE NUMBER ANALYSIS ─────────────────────────────────────────────────────
  // Does the user perform better on their 1st, 2nd, 3rd trade of the day?
  const tradeNumMap = new Map<number, { w: number; n: number; pnl: number }>();
  if (tradeNumKey) {
    entries.forEach(e => {
      const n = getTradeNum(e);
      if (n === null) return;
      const cur = tradeNumMap.get(n) || { w: 0, n: 0, pnl: 0 };
      tradeNumMap.set(n, { w: cur.w + (iw(e) ? 1 : 0), n: cur.n + 1, pnl: cur.pnl + (e.pnl || 0) });
    });
  }
  const tradeNumStats = Array.from(tradeNumMap.entries())
    .filter(([, v]) => v.n >= 2)
    .map(([num, v]) => ({ num, winRate: Math.round(v.w / v.n * 100), count: v.n, pnl: Math.round(v.pnl) }))
    .sort((a, b) => a.num - b.num);

  // ── EMOTION ANALYSIS ─────────────────────────────────────────────────────────
  const emotionMap = new Map<string, { w: number; n: number; pnl: number }>();
  if (emotionKey) {
    entries.forEach(e => {
      const em = getEmotion(e);
      if (!em) return;
      const key = em.toLowerCase().trim();
      const cur = emotionMap.get(key) || { w: 0, n: 0, pnl: 0 };
      emotionMap.set(key, { w: cur.w + (iw(e) ? 1 : 0), n: cur.n + 1, pnl: cur.pnl + (e.pnl || 0) });
    });
  }
  const emotionStats = Array.from(emotionMap.entries())
    .filter(([, v]) => v.n >= 2)
    .map(([emotion, v]) => ({ emotion, winRate: Math.round(v.w / v.n * 100), count: v.n, pnl: Math.round(v.pnl) }))
    .sort((a, b) => b.winRate - a.winRate);
  let edgeDecay = null;
  if (entries.length >= 15) {
    const h = Math.floor(entries.length/2);
    const earlyWR  = Math.round(entries.slice(0,h).filter(iw).length/h*100);
    const recentWR = Math.round(entries.slice(h).filter(iw).length/(entries.length-h)*100);
    if (Math.abs(earlyWR-recentWR) >= 10)
      edgeDecay = { decaying: earlyWR>recentWR, msg: earlyWR>recentWR ? `Win rate dropped from ${earlyWR}% (first half of trades) to ${recentWR}% (recent) — edge may be weakening or market conditions changed` : `Win rate improved from ${earlyWR}% to ${recentWR}% — your edge is strengthening`, recentWR, overallWR:wr };
  }

  // ── CONTRADICTIONS ────────────────────────────────────────────────────────────
  const contras: Contradiction[] = [];
  // Setup performs differently by session
  if (bestSession && singles.length > 0 && effectiveTimeKey) {
    const bestSig = singles[0];
    const def = SESSIONS.find(w => w.label === bestSession.label);
    if (def) {
      const inSess    = entries.filter(e => { const h=getHour(e); return h!==null&&h>=def.s&&h<def.e&&getSignals(e).includes(bestSig.signal); });
      const outSess   = entries.filter(e => { const h=getHour(e); return h!==null&&!(h>=def.s&&h<def.e)&&getSignals(e).includes(bestSig.signal); });
      if (inSess.length>=3 && outSess.length>=3) {
        const inWR=Math.round(inSess.filter(iw).length/inSess.length*100), outWR=Math.round(outSess.filter(iw).length/outSess.length*100);
        if (Math.abs(inWR-outWR)>=20)
          contras.push({ title:`${bestSig.signal} depends heavily on session`, detail:`${bestSig.signal} in ${bestSession.label}: ${inWR}% WR. Same setup outside that session: ${outWR}% WR. The session is more important than the setup alone.` });
      }
    }
  }
  // High RR but low WR
  const highRR = rrBrackets.find(b => b.label === 'RR ≥ 3');
  const midRR  = rrBrackets.find(b => b.label === 'RR 2–3');
  if (highRR && midRR && highRR.winRate < midRR.winRate && highRR.count >= 3 && midRR.count >= 3)
    contras.push({ title:'Higher RR does not mean better results for you', detail:`RR ≥ 3 shows ${highRR.winRate}% WR, but RR 2–3 shows ${midRR.winRate}% WR. Pushing for the highest RR may be causing overextension. Your optimal RR bracket appears to be 2–3.` });

  // ── WHAT-IF SIMULATOR ────────────────────────────────────────────────────────
  let whatIf: WhatIf | null = null;
  if (strategyCore && entries.length >= 5) {
    const coreEs = entries.filter(e => strategyCore.signals.every(cs => getSignals(e).includes(cs)));
    if (coreEs.length >= 2 && coreEs.length < entries.length) {
      const simWR = Math.round(coreEs.filter(iw).length/coreEs.length*100);
      const origPnL = Math.round(entries.reduce((s,e)=>s+(e.pnl||0),0));
      const simPnL  = Math.round(coreEs.reduce((s,e)=>s+(e.pnl||0),0));
      whatIf = { filter:`Only trades where ${strategyCore.signals.join(' + ')} is present`, origWR:wr, simWR, origPnL, simPnL, delta:simPnL-origPnL, removed:entries.length-coreEs.length };
    }
  }
  // Fallback: What if only RR≥2 trades?
  if (!whatIf && rrBrackets.length > 1) {
    const highEs = entries.filter(e => (e.riskReward||0) >= 2);
    if (highEs.length >= 3 && highEs.length < entries.length) {
      const simWR = Math.round(highEs.filter(iw).length/highEs.length*100);
      const origPnL = Math.round(entries.reduce((s,e)=>s+(e.pnl||0),0));
      const simPnL  = Math.round(highEs.reduce((s,e)=>s+(e.pnl||0),0));
      whatIf = { filter:'Only trades with RR ≥ 2', origWR:wr, simWR, origPnL, simPnL, delta:simPnL-origPnL, removed:entries.length-highEs.length };
    }
  }

  // ── NON-NEGOTIABLE RULES ──────────────────────────────────────────────────────
  const nnRules: NNRule[] = [];
  if (srtRR[0]?.count >= 3) nnRules.push({ rule:`Only take trades with ${srtRR[0].label}`, evidence:`${srtRR[0].winRate}% WR, ${srtRR[0].count} trades`, strength: srtRR[0].winRate>=60?'strong':'moderate' });
  if (bestSession?.winRate >= 55 && bestSession.count >= 3) nnRules.push({ rule:`Only trade during ${bestSession.label}`, evidence:`${bestSession.winRate}% WR, ${bestSession.count} trades`, strength: bestSession.winRate>=65?'strong':'moderate' });
  if (strategyCore?.winRate >= 55) nnRules.push({ rule:`Only enter when ${strategyCore.signals.join(' + ')} is present`, evidence:`${strategyCore.winRate}% WR, ${strategyCore.count} trades`, strength: strategyCore.winRate>=65?'strong':'moderate' });
  if (noTag.length >= 3) nnRules.push({ rule:'Never trade without tagging your setup', evidence:`Untagged trades: lower quality, higher impulsivity`, strength:'moderate' });

  // ── ELIMINATE ────────────────────────────────────────────────────────────────
  const elims: ElimPattern[] = [];
  if (worstSession?.winRate < 45 && worstSession.count >= 3 && worstSession.label !== bestSession?.label)
    elims.push({ what:`Trading during ${worstSession.label}`, winRate:worstSession.winRate, count:worstSession.count, why:'Consistently underperforms — not your edge' });
  if (srtRR.length > 1 && srtRR[srtRR.length-1].winRate < 45 && srtRR[srtRR.length-1].label !== srtRR[0].label)
    elims.push({ what:`Trades in ${srtRR[srtRR.length-1].label} bracket`, winRate:srtRR[srtRR.length-1].winRate, count:srtRR[srtRR.length-1].count, why:'Lowest-performing RR range — not worth the risk' });
  singles.filter(c => c.winRate<45 && c.count>=3).slice(0,2)
    .forEach(c => elims.push({ what:`${c.signals[0]} as sole confluence`, winRate:c.winRate, count:c.count, why:'Weak when used alone — requires confirmation' }));

  // ── BLUEPRINT ────────────────────────────────────────────────────────────────
  const blueprint = entries.length >= 5 ? {
    marketConditions: [
      bestSession ? `Primary session: ${bestSession.label}` : 'Add Entry Time field to identify your best session',
      worstSession?.winRate < 45 ? `Hard avoid: ${worstSession.label}` : '',
    ].filter(Boolean),
    entryModel: strategyCore
      ? [`Required confluences: ${strategyCore.signals.join(' + ')}`, `Win rate at this setup: ${strategyCore.winRate}%`, `Sample: ${strategyCore.count} trades (${strategyCore.conf} confidence)`, singles[0] && singles[0].signals[0] !== strategyCore.signals[0] ? `Strongest individual signal: ${singles[0].signals[0]} (${singles[0].winRate}% WR)` : ''].filter(Boolean)
      : ['Add a Confluences field and tag your setups — this is the foundation of your entry model'],
    riskModel: [
      avgRR > 0 ? `Minimum RR target: ${Math.max(avgRR,1.5).toFixed(1)}` : 'Log R:R to build risk model',
      srtRR[0] ? `Best RR bracket: ${srtRR[0].label} (${srtRR[0].winRate}% WR)` : '',
      execGap && execGap.actual < execGap.planned ? `Warning: You capture only ${execGap.actual}R avg — let winners run` : '',
    ].filter(Boolean),
    executionRules: [
      bestSession ? `Trade only during: ${bestSession.label}` : '',
      strategyCore ? `Skip if ${strategyCore.signals.join(' + ')} not present` : '',
      worstSession?.winRate < 40 ? `HARD RULE: Do not trade during ${worstSession.label}` : '',
      `Current WR: ${wr}% — target 55%+ before scaling`,
    ].filter(Boolean),
  } : null;

  // ── PLAYBOOK ──────────────────────────────────────────────────────────────────
  const rules: string[] = [];
  if (bestSession) rules.push(`Trade only during ${bestSession.label}`);
  if (strategyCore) rules.push(`Entry requires: ${strategyCore.signals.join(' + ')}`);
  if (srtRR[0]) rules.push(`Target ${srtRR[0].label} on every trade`);
  if (worstSession?.winRate < 40) rules.push(`Never trade during ${worstSession.label}`);
  if (noTag.length > 2) rules.push('Tag your setup before every entry');
  if (execGap && execGap.actual < execGap.planned) rules.push('Hold trades to full target — stop exiting early');
  const playbook = rules.length >= 2 ? { rules, estWR: strategyCore ? strategyCore.winRate : wr, conf: gc(entries.length) } : null;

  // ── SETUP QUALITY ANALYSIS ───────────────────────────────────────────────────
  // Groups trades by how many confluence checkboxes were ticked.
  // Shows directly: more confluences = higher win rate.
  const qualityMap = new Map<number, { w: number; n: number; pnl: number }>();
  entries.forEach(e => {
    const count = getSignals(e).length;
    const cur = qualityMap.get(count) || { w: 0, n: 0, pnl: 0 };
    qualityMap.set(count, { w: cur.w + (iw(e) ? 1 : 0), n: cur.n + 1, pnl: cur.pnl + (e.pnl || 0) });
  });
  const setupQuality = Array.from(qualityMap.entries())
    .filter(([, v]) => v.n >= 2)
    .map(([count, v]) => ({
      count,
      winRate: Math.round(v.w / v.n * 100),
      trades: v.n,
      pnl: Math.round(v.pnl),
      label: count === 0 ? 'No confluences' : count === 1 ? '1 confluence' : `${count} confluences`,
    }))
    .sort((a, b) => a.count - b.count);

  // Key insight: what is the minimum confluence count that produces winning trades?
  const winningThreshold = setupQuality.find(s => s.winRate >= 55)?.count ?? null;

  // ── NEXT STEPS ────────────────────────────────────────────────────────────────
  const next: string[] = [];
  if (!effectiveTimeKey) next.push('Add an Entry Time field. In Journal → ⚙️ Fields → Add Field, choose the "Entry Time" category. Enter times like "09:45" on each trade. This unlocks session win rates — one of the most powerful filters in your strategy.');
  if (!effectiveConfKey) next.push('Add a Confluence/Setup field. In Journal → ⚙️ Fields → Add Field, choose the "Confluence / Setup" category. Tag every trade with your confluences (e.g. "CISD, IFVG, OB, Liq Sweep"). This is the foundation of your strategy core.');
  if (entries.length < 20) next.push(`${entries.length} trades logged — need 20+ for High confidence. Log every single trade without exception.`);
  if (strategyCore && strategyCore.count < 15) next.push(`Core setup (${strategyCore.signals.join(' + ')}) has only ${strategyCore.count} trades. Prioritise this setup to build your sample.`);
  if (execGap && execGap.actual < execGap.planned) next.push('Work on holding trades to full target. You are consistently exiting early and leaving R on the table.');
  if (!next.length) next.push('Strategy forming well. Trade only your core setup for the next 20 trades, then re-analyse to track improvement.');

  const overallConf = gc(entries.length);
  const confReason  = entries.length>=20 ? `${entries.length} trades — statistically meaningful` : entries.length>=10 ? `${entries.length} trades — building sample size` : `Only ${entries.length} trades — directional only`;

  return {
    totalTrades:entries.length, wins:wins.length, losses:entries.length-wins.length, wr, avgRR, hasPnL, hasMinData:entries.length>=10,
    detectedFields:{ conf: effectiveConfKey, time: effectiveTimeKey, tradeNum: tradeNumKey, emotion: emotionKey, allCustomKeys, hasCategoryFields: confFields.length > 0 || timeFields.length > 0 },
    missingFields:missing,
    sessions, bestSession, worstSession, sessionRule,
    topCombos, strategyCore, edgeScores,
    nnRules, elimPatterns:elims,
    blueprint, rrAnalysis, execGap,
    behaviorLeaks:leaks, profitLeaks:pLeaks, edgeDecay, clusters, contradictions:contras,
    whatIf, playbook,
    conf:overallConf, confReason, nextSteps:next,
    tradeNumStats, emotionStats, setupQuality, winningThreshold,
  };
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
function CP({ c }: { c: Confidence }) {
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ccls(c)}`}>{c}</span>;
}
function SH({ icon:Icon, title, sub, color='' }: { icon:any; title:string; sub?:string; color?:string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className={`w-5 h-5 ${color||'text-foreground'}`} />
      </div>
      <div>
        <h3 className="font-bold text-base">{title}</h3>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export function AIAnalytics() {
  const [results, setResults]       = useState<Results|null>(null);
  const [isAnalyzing, setAnalyzing] = useState(false);
  const [err, setErr]               = useState<string|null>(null);
  const [strictMode, setStrictMode] = useState(false);
  const currentUser = storage.getCurrentUser();
  const isPremium   = currentUser?.isPremium;

  const run = async () => {
    if (!currentUser) return;
    setAnalyzing(true); setErr(null); setResults(null);
    try {
      const entries = storage.getJournalEntries().filter((e:any) => e.userId===currentUser.id);
      // Debug: log what we found
      console.log('🔍 AIAnalytics — total entries in storage:', storage.getJournalEntries().length);
      console.log('🔍 Entries for this user:', entries.length);
      console.log('🔍 Current user ID:', currentUser.id);
      if (storage.getJournalEntries().length > 0) {
        console.log('🔍 First entry userId:', storage.getJournalEntries()[0]?.userId);
      }
      // Also try reading directly from localStorage as fallback
      var allFromStorage = entries;
      if (entries.length === 0) {
        try {
          var raw = localStorage.getItem('tradeforge_journal_entries');
          if (raw) {
            var parsed = JSON.parse(raw);
            console.log('🔍 Direct localStorage read:', parsed.length, 'entries');
            allFromStorage = parsed.filter((e:any) => e.userId === currentUser.id);
            console.log('🔍 After userId filter:', allFromStorage.length);
          }
        } catch(ex) { console.log('localStorage read failed', ex); }
      }
      // Debug: log first entry's customFields so we can see what field names exist
      if (entries.length > 0) {
        console.log('🔍 Sample entry customFields:', entries[0].customFields);
        console.log('🔍 All custom field keys:', [...new Set(entries.flatMap((e:any) => e.customFields ? Object.keys(e.customFields) : []))]);
        console.log('🔍 Sample description:', entries[0].description);
      }
      await new Promise(r=>setTimeout(r,700));
      setResults(analyze(allFromStorage, currentUser.id));
    } catch(e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('AIAnalytics error:', e);
      setErr(`Analysis failed: ${msg}. Check the console for details.`);
    } finally { setAnalyzing(false); }
  };

  if (!isPremium) return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="border-2 border-primary/20"><CardContent className="py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto"><Lock className="w-8 h-8 text-primary"/></div>
        <h2 className="text-2xl font-bold">Premium Feature</h2>
        <p className="text-muted-foreground max-w-md mx-auto">AI Strategy Builder turns your journal into a real, data-backed personal trading system.</p>
        <Button size="lg" onClick={()=>window.location.href='/app/upgrade'}>Upgrade to Premium <ChevronRight className="w-4 h-4 ml-2"/></Button>
      </CardContent></Card>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl pb-24 space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Brain className="w-7 h-7 text-primary"/>AI Strategy Builder</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your journal → your edge → your personal trading system</p>
      </div>

      {/* Run */}
      <Card className={`border-2 ${results?'border-primary/20 bg-primary/5':'border-border'}`}>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-semibold">{results?'Analysis Complete':'Build Your Strategy'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{results?`${results.totalTrades} trades analysed · ${results.conf} confidence`:'Analyse your journal to extract your real edge'}</p>
            </div>
            <Button onClick={run} disabled={isAnalyzing} size="lg" className="min-w-36">
              {isAnalyzing ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"/>Analysing...</>
                : results ? <><Zap className="w-4 h-4 mr-2"/>Re-analyse</> : <><Brain className="w-4 h-4 mr-2"/>Run Analysis</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {err && <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{err}</div>}

      {results && !results.hasMinData && (
        <Card className="border-dashed"><CardContent className="py-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-muted-foreground opacity-40"/>
          <p className="font-semibold">Not Enough Data Yet</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">{results.totalTrades===0?'No trades found. Make sure you have journal entries logged and try again.':`${results.totalTrades} trades logged — need at least 10 to unlock full analysis.`}</p>
        </CardContent></Card>
      )}

      {results && results.hasMinData && (<>

        {/* Detected fields banner */}
        {results.detectedFields.allCustomKeys.length > 0 && (
          <Card className="border border-primary/20 bg-primary/5"><CardContent className="pt-3 pb-3">
            <p className="text-xs font-semibold text-primary mb-2">📂 Fields detected in your journal:</p>
            <div className="flex flex-wrap gap-1.5">
              {results.detectedFields.conf      && <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium border border-primary/20">🎯 Confluences</span>}
              {results.detectedFields.time      && <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 text-xs font-medium border border-blue-500/20">⏱ Entry Time</span>}
              {results.detectedFields.tradeNum  && <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 text-xs font-medium border border-purple-500/20">🔢 Trade #</span>}
              {results.detectedFields.emotion   && <span className="px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-600 text-xs font-medium border border-pink-500/20">🧠 Emotion</span>}
              {results.detectedFields.allCustomKeys.length > 0 && !results.detectedFields.hasCategoryFields && (
                <span className="text-xs text-amber-600 font-medium w-full mt-1">
                  ⚠️ Your fields don't have categories yet. Go to Journal → ⚙️ Fields → delete and re-add your fields choosing a category (Confluence, Time, etc.) so the AI knows what to analyse.
                </span>
              )}
            </div>
          </CardContent></Card>
        )}

        {/* Missing fields warning */}
        {results.missingFields.length > 0 && (
          <Card className="border border-amber-500/30 bg-amber-500/5"><CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"/>
              <div>
                <p className="font-semibold text-sm text-amber-600 mb-1.5">Add these fields to unlock full analysis:</p>
                <ul className="space-y-1">
                  {results.missingFields.map((f,i)=>(
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1"/>{f}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-amber-600 font-semibold mt-2">Journal → ⚙️ Manage Fields → Add Field</p>
              </div>
            </div>
          </CardContent></Card>
        )}

        {/* Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {l:'Trades',   v:results.totalTrades,          c:'text-blue-500'},
            {l:'Win Rate', v:`${results.wr}%`,              c:results.wr>=55?'text-green-500':'text-red-500'},
            {l:'Avg R:R',  v:results.avgRR>0?results.avgRR:'—', c:'text-amber-500'},
            {l:'W / L',    v:`${results.wins} / ${results.losses}`, c:'text-purple-500'},
          ].map(s=>(
            <Card key={s.l}><CardContent className="pt-4 pb-4 text-center">
              <p className={`text-2xl font-bold ${s.c}`}>{s.v}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.l}</p>
            </CardContent></Card>
          ))}
        </div>

        {/* Confidence */}
        <Card className={`border ${results.conf==='High'?'border-green-500/30 bg-green-500/5':results.conf==='Medium'?'border-yellow-500/30 bg-yellow-500/5':'border-border'}`}>
          <CardContent className="pt-4 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className={`w-5 h-5 ${results.conf==='High'?'text-green-500':results.conf==='Medium'?'text-yellow-500':'text-slate-400'}`}/>
              <div><p className="font-semibold text-sm">Data Confidence</p><p className="text-xs text-muted-foreground">{results.confReason}</p></div>
            </div>
            <CP c={results.conf}/>
          </CardContent>
        </Card>

        {/* Drift */}
        {/* Setup Quality — replaces drift, shows confluence count vs win rate */}
        {(results.setupQuality||[]).length >= 2 && (
          <Card className="border-2 border-primary/20 bg-primary/5"><CardContent className="pt-5">
            <SH icon={Crosshair} title="Setup Quality vs Win Rate" sub="Does having more confluences actually improve your results?" color="text-primary"/>
            <div className="space-y-2 mb-4">
              {(results.setupQuality||[]).map((s, i) => {
                const maxWR = Math.max(...(results.setupQuality||[]).map(x => x.winRate));
                const isWorst = s.winRate < 45;
                const isBest  = s.winRate === maxWR;
                return (
                  <div key={i} className={`p-3 rounded-xl border ${isBest?'border-green-500/30 bg-green-500/5':isWorst?'border-red-500/20 bg-red-500/5':'border-transparent bg-muted'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {isBest  && <span className="text-xs font-black text-green-600">BEST</span>}
                        {isWorst && <span className="text-xs font-black text-red-500">AVOID</span>}
                        <span className="font-medium text-sm">{s.label}</span>
                      </div>
                      <span className={`font-bold text-sm ${s.winRate>=60?'text-green-500':s.winRate<45?'text-red-500':'text-yellow-500'}`}>{s.winRate}%</span>
                    </div>
                    {/* Visual bar */}
                    <div className="w-full bg-background rounded-full h-1.5 mb-1">
                      <div className={`h-1.5 rounded-full ${s.winRate>=60?'bg-green-500':s.winRate<45?'bg-red-500':'bg-yellow-500'}`} style={{width:`${s.winRate}%`}}/>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.trades} trades · {s.pnl>=0?'+':''}${s.pnl}</p>
                  </div>
                );
              })}
            </div>
            {/* Key insight */}
            {results.winningThreshold !== null && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm font-medium text-primary">
                  📍 You need at least <strong>{results.winningThreshold} confluence{results.winningThreshold !== 1 ? 's' : ''}</strong> present to achieve a winning win rate. Trades with fewer confluences are costing you money — skip them.
                </p>
              </div>
            )}
            {/* Show P&L lost on low-confluence trades */}
            {(() => {
              const lowQuality = (results.setupQuality||[]).filter(s => results.winningThreshold !== null && s.count < results.winningThreshold);
              const lost = lowQuality.reduce((sum, s) => sum + (s.pnl < 0 ? s.pnl : 0), 0);
              const count = lowQuality.reduce((sum, s) => sum + s.trades, 0);
              return lost < 0 && count > 0 ? (
                <div className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm font-medium text-red-600">
                    ❌ You have lost <strong>${Math.abs(lost)}</strong> across {count} trades taken without enough confluences. These trades should not exist in your journal.
                  </p>
                </div>
              ) : null;
            })()}
          </CardContent></Card>
        )}

        {/* Session Analysis */}
        <Card><CardContent className="pt-5">
          <SH icon={Clock} title="Session & Kill Zone Analysis" sub="Your top 2 performing sessions and kill zones" color="text-blue-500"/>
          {results.sessions.length===0 ? (
            <div className="p-4 rounded-lg bg-muted">
              <p className="font-medium text-sm mb-1">No entry time data found.</p>
              <p className="text-sm text-muted-foreground">Add an <strong>Entry Time</strong> custom field (text type) and enter times like "09:45" when logging trades.</p>
              <p className="text-xs text-primary font-semibold mt-2">Journal → ⚙️ Manage Fields → Add Field</p>
            </div>
          ) : (<>
            {results.sessions.filter((w:any)=>w.type==='session').length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Main Sessions</p>
                <div className="space-y-2">
                  {[...results.sessions.filter((w:any)=>w.type==='session')].sort((a,b)=>b.winRate-a.winRate).slice(0,2).map((w:any,i:number,arr:any[])=>{
                    const best=i===0&&w.winRate>=55, worst=i===arr.length-1&&w.winRate<45&&arr.length>1;
                    return (
                      <div key={w.label} className={`p-3 rounded-lg border ${best?'border-green-500/30 bg-green-500/5':worst?'border-red-500/20 bg-red-500/5':'border-transparent bg-muted'}`}>
                        <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                          <div className="flex items-center gap-2">
                            {best  && <span className="text-xs font-black text-green-600">BEST</span>}
                            {worst && <span className="text-xs font-black text-red-500">AVOID</span>}
                            <span className="font-medium text-sm">{w.label}</span>
                          </div>
                          <div className="flex items-center gap-2"><CP c={w.conf}/><span className={`font-bold text-sm ${w.winRate>=55?'text-green-500':w.winRate<45?'text-red-500':'text-yellow-500'}`}>{w.winRate}%</span></div>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>{w.count} trades</span>
                          {w.pnl!==0&&<span className={w.pnl>=0?'text-green-600':'text-red-500'}>{w.pnl>=0?'+':''}${w.pnl}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {results.sessions.filter((w:any)=>w.type==='killzone').length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">⚡ Kill Zones — Highest Probability Windows</p>
                <div className="space-y-2">
                  {[...results.sessions.filter((w:any)=>w.type==='killzone')].sort((a,b)=>b.winRate-a.winRate).slice(0,2).map((w:any,i:number)=>{
                    const prime=i===0&&w.winRate>=60;
                    return (
                      <div key={w.label} className={`p-3 rounded-lg border ${prime?'border-amber-500/40 bg-amber-500/5':w.winRate<45?'border-red-500/20 bg-red-500/5':'border-transparent bg-muted'}`}>
                        <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                          <div className="flex items-center gap-2">
                            {prime && <span className="text-xs font-black text-amber-600">⚡ PRIME</span>}
                            <span className="font-medium text-sm">{w.label}</span>
                          </div>
                          <div className="flex items-center gap-2"><CP c={w.conf}/><span className={`font-bold text-sm ${w.winRate>=60?'text-amber-500':w.winRate<45?'text-red-500':'text-yellow-500'}`}>{w.winRate}%</span></div>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>{w.count} trades</span>
                          {w.pnl!==0&&<span className={w.pnl>=0?'text-green-600':'text-red-500'}>{w.pnl>=0?'+':''}${w.pnl}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {results.sessionRule && <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"><p className="text-sm font-medium text-blue-700 dark:text-blue-300">📍 {results.sessionRule}</p></div>}
          </>)}        </CardContent></Card>

        {/* Strategy Core */}
        <Card className="border-2 border-primary/25 bg-primary/5"><CardContent className="pt-5">
          <SH icon={Crosshair} title="🔥 Strategy Core Setup" sub="Best-performing confluence combinations — individual signals, pairs, and triples ranked by win rate" color="text-primary"/>
          {results.topCombos.length===0 ? (
            <div className="p-4 rounded-lg bg-muted">
              <p className="font-medium text-sm mb-1">No confluence data found.</p>
              <p className="text-sm text-muted-foreground">Add a <strong>Confluences</strong> custom field and tag every trade. Example values: "CISD, IFVG" or "Order Block, Liquidity Sweep, FVG". The AI will then find which combinations produce the highest win rate.</p>
              <p className="text-xs text-primary font-semibold mt-2">Journal → ⚙️ Manage Fields → Add Field</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.topCombos.map((combo,i)=>(
                <div key={i} className={`p-4 rounded-xl border ${i===0?'border-primary/40 bg-primary/10':'border-transparent bg-muted'}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex flex-wrap gap-1.5">
                      {combo.signals.map((s,j)=>(
                        <span key={j} className={`px-2.5 py-1 rounded-full text-xs font-bold ${i===0?'bg-primary text-primary-foreground':'bg-background border text-foreground'}`}>{s}</span>
                      ))}
                    </div>
                    <p className={`text-xl font-bold flex-shrink-0 ${combo.winRate>=60?'text-green-500':combo.winRate>=50?'text-yellow-500':'text-red-500'}`}>{combo.winRate}%</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span>{combo.count} trades</span>
                    {combo.pnl!==0&&<span className={combo.pnl>=0?'text-green-600':'text-red-500'}>{combo.pnl>=0?'+':''}${combo.pnl}</span>}
                    <CP c={combo.conf}/>
                    {i===0&&<span className="ml-auto font-bold text-primary text-xs">← Core Setup</span>}
                    {combo.signals.length===1&&<span className="text-muted-foreground text-xs">individual signal</span>}
                    {combo.signals.length===2&&<span className="text-muted-foreground text-xs">pair combo</span>}
                    {combo.signals.length>=3&&<span className="text-muted-foreground text-xs">triple combo</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent></Card>

        {/* Trade Number Analysis */}
        {(results.tradeNumStats||[]).length > 0 && (
          <Card><CardContent className="pt-5">
            <SH icon={BarChart3} title="Trade Number Analysis" sub="Do you perform better on your 1st, 2nd, or 3rd trade of the day?" color="text-purple-500"/>
            <div className="space-y-2">
              {(results.tradeNumStats||[]).map((s,i) => {
                const best = s.winRate === Math.max(...(results.tradeNumStats||[]).map(x=>x.winRate));
                return (
                  <div key={i} className={`p-3 rounded-lg border ${best?'border-green-500/30 bg-green-500/5':'border-transparent bg-muted'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {best && <span className="text-xs font-black text-green-600">BEST</span>}
                        <span className="font-medium text-sm">Trade #{s.num}</span>
                      </div>
                      <span className={`font-bold text-sm ${s.winRate>=60?'text-green-500':s.winRate<45?'text-red-500':'text-yellow-500'}`}>{s.winRate}%</span>
                    </div>
                    <div className="w-full bg-background rounded-full h-1.5 mb-1">
                      <div className={`h-1.5 rounded-full ${s.winRate>=60?'bg-green-500':s.winRate<45?'bg-red-500':'bg-yellow-500'}`} style={{width:`${s.winRate}%`}}/>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.count} trades{s.pnl!==0?` · ${s.pnl>=0?'+':''}$${s.pnl}`:''}</p>
                  </div>
                );
              })}
            </div>
            {(results.tradeNumStats||[]).length >= 2 && (() => {
              const best = (results.tradeNumStats||[]).reduce((a,b)=>a.winRate>=b.winRate?a:b, {winRate:0,num:0,count:0,pnl:0});
              const worst = (results.tradeNumStats||[]).reduce((a,b)=>a.winRate<=b.winRate?a:b, {winRate:100,num:0,count:0,pnl:0});
              return best.num !== worst.num ? (
                <div className="mt-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
                    📍 Trade #{best.num} is your best trade of the day ({best.winRate}% WR). Consider stopping after Trade #{worst.num} — it produces only {worst.winRate}% WR.
                  </p>
                </div>
              ) : null;
            })()}
          </CardContent></Card>
        )}

        {/* R:R Analysis */}
        {results.rrAnalysis&&(
          <Card><CardContent className="pt-5">
            <SH icon={BarChart3} title="R:R Analysis" sub="Win rate and P&L by risk-to-reward bracket" color="text-amber-500"/>
            <div className="space-y-2 mb-4">
              {results.rrAnalysis.brackets.map((b,i)=>(
                <div key={i} className={`p-3 rounded-lg border flex items-center justify-between ${b.label===results.rrAnalysis!.best?'border-green-500/30 bg-green-500/5':b.label===results.rrAnalysis!.worst&&b.winRate<45?'border-red-500/20 bg-red-500/5':'border-transparent bg-muted'}`}>
                  <div><p className="font-medium text-sm">{b.label}</p><p className="text-xs text-muted-foreground">{b.count} trades{b.pnl!==0?` · ${b.pnl>=0?'+':''}$${b.pnl}`:''}</p></div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${b.winRate>=55?'text-green-500':b.winRate<45?'text-red-500':'text-yellow-500'}`}>{b.winRate}% WR</p>
                    {b.label===results.rrAnalysis!.best&&<p className="text-xs text-green-600 font-semibold">Best</p>}
                    {b.label===results.rrAnalysis!.worst&&b.label!==results.rrAnalysis!.best&&<p className="text-xs text-red-500 font-semibold">Worst</p>}
                  </div>
                </div>
              ))}
            </div>
            {results.execGap&&(
              <div className={`p-3 rounded-lg border ${results.execGap.actual<results.execGap.planned?'bg-orange-500/10 border-orange-500/20':'bg-green-500/10 border-green-500/20'}`}>
                <p className="text-sm font-medium">⚡ {results.execGap.msg}</p>
                <p className="text-xs text-muted-foreground mt-1">Planned avg: {results.execGap.planned}R · Actual avg: {results.execGap.actual}R</p>
              </div>
            )}
          </CardContent></Card>
        )}

        {/* Confluence Performance Clusters */}
        {(results.clusters||[]).length>0&&(
          <Card><CardContent className="pt-5">
            <SH icon={Activity} title="Confluence Clusters" sub="Which combinations of signals produce the strongest results together — and how much each signal adds" color="text-indigo-500"/>
            <div className="space-y-3">
              {(results.clusters||[]).map((c,i)=>(
                <div key={i} className={`p-4 rounded-xl border ${c.uplift>=15?'border-green-500/30 bg-green-500/5':c.uplift<0?'border-red-500/20 bg-red-500/5':'border-transparent bg-muted'}`}>
                  {/* Signal pills + WR */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex flex-wrap gap-1.5">
                      {c.signals.map((s,j)=>(
                        <span key={j} className={`px-2.5 py-1 rounded-full text-xs font-bold ${i===0&&c.uplift>=10?'bg-indigo-500 text-white':'bg-background border text-foreground'}`}>{s}</span>
                      ))}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xl font-bold ${c.winRate>=60?'text-green-500':c.winRate>=50?'text-yellow-500':'text-red-500'}`}>{c.winRate}%</p>
                      {c.uplift!==0&&(
                        <p className={`text-xs font-semibold ${c.uplift>0?'text-green-600':'text-red-500'}`}>
                          {c.uplift>0?'+':''}{c.uplift}% vs solo
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Insight */}
                  <p className="text-xs text-muted-foreground mb-1.5">{c.insight}</p>
                  {/* Stats row */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span>{c.count} trades</span>
                    {c.pnl!==0&&<span className={c.pnl>=0?'text-green-600':'text-red-500'}>{c.pnl>=0?'+':''}${c.pnl}</span>}
                    <CP c={c.conf}/>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                💡 The cluster with the highest uplift is your best confirmation stack — signals that genuinely add new information, not just repeat the same bias.
              </p>
            </div>
          </CardContent></Card>
        )}

        {/* Behavior Leaks */}
        {results.behaviorLeaks.length>0&&(
          <Card className="border border-orange-500/20"><CardContent className="pt-5">
            <SH icon={Flame} title="Behavior Leaks" sub="Emotional and execution patterns costing you money" color="text-orange-500"/>
            <div className="space-y-3">
              {results.behaviorLeaks.map((l,i)=>(
                <div key={i} className={`p-4 rounded-xl border ${l.impact==='high'?'border-red-500/20 bg-red-500/5':'border-yellow-500/20 bg-yellow-500/5'}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-sm">{l.type}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${l.impact==='high'?'bg-red-500/20 text-red-600':'bg-yellow-500/20 text-yellow-600'}`}>{l.impact.toUpperCase()} IMPACT</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{l.detail}</p>
                </div>
              ))}
            </div>
          </CardContent></Card>
        )}

        {/* Profit Leaks */}
        {results.profitLeaks.length>0&&(
          <Card className="border border-red-500/20"><CardContent className="pt-5">
            <SH icon={DollarSign} title="Profit Leaks" sub="Where money is being lost — fix these first" color="text-red-500"/>
            <div className="space-y-3">
              {results.profitLeaks.map((l,i)=>(
                <div key={i} className="p-4 rounded-xl bg-muted border flex items-start justify-between gap-3">
                  <div><p className="font-semibold text-sm">{l.reason}</p><p className="text-xs text-muted-foreground mt-0.5">{l.count} trades contributing</p></div>
                  <div className="text-right flex-shrink-0"><p className="font-bold text-red-500 text-sm">-${l.loss}</p><p className="text-xs text-muted-foreground">estimated</p></div>
                </div>
              ))}
            </div>
          </CardContent></Card>
        )}

        {/* Edge Decay */}
        {results.edgeDecay&&(
          <Card className={`border ${results.edgeDecay.decaying?'border-red-500/30 bg-red-500/5':'border-green-500/30 bg-green-500/5'}`}><CardContent className="pt-5">
            <SH icon={results.edgeDecay.decaying?TrendingDown:TrendingUp} title={results.edgeDecay.decaying?'Edge Decay Detected':'Edge Strengthening'} sub="Win rate trend across your trading history" color={results.edgeDecay.decaying?'text-red-500':'text-green-500'}/>
            <p className="text-sm mb-3">{results.edgeDecay.msg}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-background border text-center"><p className="text-xl font-bold">{results.edgeDecay.overallWR}%</p><p className="text-xs text-muted-foreground">Overall WR</p></div>
              <div className="p-3 rounded-lg bg-background border text-center"><p className={`text-xl font-bold ${results.edgeDecay.recentWR>=results.edgeDecay.overallWR?'text-green-500':'text-red-500'}`}>{results.edgeDecay.recentWR}%</p><p className="text-xs text-muted-foreground">Recent WR</p></div>
            </div>
          </CardContent></Card>
        )}

        {/* Contradictions */}
        {results.contradictions.length>0&&(
          <Card className="border-2 border-orange-500/30 bg-orange-500/5"><CardContent className="pt-5">
            <SH icon={GitMerge} title="Conflicting Edge Detected" sub="Your data reveals contradictions that may be costing you" color="text-orange-500"/>
            <div className="space-y-3">
              {results.contradictions.map((c,i)=>(
                <div key={i} className="p-4 rounded-lg bg-background border border-orange-500/20">
                  <p className="font-semibold text-sm text-orange-600 mb-1">⚡ {c.title}</p>
                  <p className="text-sm text-muted-foreground">{c.detail}</p>
                </div>
              ))}
            </div>
          </CardContent></Card>
        )}

        {/* What-If */}
        {results.whatIf&&(
          <Card className="border-2 border-indigo-500/30 bg-indigo-500/5"><CardContent className="pt-5">
            <SH icon={FlaskConical} title="What If You Followed Your Rules?" sub={results.whatIf.filter} color="text-indigo-500"/>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 rounded-lg bg-background border text-center">
                <p className="text-xs text-muted-foreground mb-1">Actual (All Trades)</p>
                <p className="text-2xl font-bold">{results.whatIf.origWR}% WR</p>
                {results.whatIf.origPnL!==0&&<p className={`text-sm font-medium mt-1 ${results.whatIf.origPnL>=0?'text-green-500':'text-red-500'}`}>{results.whatIf.origPnL>=0?'+':''}${results.whatIf.origPnL}</p>}
              </div>
              <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-center">
                <p className="text-xs text-muted-foreground mb-1">Simulated (Rules Only)</p>
                <p className="text-2xl font-bold text-indigo-600">{results.whatIf.simWR}% WR</p>
                {results.whatIf.simPnL!==0&&<p className={`text-sm font-medium mt-1 ${results.whatIf.simPnL>=0?'text-green-500':'text-red-500'}`}>{results.whatIf.simPnL>=0?'+':''}${results.whatIf.simPnL}</p>}
              </div>
            </div>
            <div className={`p-3 rounded-lg border ${results.whatIf.delta>0?'bg-green-500/10 border-green-500/20':'bg-muted border-transparent'}`}>
              <div className="flex items-center gap-2">
                <Lightbulb className={`w-4 h-4 flex-shrink-0 ${results.whatIf.delta>0?'text-green-500':'text-muted-foreground'}`}/>
                <p className="text-sm font-medium">
                  {results.whatIf.delta>0 ? `Following this filter would have improved your P&L by $${results.whatIf.delta} by removing ${results.whatIf.removed} lower-quality trade${results.whatIf.removed!==1?'s':''}.` : `Filtering to this setup shows minimal P&L difference across ${results.whatIf.removed} removed trades.`}
                </p>
              </div>
            </div>
          </CardContent></Card>
        )}

        {/* Personal Playbook */}
        {results.playbook&&(
          <Card className="border-2 border-green-500/30 bg-green-500/5"><CardContent className="pt-5">
            <div className="flex items-start justify-between mb-4">
              <SH icon={CheckCircle2} title="Your Personal Playbook" sub="AI-built rule set from your actual trading data — not generic advice" color="text-green-500"/>
              <button onClick={()=>setStrictMode(s=>!s)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex-shrink-0 mt-1 ${strictMode?'bg-green-500/20 text-green-600 border-green-500/30':'bg-muted text-muted-foreground border-transparent'}`}>
                {strictMode?<ToggleRight className="w-4 h-4"/>:<ToggleLeft className="w-4 h-4"/>}
                Strict {strictMode?'ON':'OFF'}
              </button>
            </div>
            <div className="space-y-2 mb-4">
              {(strictMode?results.playbook.rules.slice(0,3):results.playbook.rules).map((rule,i)=>(
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-background border">
                  <span className="text-green-500 font-bold mt-0.5 flex-shrink-0">✓</span>
                  <p className="text-sm">{rule}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div><p className="text-xs text-muted-foreground">Estimated Win Rate</p><p className="text-2xl font-bold text-green-500">{results.playbook.estWR}%</p></div>
              <CP c={results.playbook.conf}/>
            </div>
          </CardContent></Card>
        )}

        {/* Blueprint */}
        {results.blueprint&&(
          <Card className="border-2 border-primary/30"><CardContent className="pt-5">
            <SH icon={Target} title="🧠 Your Strategy Blueprint" sub="A real, tradable system built entirely from your data" color="text-primary"/>
            <div className="space-y-3">
              {([
                {icon:'🌍',title:'Market Conditions',  items:results.blueprint.marketConditions},
                {icon:'🎯',title:'Entry Model',         items:results.blueprint.entryModel},
                {icon:'🛡️',title:'Risk Model',          items:results.blueprint.riskModel},
                {icon:'⚡',title:'Execution Rules',     items:results.blueprint.executionRules},
              ]).map(s=>(
                <div key={s.title} className="p-4 rounded-xl bg-muted border">
                  <p className="font-bold text-sm mb-2">{s.icon} {s.title}</p>
                  <ul className="space-y-1.5">
                    {s.items.map((item,j)=>(
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5"/><span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20 text-center space-y-2">
              <p className="text-sm font-bold text-primary">"Here is your edge. Here is your system. Trade this."</p>
              <CP c={results.conf}/>
            </div>
          </CardContent></Card>
        )}

        {/* Next Steps */}
        <Card><CardContent className="pt-5">
          <SH icon={TrendingUp} title="🚀 How To Improve This Strategy" sub="Specific next steps based on your current data quality" color="text-blue-500"/>
          <div className="space-y-2">
            {results.nextSteps.map((step,i)=>(
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                <p className="text-sm">{step}</p>
              </div>
            ))}
          </div>
        </CardContent></Card>

        {/* Rules Compliance Analysis — only shown if user has rules */}
        {(() => {
          const userRules = (storage.getRules ? storage.getRules() : [])
            .filter((r: any) => r.userId === currentUser?.id && r.title?.trim());
          if (!userRules || userRules.length === 0) return null;

          const entries = storage.getJournalEntries().filter((e: any) => e.userId === currentUser?.id && !e.isNoTradeDay);
          const totalTrades = entries.length;
          if (totalTrades === 0) return null;

          const isWin = (e: any) => e.result === 'win' || e.result === 'breakeven';

          // ── Per-rule compliance checkers ─────────────────────────────────────
          // Each rule maps to a function that checks a trade and returns true/false/null
          // null = not verifiable from data (skip from compliance calc)
          type RuleCheck = (e: any, allEntries: any[]) => boolean | null;

          const ruleCheckers: Record<string, RuleCheck> = {
            // Confluence rules — check customFields
            'SMT': (e) => {
              const v = e.customFields?.['SMT'];
              return v != null ? (v === true || v === 'true') : null;
            },
            'IFVG and/or CISD': (e) => {
              const ifvg = e.customFields?.['IFVG'];
              const cisd = e.customFields?.['CISD'];
              if (ifvg == null && cisd == null) return null;
              return (ifvg === true || ifvg === 'true') || (cisd === true || cisd === 'true');
            },
            'Liq sweep into HTF PDA': (e) => {
              const ls = e.customFields?.['Liq Sweep'] ?? e.customFields?.['Liq Sweep + HTF Gap'];
              return ls != null ? (ls === true || ls === 'true') : null;
            },
            'HTF DOL': (e) => {
              const dol = e.customFields?.['DOL Remaining'] ?? e.customFields?.['DOL remaning'];
              return dol != null ? (dol === true || dol === 'true') : null;
            },
            'DOL must still be avaliable': (e) => {
              const dol = e.customFields?.['DOL Remaining'] ?? e.customFields?.['DOL remaning'];
              return dol != null ? (dol === true || dol === 'true') : null;
            },
            // Session rule — check entry time
            'Only take trades during killzones, primarily 9:30-11': (e) => {
              const t = e.customFields?.['Entry Time'] ?? e.customFields?.['Entry time'];
              if (!t) return null;
              const h = parseHour(String(t));
              if (h == null) return null;
              // Kill zones: Asia KZ 20-24, London KZ 2-5, NY KZ 9:30-11
              return (h >= 20) || (h >= 2 && h < 5) || (h >= 9.5 && h <= 11);
            },
            // Trade count rules — check per day
            '3 trades per day': (e, all) => {
              const dayTrades = all.filter(x => x.date === e.date);
              const idx = dayTrades.findIndex(x => x.id === e.id);
              return idx < 3; // trade is within the first 3 of the day
            },
            '2 loss= no more trades ': (e, all) => {
              const dayTrades = all.filter(x => x.date === e.date).sort((a,b) => (a.timestamp||0) - (b.timestamp||0));
              const idx = dayTrades.findIndex(x => x.id === e.id);
              if (idx === 0) return true; // first trade always ok
              const tradesBeforeThis = dayTrades.slice(0, idx);
              const lossesBeforeThis = tradesBeforeThis.filter(x => x.result === 'loss').length;
              return lossesBeforeThis < 2;
            },
            // Journaling rule — has description
            'Journal every trade': (e) => {
              return !!(e.description && e.description.trim().length > 5);
            },
            // RR rule — check riskReward
            'Must have pre determined BE point': (e) => {
              return e.riskReward != null && e.riskReward > 0;
            },
            'TP must be determined': (e) => {
              return e.riskReward != null && e.riskReward > 0;
            },
          };

          // Rules that can't be verified from trade data — show as "Not verifiable"
          const unverifiable = [
            '$350 per trade on funded (50k)',
            '1% portfolio risk',
            '1 win= done UNLES A+ setup (must derisk)',
            'Discount to long, premium to short',
            "Stop doesn't get moved past BE",
            'Must have session planned out if planning to trade that session',
            'Never panic sell',
            'Never chase hype ',
          ];

          // Score each rule
          const ruleStats = userRules.map((rule: any) => {
            if (unverifiable.includes(rule.title)) {
              return { rule, verifiable: false, compliant: 0, violations: 0, wr: null, pnl: 0 };
            }
            const checker = ruleCheckers[rule.title];
            if (!checker) {
              return { rule, verifiable: false, compliant: 0, violations: 0, wr: null, pnl: 0 };
            }
            let compliant = 0, violations = 0, compWins = 0, violWins = 0;
            let compPnL = 0, violPnL = 0;
            entries.forEach((e: any) => {
              const result = checker(e, entries);
              if (result === null) return; // not verifiable for this trade
              if (result) {
                compliant++;
                if (isWin(e)) compWins++;
                compPnL += e.pnl || 0;
              } else {
                violations++;
                if (isWin(e)) violWins++;
                violPnL += e.pnl || 0;
              }
            });
            const total = compliant + violations;
            const wr = total > 0 ? Math.round(compWins / Math.max(compliant,1) * 100) : null;
            const violWR = violations > 0 ? Math.round(violWins / violations * 100) : null;
            return { rule, verifiable: true, compliant, violations, wr, violWR, pnl: compPnL, violPnL };
          });

          // Overall: verifiable rules only
          const verifiableStats = ruleStats.filter((rs: any) => rs.verifiable);
          const totalVerifiable = verifiableStats.reduce((s: number, rs: any) => s + rs.compliant + rs.violations, 0);
          const totalCompliant  = verifiableStats.reduce((s: number, rs: any) => s + rs.compliant, 0);
          const adherenceRate   = totalVerifiable > 0 ? Math.round(totalCompliant / totalVerifiable * 100) : 0;

          // Overall WR when following rules vs breaking them
          const compEntries = entries.filter((e: any) =>
            verifiableStats.some((rs: any) => {
              const checker = ruleCheckers[rs.rule.title];
              return checker && checker(e, entries) === true;
            })
          );
          const violEntries = entries.filter((e: any) =>
            verifiableStats.some((rs: any) => {
              const checker = ruleCheckers[rs.rule.title];
              return checker && checker(e, entries) === false;
            })
          );
          const compWR   = compEntries.length > 0 ? Math.round(compEntries.filter(isWin).length / compEntries.length * 100) : 0;
          const nonCompWR= violEntries.length > 0 ? Math.round(violEntries.filter(isWin).length / violEntries.length * 100) : 0;
          const compPnL  = compEntries.reduce((s: number, e: any) => s + (e.pnl||0), 0);
          const nonCompPnL= violEntries.reduce((s: number, e: any) => s + (e.pnl||0), 0);

          const wrDiff = compWR - nonCompWR;
          const verdict = wrDiff >= 10
            ? { icon: '🟢', text: 'Rules are improving performance — continue using them', color: 'text-green-600', bg: 'bg-green-500/10 border-green-500/20' }
            : wrDiff >= 0
            ? { icon: '🟡', text: 'Mixed results — some rules help, some may need adjustment', color: 'text-yellow-600', bg: 'bg-yellow-500/10 border-yellow-500/20' }
            : { icon: '🔴', text: 'Rules are not improving performance — strategy needs revision', color: 'text-red-600', bg: 'bg-red-500/10 border-red-500/20' };

          return (
            <Card className="border-2 border-purple-500/30">
              <CardContent className="pt-5">
                <SH icon={Target} title="📋 Rules Compliance Analysis" sub="Matched against your actual trade data — not free text" color="text-purple-500"/>

                {/* Adherence Rate */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-muted border text-center">
                    <p className="text-xs text-muted-foreground mb-1">Rule Adherence</p>
                    <p className="text-3xl font-bold">{adherenceRate}%</p>
                    <p className="text-xs text-muted-foreground">{totalCompliant} / {totalVerifiable} checks</p>
                  </div>
                  <div className={`p-3 rounded-xl border text-center ${verdict.bg}`}>
                    <p className="text-xs text-muted-foreground mb-2">Verdict</p>
                    <p className={`text-lg font-bold ${verdict.color}`}>{verdict.icon}</p>
                  </div>
                </div>

                {/* Performance Comparison */}
                <div className="space-y-2 mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Performance Comparison</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-xs font-semibold text-green-600 mb-1.5">✅ Rule-following</p>
                      <p className="text-xl font-bold">{compWR}% WR</p>
                      <p className="text-xs text-muted-foreground">{compEntries.length} trades</p>
                      {compPnL !== 0 && <p className={`text-xs font-medium mt-1 ${compPnL >= 0 ? 'text-green-600' : 'text-red-500'}`}>{compPnL >= 0 ? '+' : ''}${compPnL.toFixed(0)}</p>}
                    </div>
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-xs font-semibold text-red-600 mb-1.5">❌ Rule-breaking</p>
                      <p className="text-xl font-bold">{nonCompWR}% WR</p>
                      <p className="text-xs text-muted-foreground">{violEntries.length} trades</p>
                      {nonCompPnL !== 0 && <p className={`text-xs font-medium mt-1 ${nonCompPnL >= 0 ? 'text-green-600' : 'text-red-500'}`}>{nonCompPnL >= 0 ? '+' : ''}${nonCompPnL.toFixed(0)}</p>}
                    </div>
                  </div>
                </div>

                {/* Per-rule breakdown */}
                <div className="space-y-2 mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rule Effectiveness</p>
                  {ruleStats.map((rs: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-muted border flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{rs.rule.title}</p>
                        {rs.verifiable && rs.violations > 0 && (
                          <p className="text-xs text-red-500 mt-0.5">{rs.violations} violation{rs.violations > 1 ? 's' : ''} detected</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {!rs.verifiable ? (
                          <p className="text-xs text-muted-foreground">Manual check</p>
                        ) : rs.compliant + rs.violations === 0 ? (
                          <p className="text-xs text-muted-foreground">No data</p>
                        ) : (
                          <>
                            <p className={`text-sm font-bold ${rs.violations === 0 ? 'text-green-600' : rs.compliant === 0 ? 'text-red-500' : 'text-yellow-600'}`}>
                              {rs.violations === 0 ? '✅' : rs.compliant === 0 ? '❌' : '⚠️'} {rs.compliant}/{rs.compliant + rs.violations}
                            </p>
                            {rs.wr != null && <p className="text-xs text-muted-foreground">{rs.wr}% WR when followed</p>}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Final Verdict */}
                <div className={`p-4 rounded-xl border ${verdict.bg}`}>
                  <p className={`text-sm font-bold ${verdict.color}`}>{verdict.icon} {verdict.text}</p>
                </div>
              </CardContent>
            </Card>
          );
        })()}

      </>)}
    </div>
  );
}
