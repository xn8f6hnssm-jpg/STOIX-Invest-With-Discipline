import { Button } from './ui/button';
import { Share2, Download, Crown } from 'lucide-react';
import html2canvas from 'html2canvas';
import { storage, getLeague } from '../utils/storage';
import { useRef, useState } from 'react';
import { Logo } from './Logo';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { VisuallyHidden } from './ui/visually-hidden';

// Component for sharing discipline stats as a card
export function DisciplineShareCard() {
  const [isOpen, setIsOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const currentUser = storage.getCurrentUser();
  
  if (!currentUser) return null;

  const isPremium = storage.isPremium();
  const league = getLeague(currentUser.totalPoints || 0);
  
  // Get journal entries for calculating trades and wins
  const journalEntries = storage.getJournalEntries().filter(e => e.userId === currentUser.id);
  const totalTrades = journalEntries.length;
  const wins = journalEntries.filter(e => e.result === 'win' || e.result === 'breakeven').length;
  
  // Discipline rate is still based on daily check (following rules)
  const totalDays = (currentUser.cleanDays || 0) + (currentUser.forfeitDays || 0);
  const disciplineRate = totalDays > 0 ? Math.round((currentUser.cleanDays / totalDays) * 100) : 0;
  
  // Streak is based on following rules (current streak)
  const streak = currentUser.currentStreak || 0;

  const handleShare = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#000000',
        scale: 2,
      });

      canvas.toBlob((blob) => {
        if (!blob) return;

        // Check if Web Share API is available
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], 'stoix-discipline-card.png', { type: 'image/png' });
          navigator.share({
            title: 'STOIX - My Trading Discipline',
            text: `I'm maintaining ${disciplineRate}% discipline rate in my trading journey! 🚀`,
            files: [file],
          }).catch((err) => console.log('Share cancelled', err));
        } else {
          // Fallback: Download image
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
        className="flex items-center gap-1"
      >
        <Share2 className="w-3 h-3" />
        Share
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
              className="w-full aspect-square bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-8 flex flex-col justify-between"
            >
              {/* Top Header */}
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <Logo size="md" showText={false} />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg font-semibold text-white">{currentUser.name}</span>
                  {isPremium && (
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600">
                      <Crown className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Main Stat - Discipline Rate (Prominent) */}
              <div className="text-center space-y-2">
                <div className="text-7xl font-bold text-white">
                  {disciplineRate}%
                </div>
                <p className="text-xl text-slate-300 font-semibold">Discipline Rate</p>
              </div>

              {/* Stats Section */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">{totalTrades}</div>
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
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
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