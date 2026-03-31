import { ReactNode } from 'react';
import { Crown } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface PremiumGateProps {
  isPremium: boolean;
  featureName: string;
  description?: string;
  onUpgrade: () => void;
  children?: ReactNode;
  variant?: 'banner' | 'overlay' | 'inline';
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

  if (variant === 'overlay') {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none blur-sm">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardContent className="p-6 text-center">
              <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">Premium Feature</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {description || `Upgrade to Premium to unlock ${featureName}`}
              </p>
              <Button onClick={onUpgrade} className="bg-yellow-500 hover:bg-yellow-600 text-black">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </CardContent>
          </Card>
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
