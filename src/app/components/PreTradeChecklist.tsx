import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { CheckSquare, AlertTriangle } from 'lucide-react';
import { storage } from '../utils/storage';

interface PreTradeChecklistProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (followedRules: boolean) => void;
  tradingStyle?: string;
}

export function PreTradeChecklist({ open, onOpenChange, onComplete, tradingStyle }: PreTradeChecklistProps) {
  const isInvestor = tradingStyle === 'Long Term Hold';
  
  const [checks, setChecks] = useState({
    setup: false,
    risk: false,
    emotional: false,
    confirmation: false,
    notRevenge: false,
  });

  const allChecked = Object.values(checks).every(v => v);

  const handleCheckChange = (key: keyof typeof checks, value: boolean) => {
    setChecks(prev => ({ ...prev, [key]: value }));
  };

  const handleProceed = (followedRules: boolean) => {
    onComplete(followedRules);
    // Reset checks for next time
    setChecks({
      setup: false,
      risk: false,
      emotional: false,
      confirmation: false,
      notRevenge: false,
    });
  };

  // Different questions for traders vs investors
  const questions = isInvestor ? {
    setup: 'Does this investment match your thesis and criteria?',
    risk: 'Is your position size within your plan?',
    emotional: 'Are you calm and making a rational decision?',
    confirmation: 'Have you completed your due diligence?',
    notRevenge: 'Is this based on analysis, not emotion?',
  } : {
    setup: 'Does this trade match your setup?',
    risk: 'Is your risk within plan?',
    emotional: 'Are you calm and not emotional?',
    confirmation: 'Did you wait for confirmation?',
    notRevenge: 'Is this revenge trading?',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-500" />
            Pre-{isInvestor ? 'Investment' : 'Trade'} Checklist
          </DialogTitle>
          <DialogDescription>
            Ensure you're following your discipline plan before proceeding
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {Object.entries(questions).map(([key, question]) => (
            <div key={key} className="flex items-start gap-3">
              <Checkbox
                id={key}
                checked={checks[key as keyof typeof checks]}
                onCheckedChange={(checked) => 
                  handleCheckChange(key as keyof typeof checks, checked as boolean)
                }
                className="mt-0.5"
              />
              <Label 
                htmlFor={key}
                className="text-sm font-normal cursor-pointer leading-relaxed"
              >
                {question}
              </Label>
            </div>
          ))}

          {!allChecked && (
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mt-4">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-600 dark:text-yellow-500">
                Complete all items before proceeding. This ensures you're following your discipline plan.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={() => handleProceed(true)}
            disabled={!allChecked}
            className="w-full"
          >
            ✓ All Rules Followed - Proceed
          </Button>
          <Button
            onClick={() => handleProceed(false)}
            variant="outline"
            className="w-full text-orange-600 border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
          >
            ⚠ Rule(s) Broken - Log Anyway
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="w-full"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
