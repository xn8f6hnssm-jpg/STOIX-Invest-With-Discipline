import { useState } from 'react';
import { Button } from './ui/button';
import { Share2, Download, Crown } from 'lucide-react';
import html2canvas from 'html2canvas';
import { storage, getLeague } from '../utils/storage';
import { useRef } from 'react';
import { Logo } from './Logo';

type Range = 'today' | 'week' | 'month' | 'year' | 'overall';

const LABELS: Record<Range, string> = {
  today:   'Today',
  week:    'This Week',
  month:   'This Month',
  year:    'This Year',
  overall: 'All Time',
};

const PILLS: { key: Range; label: string }[] = [
  { key: 'today',   label: 'Today' },
  { key: 'week',    label: 'Week'  },
  { key: 'month',   label: 'Month' },
  { key: 'year',    label: 'Year'  },
  { key: 'overall', label: 'All'   },
];

function getDateBounds(range: Range): { from: Date | null; todayStr: string } {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  if (range === 'today') return { from: new Date(todayStr + 'T00:00:00'), todayStr };
  if (range === 'week') {
    const s = new Date(now);
    s.setHours(0, 0, 0, 0);
    s.setDate(now.getDate() - now.getDay());
    return { from: s, todayStr };
  }
  if (range === 'month') {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: s, todayStr };
  }
  if (range === 'year') {
    const s = new Date(now.getFullYear(), 0, 1);
    return { from: s, todayStr };
  }
  return { from: null, todayStr };
}

function inRange(dateStr: string, from: Date | null): boolean {
  if (!from) return true;
  const d = new Date(dateStr + 'T00:00:00');
  return d >= from;
}

export function DisciplineShareCard() {
  const [range, setRange] = useState<Range>('overall');
  const cardRef = useRef<HTMLDivElement>(null);
  const currentUser = storage.getCurrentUser();
  if (!currentUser) return null;

  const { from, todayStr } = getDateBounds(range);

  // Trades & Wins
  const allEntries = storage.getJournalEntries()
    .filter((e: any) => e.userId === currentUser.id && !e.isNoTradeDay);
  const periodEntries = allEntries.filter((e: any) => inRange(e.date, from));
  const trades = periodEntries.length;
  const wins   = periodEntries.filter((e: any) => e.result === 'win' || e.result === 'breakeven').length;

  // Discipline Rate
  const allDayLogs = (storage.getDayLogs ? storage.getDayLogs() : [])
    .filter((l: any) => l.userId === currentUser.id);

  let disciplineRate: number;

  if (range === 'overall') {
    const clean = currentUser.cleanDays ?? 0;
    const total = clean + (currentUser.forfeitDays ?? 0);
    disciplineRate = total > 0 ? Math.round(clean / total * 100) : 0;
  } else if (range === 'today') {
    const todayLog = allDayLogs.find((l: any) => l.date === todayStr);
    disciplineRate = todayLog ? (todayLog.isClean === true ? 100 : 0) : 0;
  } else {
    const periodLogs = allDayLogs.filter((l: any) => inRange(l.date, from));
    if (periodLogs.length === 0) {
      disciplineRate = 0;
    } else {
      const cleanCount = periodLogs.filter((l: any) => l.isClean === true).length;
      disciplineRate = Math.round(cleanCount / periodLogs.length * 100);
    }
  }

  const streak  = currentUser.currentStreak || 0;
  const league  = getLeague(currentUser.totalPoints || 0);
  const isPremium = storage.isPremium();

  const capture = () => cardRef.current
    ? html2canvas(cardRef.current, { backgroundColor: '#000000', scale: 2 })
    : Promise.resolve(null);

  const handleShare = async () => {
    const canvas = await capture();
    if (!canvas) return;
    canvas.toBlob(blob => {
      if (!blob) return;
      if (navigator.share && navigator.canShare) {
        navigator.share({
          title: 'STOIX',
          text: `${disciplineRate}% discipline — ${LABELS[range]} 🚀`,
          files: [new File([blob], 'stoix-card.png', { type: 'image/png' })],
        }).catch(() => {});
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'stoix-card.png';
        a.click();
      }
    });
  };

  const handleDownload = async () => {
    const canvas = await capture();
    if (!canvas) return;
    canvas.toBlob(blob => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'stoix-card.png';
      a.click();
    });
  };

  return (
    <div className="space-y-3">
      {/* Range pills — inside the component, own state */}
      <div className="flex gap-1.5 flex-wrap">
        {PILLS.map(p => (
          <button
            key={p.key}
            onClick={() => setRange(p.key)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              range === p.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Card */}
      <div
        ref={cardRef}
        className="w-full aspect-square bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-6 flex flex-col justify-between"
      >
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="flex justify-center">
            <Logo size="sm" showText={false} darkMode={true} />
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-base font-semibold text-white">{currentUser.name}</span>
            {isPremium && (
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                <Crown className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 uppercase tracking-widest">{LABELS[range]}</p>
        </div>

        {/* Discipline */}
        <div className="text-center space-y-1">
          <div className="text-6xl font-bold text-white">{disciplineRate}%</div>
          <p className="text-base text-slate-300 font-semibold">Discipline Rate</p>
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="text-xl font-bold text-white">{trades}</div>
              <p className="text-xs text-slate-400">Trades</p>
            </div>
            <div>
              <div className="text-xl font-bold text-white">{wins}</div>
              <p className="text-xs text-slate-400">Wins</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="text-xl font-bold text-white">🔥 {streak}</div>
              <p className="text-xs text-slate-400">Streak</p>
            </div>
            <div>
              <div className="text-xl font-bold text-white">{league.tier} {league.roman}</div>
              <p className="text-xs text-slate-400">League</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-0.5">
          <p className="text-xs font-semibold text-white">STOIX</p>
          <p className="text-xs text-slate-500">Trade With Discipline</p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={handleShare} size="sm" className="w-full">
          <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share
        </Button>
        <Button onClick={handleDownload} variant="outline" size="sm" className="w-full">
          <Download className="w-3.5 h-3.5 mr-1.5" /> Download
        </Button>
      </div>
    </div>
  );
}
