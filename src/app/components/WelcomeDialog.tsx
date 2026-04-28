import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { CheckCircle, Shield, Target, Trophy, Users } from 'lucide-react';
import { storage } from '../utils/storage';

export function WelcomeDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Per-user key so it only shows once per account, not every device load
    const user = storage.getCurrentUser();
    const key = user ? `hasSeenWelcome_${user.id}` : 'hasSeenWelcome';
    const hasSeenWelcome = localStorage.getItem(key);
    if (!hasSeenWelcome) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    const user = storage.getCurrentUser();
    const key = user ? `hasSeenWelcome_${user.id}` : 'hasSeenWelcome';
    localStorage.setItem(key, 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to STOIX! 🎯</DialogTitle>
          <DialogDescription className="text-base">
            Your journey to trading discipline starts here
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <p className="text-muted-foreground">
            STOIX helps you build trading discipline through accountability, gamification, and social support. Here's how it works:
          </p>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Daily Check-In</h3>
                <p className="text-sm text-muted-foreground">
                  Log your trading day. Did you follow your rules? Earn points for clean days!
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Forfeits for Accountability</h3>
                <p className="text-sm text-muted-foreground">
                  Broke a rule? Spin the forfeit wheel and complete your challenge. Turn mistakes into growth!
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">League System</h3>
                <p className="text-sm text-muted-foreground">
                  Progress from Bronze to Platinum as you accumulate points and maintain discipline.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">RevengeX</h3>
                <p className="text-sm text-muted-foreground">
                  About to revenge trade? Hit the panic button for a 60-second breathing exercise and reality check.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Social Community</h3>
                <p className="text-sm text-muted-foreground">
                  Share your progress, support others, and build accountability with fellow traders.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm font-medium mb-2">💡 Pro Tip:</p>
            <p className="text-sm text-muted-foreground">
              Consistency is key! Log your day every trading session, journal your learnings, and watch your discipline rate climb.
            </p>
          </div>
        </div>

        <Button onClick={handleClose} className="w-full" size="lg">
          Let's Get Started!
        </Button>
      </DialogContent>
    </Dialog>
  );
}
