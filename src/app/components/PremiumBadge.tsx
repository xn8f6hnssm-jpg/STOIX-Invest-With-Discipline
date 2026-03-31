import { Crown } from 'lucide-react';
import { cn } from './ui/utils';

interface PremiumBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function PremiumBadge({ size = 'md', showText = false, className }: PremiumBadgeProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (showText) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-black px-2 py-0.5 rounded-full font-semibold',
        textSizeClasses[size],
        className
      )}>
        <Crown className={sizeClasses[size]} />
        Premium
      </span>
    );
  }

  return (
    <Crown className={cn(sizeClasses[size], 'text-yellow-500', className)} />
  );
}
