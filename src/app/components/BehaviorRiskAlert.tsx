import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from './ui/alert-dialog';
import { Button } from './ui/button';
import { AlertTriangle, Shield } from 'lucide-react';
import { useNavigate } from 'react-router';

export type BehaviorRiskType = 
  | 'revenge_trading'
  | 'outside_hours'
  | 'repeated_violations'
  | 'emotional_selling';

interface BehaviorRiskAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riskType: BehaviorRiskType;
  tradingStyle?: string;
}

export function BehaviorRiskAlert({ open, onOpenChange, riskType, tradingStyle }: BehaviorRiskAlertProps) {
  const navigate = useNavigate();
  const isInvestor = tradingStyle === 'Long Term Hold';

  const riskMessages = {
    revenge_trading: {
      title: '🚨 Revenge Trading Pattern Detected',
      description: 'You\'ve made multiple trades after a loss. This is a common emotional pattern that leads to bigger losses.',
      actions: [
        { label: 'Open RevengeX', onClick: () => { onOpenChange(false); navigate('/app/revengex'); } },
        { label: 'Review Rules', onClick: () => { onOpenChange(false); navigate('/app/rules'); } },
        { label: 'Start Breathing Reset', onClick: () => { onOpenChange(false); alert('Take 5 deep breaths. Breathe in for 4, hold for 4, out for 4.'); } },
      ],
    },
    outside_hours: {
      title: '⚠️ Trading Outside Defined Hours',
      description: isInvestor 
        ? 'You\'re reviewing positions outside your normal review schedule. Stick to your discipline plan.'
        : 'You\'re trading outside your planned hours. This often leads to poor decisions.',
      actions: [
        { label: 'View My Schedule', onClick: () => { onOpenChange(false); navigate('/app/settings'); } },
        { label: 'Review Rules', onClick: () => { onOpenChange(false); navigate('/app/rules'); } },
      ],
    },
    repeated_violations: {
      title: '🔴 Repeated Rule Violations Detected',
      description: 'You\'ve broken your rules multiple times recently. This pattern requires immediate attention.',
      actions: [
        { label: 'Open RevengeX', onClick: () => { onOpenChange(false); navigate('/app/revengex'); } },
        { label: 'Review Rules', onClick: () => { onOpenChange(false); navigate('/app/rules'); } },
        { label: 'Stop Trading Today', onClick: () => { onOpenChange(false); alert('Good decision. Take the rest of the day off and reflect.'); } },
      ],
    },
    emotional_selling: {
      title: '📉 Emotional Selling Pattern Detected',
      description: 'You\'re selling earlier than planned. Is your thesis broken or are you reacting to price movement?',
      actions: [
        { label: 'Review Thesis', onClick: () => { onOpenChange(false); navigate('/app/journal'); } },
        { label: 'View Investment Rules', onClick: () => { onOpenChange(false); navigate('/app/rules'); } },
      ],
    },
  };

  const config = riskMessages[riskType];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md border-orange-500/20">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/10 rounded-full">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
            <AlertDialogTitle className="text-lg">{config.title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            {config.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="bg-orange-500/5 border border-orange-500/10 rounded-lg p-4 my-4">
          <div className="flex items-start gap-2">
            <Shield className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-orange-600 dark:text-orange-500">Discipline Protection</p>
              <p className="text-muted-foreground mt-1">
                Taking action now can prevent larger mistakes. Choose an option below.
              </p>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          {config.actions.map((action, idx) => (
            <Button
              key={idx}
              onClick={action.onClick}
              variant={idx === 0 ? 'default' : 'outline'}
              className="w-full"
            >
              {action.label}
            </Button>
          ))}
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="w-full"
          >
            Ignore (I understand the risk)
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
