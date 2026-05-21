import { useState } from 'react';
import { Button } from './ui/button';
import { Share2, Download } from 'lucide-react';
import domtoimage from 'dom-to-image-more';
import { storage, getLeague } from '../utils/storage';
import { useRef } from 'react';

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
const todayStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');  if (range === 'today') return { from: new Date(now.getFullYear(), now.getMonth(), now.getDate()), todayStr };
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
  const [showPnL, setShowPnL] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);
  const currentUser = storage.getCurrentUser();
  if (!currentUser) return null;

  const { from, todayStr } = getDateBounds(range);

  const allDayLogs = (storage.getDayLogs ? storage.getDayLogs() : [])
    .filter((l: any) => l.userId === currentUser.id);

  let disciplineRate: number;
  if (range === 'today') {
    const todayLog = allDayLogs.find((l: any) => l.date === todayStr);
    disciplineRate = todayLog ? (todayLog.isClean === true ? 100 : 0) : 0;
  } else {
    const periodLogs = range === 'overall'
      ? allDayLogs
      : allDayLogs.filter((l: any) => inRange(l.date, from));
    if (periodLogs.length === 0) {
      if (range === 'overall') {
        const clean = currentUser.cleanDays ?? 0;
        const total = clean + (currentUser.forfeitDays ?? 0);
        disciplineRate = total > 0 ? Math.round(clean / total * 100) : 0;
      } else {
        disciplineRate = 0;
      }
    } else {
      const cleanCount = periodLogs.filter((l: any) => l.isClean === true).length;
      disciplineRate = Math.round(cleanCount / periodLogs.length * 100);
    }
  }

  const allEntries = storage.getJournalEntries()
    .filter((e: any) =>
      e.userId === currentUser.id &&
      !e.isNoTradeDay &&
      e.result &&
      e.result !== 'open'
    );
  const periodEntries = range === 'overall'
    ? allEntries
    : allEntries.filter((e: any) => inRange(e.date, from));
  const trades = periodEntries.length;
  const wins = periodEntries.filter((e: any) => e.result === 'win').length;

  // P&L calculation
  const totalPnL = periodEntries.reduce((sum: number, e: any) => sum + (e.pnl || 0), 0);
  const hasPnL = showPnL && periodEntries.some((e: any) => e.pnl != null && e.pnl !== 0);
  const fmtPnL = (val: number) => `${val >= 0 ? '+' : '-'}$${Math.abs(val).toFixed(0)}`;

  const streak = currentUser.currentStreak || 0;
  const league = getLeague(currentUser.totalPoints || 0);
  const isPremium = storage.isPremium();

  const handleDownload = () => {
    if (!cardRef.current) return;
    const a = document.createElement('a');
    a.download = 'stoix-card.png';
    document.body.appendChild(a);
    domtoimage.toBlob(cardRef.current, { scale: 2 }).then((blob: Blob) => {
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }).catch((err: any) => {
      console.error('Download error:', err);
      document.body.removeChild(a);
    });
  };

  const handleShare = () => {
    if (!cardRef.current) return;
    const a = document.createElement('a');
    a.download = 'stoix-card.png';
    document.body.appendChild(a);
    domtoimage.toBlob(cardRef.current, { scale: 2 }).then((blob: Blob) => {
      const file = new File([blob], 'stoix-card.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        document.body.removeChild(a);
        navigator.share({
          title: 'STOIX',
          text: `${disciplineRate}% discipline — ${LABELS[range]} 🚀`,
          files: [file],
        }).catch((e: any) => console.error('Share error:', e));
      } else {
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      }
    }).catch((err: any) => {
      console.error('Share capture error:', err);
      document.body.removeChild(a);
    });
  };

  // Grid: if P&L exists show 3 cols (trades, wins, pnl) + streak + league
  // Otherwise show original 2x2
  const statsGrid = hasPnL ? (
    <>
      {/* Row 1: 3 cols */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', border: 'none', background: 'transparent' }}>
        <div style={{ textAlign: 'center', border: 'none', background: 'transparent', padding: 0 }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', border: 'none', background: 'transparent' }}>{trades}</div>
          <div style={{ fontSize: '10px', color: '#94a3b8', border: 'none', background: 'transparent' }}>Trades</div>
        </div>
        <div style={{ textAlign: 'center', border: 'none', background: 'transparent', padding: 0 }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', border: 'none', background: 'transparent' }}>{wins}</div>
          <div style={{ fontSize: '10px', color: '#94a3b8', border: 'none', background: 'transparent' }}>Wins</div>
        </div>
        <div style={{ textAlign: 'center', border: 'none', background: 'transparent', padding: 0 }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: totalPnL >= 0 ? '#22c55e' : '#ef4444', border: 'none', background: 'transparent' }}>{fmtPnL(totalPnL)}</div>
          <div style={{ fontSize: '10px', color: '#94a3b8', border: 'none', background: 'transparent' }}>P&L</div>
        </div>
      </div>
      {/* Row 2: 2 cols */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', border: 'none', background: 'transparent' }}>
        <div style={{ textAlign: 'center', border: 'none', background: 'transparent', padding: 0 }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', border: 'none', background: 'transparent' }}>🔥 {streak}</div>
          <div style={{ fontSize: '10px', color: '#94a3b8', border: 'none', background: 'transparent' }}>Streak</div>
        </div>
        <div style={{ textAlign: 'center', border: 'none', background: 'transparent', padding: 0 }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', border: 'none', background: 'transparent' }}>{league.tier} {league.roman}</div>
          <div style={{ fontSize: '10px', color: '#94a3b8', border: 'none', background: 'transparent' }}>League</div>
        </div>
      </div>
    </>
  ) : (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', border: 'none', background: 'transparent' }}>
      <div style={{ textAlign: 'center', border: 'none', background: 'transparent', padding: 0 }}>
        <div style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', border: 'none', background: 'transparent' }}>{trades}</div>
        <div style={{ fontSize: '10px', color: '#94a3b8', border: 'none', background: 'transparent' }}>Trades</div>
      </div>
      <div style={{ textAlign: 'center', border: 'none', background: 'transparent', padding: 0 }}>
        <div style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', border: 'none', background: 'transparent' }}>{wins}</div>
        <div style={{ fontSize: '10px', color: '#94a3b8', border: 'none', background: 'transparent' }}>Wins</div>
      </div>
      <div style={{ textAlign: 'center', border: 'none', background: 'transparent', padding: 0 }}>
        <div style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', border: 'none', background: 'transparent' }}>🔥 {streak}</div>
        <div style={{ fontSize: '10px', color: '#94a3b8', border: 'none', background: 'transparent' }}>Streak</div>
      </div>
      <div style={{ textAlign: 'center', border: 'none', background: 'transparent', padding: 0 }}>
        <div style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', border: 'none', background: 'transparent' }}>{league.tier} {league.roman}</div>
        <div style={{ fontSize: '10px', color: '#94a3b8', border: 'none', background: 'transparent' }}>League</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Range pills + P&L toggle */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
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
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showPnL}
            onChange={e => setShowPnL(e.target.checked)}
            className="w-3.5 h-3.5 cursor-pointer"
          />
          <span className="text-xs text-muted-foreground font-medium">Show P&L</span>
        </label>
      </div>

      {/* Card */}
      <div
        ref={cardRef}
        style={{
          width: '100%',
          aspectRatio: '1/1',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          borderRadius: '16px',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          boxSizing: 'border-box',
          border: 'none',
          boxShadow: 'none',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', border: 'none', background: 'transparent', padding: 0, margin: 0 }}>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', letterSpacing: '4px', marginBottom: '4px', border: 'none', background: 'transparent' }}>STOIX</div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff', marginBottom: '2px', border: 'none', background: 'transparent' }}>
            {currentUser.name}{isPremium && ' 👑'}
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', border: 'none', background: 'transparent' }}>{LABELS[range]}</div>
        </div>

        {/* Main stat */}
        <div style={{ textAlign: 'center', border: 'none', background: 'transparent', padding: 0 }}>
          <div style={{ fontSize: '72px', fontWeight: '800', color: '#ffffff', lineHeight: 1, border: 'none', background: 'transparent' }}>{disciplineRate}%</div>
          <div style={{ fontSize: '15px', color: '#cbd5e1', fontWeight: '600', marginTop: '4px', border: 'none', background: 'transparent' }}>Discipline Rate</div>
        </div>

        {/* Stats */}
        {statsGrid}

        {/* Footer */}
        <div style={{ textAlign: 'center', border: 'none', background: 'transparent', padding: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#cbd5e1', letterSpacing: '3px', border: 'none', background: 'transparent' }}>STOIX</div>
          <div style={{ fontSize: '10px', color: '#64748b', border: 'none', background: 'transparent' }}>Trade With Discipline</div>
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
