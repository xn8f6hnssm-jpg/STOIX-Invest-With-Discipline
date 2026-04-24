import { Button } from './ui/button';
import { Share2, Download, Crown } from 'lucide-react';
import html2canvas from 'html2canvas';
import { storage, getLeague } from '../utils/storage';
import { useRef, useState, useEffect } from 'react';
import { Logo } from './Logo';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { VisuallyHidden } from './ui/visually-hidden';

interface DisciplineShareCardProps {
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'overall';
  periodTrades?: number;
  periodWins?: number;
  periodDiscipline?: number;
}

export function DisciplineShareCard({
  period = 'overall',
  periodTrades,
  periodWins,
  periodDiscipline,
}: DisciplineShareCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const currentUser = storage.getCurrentUser();

  // Track current display values reactively — update whenever props change
  const [displayPeriod, setDisplayPeriod]     = useState(period);
  const [displayTrades, setDisplayTrades]     = useState<number | undefined>(periodTrades);
  const [displayWins, setDisplayWins]         = useState<number | undefined>(periodWins);
  const [displayDiscipline, setDisplayDiscipline] = useState<number | undefined>(periodDiscipline);

  useEffect(() => {
    setDisplayPeriod(period);
    setDisplayTrades(periodTrades);
    setDisplayWins(periodWins);
    setDisplayDiscipline(periodDiscipline);
  }, [period, periodTrades, periodWins, periodDiscipline]);

  if (!currentUser) return null;

  const isPremium = storage.isPremium();
  const league = getLeague(currentUser.totalPoints || 0);

  // All-time fallbacks
  const journalEntries = storage.getJournalEntries().filter(e => e.userId === currentUser.id);
  const allTimeTrades = journalEntries.length;
  const allTimeWins = journalEntries.filter(e => e.result === 'win' || e.result === 'breakeven').length;
  const totalDays = (currentUser.cleanDays || 0) + (currentUser.forfeitDays || 0);
  const allTimeDiscipline = totalDays > 0 ? Math.round((currentUser.cleanDays / totalDays) * 100) : 0;

  const trades      = displayTrades      ?? allTimeTrades;
  const wins        = displayWins        ?? allTimeWins;
  const discipline  = displayDiscipline  ?? allTimeDiscipline;
  const streak      = currentUser.currentStreak || 0;

  const periodLabel = {
    daily:   'Today',
    weekly:  'This Week',
    monthly: 'This Month',
    yearly:  'This Year',
    overall: 'All Time',
  }[displayPeriod];

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#000000',
        scale: 2,
      });
      canvas.toBlob((blob) => {
        if (!blob) return;
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], 'stoix-discipline-card.png', { type: 'image/png' });
          navigator.share({
            title: 'STOIX - My Trading Discipline',
            text: `I'm maintaining ${discipline}% discipline rate in my trading journey! 🚀`,
            files: [file],
          }).catch((err) => console.log('Share cancelled', err));
        } else {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'stoix-discipline-card.png';
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error('Error generating share card:', error);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#000000',
        scale: 2,
      });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'stoix-discipline-card.png';
        link.click();
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error('Error downloading card:', error);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 w-full"
      >
        <Share2 className="w-3 h-3" />
        Share Card
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <VisuallyHidden>
            <DialogTitle>Share Your Discipline Card</DialogTitle>
            <DialogDescription>
              Share or download your trading discipline stats card
            </DialogDescription>
          </VisuallyHidden>
          <div className="space-y-4">
          <div
            ref={cardRef}
            key={`${displayPeriod}-${trades}-${wins}-${discipline}`}
            className="w-full aspect-square bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-8 flex flex-col justify-between"
          >
              {/* Top Header */}
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <Logo size="md" showText={false} darkMode={true} />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg font-semibold text-white">{currentUser.name}</span>
                  {isPremium && (
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600">
                      <Crown className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 uppercase tracking-widest">{periodLabel}</p>
              </div>

              {/* Main Stat */}
              <div className="text-center space-y-2">
                <div className="text-7xl font-bold text-white">{discipline}%</div>
                <p className="text-xl text-slate-300 font-semibold">Discipline Rate</p>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">{trades}</div>
                    <p className="text-sm text-slate-400">Trades</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{wins}</div>
                    <p className="text-sm text-slate-400">Wins</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">🔥 {streak}</div>
                    <p className="text-sm text-slate-400">Streak</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{league.tier} {league.roman}</div>
                    <p className="text-sm text-slate-400">League</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-white">STOIX</p>
                <p className="text-xs text-slate-400">Trade With Discipline</p>
                <p className="text-xs text-slate-500">
                  {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleShare} className="w-full">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button onClick={handleDownload} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
