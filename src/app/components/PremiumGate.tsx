import { ReactNode } from 'react';
import { Crown, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface PremiumGateProps {
  isPremium: boolean;
  featureName: string;
  description?: string;
  onUpgrade: () => void;
  children?: ReactNode;
  variant?: 'banner' | 'overlay' | 'inline' | 'card';
}

export function PremiumGate({
  isPremium,
  featureName,
  description,
  onUpgrade,
  children,
  variant = 'banner'
}: PremiumGateProps) {
  if (isPremium) {
    return <>{children}</>;
  }

  if (variant === 'inline') {
    return (
      <Button
        onClick={onUpgrade}
        variant="outline"
        size="sm"
        className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
      >
        <Crown className="w-4 h-4 mr-2" />
        Upgrade to Premium
      </Button>
    );
  }

  if (variant === 'overlay' || variant === 'card') {
    return (
      <div className="relative rounded-xl overflow-hidden">
        {/* Blurred preview of content behind */}
        {children && (
          <div className="opacity-40 pointer-events-none blur-sm select-none">
            {children}
          </div>
        )}
        {/* Lock overlay */}
        <div className={`${children ? 'absolute inset-0' : ''} flex items-center justify-center p-6`}>
          <div className="bg-background/95 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6 text-center shadow-xl max-w-xs w-full">
            <div className="w-14 h-14 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Crown className="w-7 h-7 text-yellow-500" />
            </div>
            <h3 className="font-bold text-base mb-1">{featureName}</h3>
            {description && (
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{description}</p>
            )}
            <Button onClick={onUpgrade} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
              <Crown className="w-4 h-4 mr-2" />
              Unlock with Premium
            </Button>
            <p className="text-xs text-muted-foreground mt-2">$12.99/mo · Cancel anytime</p>
          </div>
        </div>
      </div>
    );
  }

  // Default banner variant
  return (
    <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-start gap-3">
          <Crown className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">{featureName}</h4>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        <Button
          onClick={onUpgrade}
          size="sm"
          className="bg-yellow-500 hover:bg-yellow-600 text-black shrink-0"
        >
          <Crown className="w-4 h-4 mr-2" />
          Upgrade
        </Button>
      </CardContent>
    </Card>
  );
}
