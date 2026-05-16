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

  const streak  = currentUser.currentStreak || 0;
  const league  = getLeague(currentUser.totalPoints || 0);
  const isPremium = storage.isPremium();

  const capture = async (): Promise<Blob | null> => {
    console.log('capture called, cardRef:', cardRef.current);
    if (!cardRef.current) { console.log('NO REF — returning null'); return null; }
    console.log('domtoimage:', domtoimage);
    try {
      const blob = await domtoimage.toBlob(cardRef.current, { scale: 2 });
      console.log('blob result:', blob, 'size:', blob?.size);
      return blob;
    } catch (err) {
      console.error('Capture error:', err);
      return null;
    }
  };

  const handleShare = async () => {
    console.log('handleShare clicked');
    const blob = await capture();
    console.log('blob from capture:', blob);
    if (!blob) return;
    if (navigator.share && navigator.canShare) {
      navigator.share({
        title: 'STOIX',
        text: `${disciplineRate}% discipline — ${LABELS[range]} 🚀`,
        files: [new File([blob], 'stoix-card.png', { type: 'image/png' })],
      }).catch((e) => console.error('Share error:', e));
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'stoix-card.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownload = async () => {
    console.log('handleDownload clicked');
    const blob = await capture();
    console.log('blob from capture:', blob);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stoix-card.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {/* Range pills */}
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

      {/* Card — fully inline styled so dom-to-image captures correctly */}
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
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', letterSpacing: '4px', marginBottom: '4px' }}>STOIX</div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff', marginBottom: '2px' }}>
            {currentUser.name}{isPremium && ' 👑'}
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px' }}>{LABELS[range]}</div>
        </div>

        {/* Main stat */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '72px', fontWeight: '800', color: '#ffffff', lineHeight: 1 }}>{disciplineRate}%</div>
          <div style={{ fontSize: '15px', color: '#cbd5e1', fontWeight: '600', marginTop: '4px' }}>Discipline Rate</div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff' }}>{trades}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Trades</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff' }}>{wins}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Wins</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff' }}>🔥 {streak}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Streak</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff' }}>{league.tier} {league.roman}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>League</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#cbd5e1', letterSpacing: '3px' }}>STOIX</div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>Trade With Discipline</div>
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
