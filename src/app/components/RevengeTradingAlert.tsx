import { AlertTriangle, X } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

interface RevengeTradingAlertProps {
  onClose: () => void;
  onGoToRevengeX: () => void;
}

export function RevengeTradingAlert({ onClose, onGoToRevengeX }: RevengeTradingAlertProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full border-red-500 border-2 shadow-2xl animate-in fade-in zoom-in duration-300">
        <CardContent className="pt-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            <h2 className="text-2xl font-bold text-red-500">
              ⚠️ REVENGE TRADING DETECTED
            </h2>

            <div className="space-y-2 text-left bg-muted p-4 rounded-lg">
              <p className="text-sm font-semibold">Warning Signs:</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Multiple trades after a loss</li>
                <li>• Trading in quick succession</li>
                <li>• Emotional decision-making detected</li>
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              You're exhibiting revenge trading behavior. This is dangerous and often leads to bigger losses.
              <span className="block mt-2 font-semibold text-foreground">
                Take a break. Follow your discipline protocol.
              </span>
            </p>

            <div className="space-y-2 pt-2">
              <Button
                onClick={onGoToRevengeX}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
              >
                Go to RevengeX - Get Help
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full"
              >
                I Understand, Close Warning
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
