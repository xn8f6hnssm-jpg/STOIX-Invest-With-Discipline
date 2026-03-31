interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-lg' },
    md: { icon: 'w-10 h-10', text: 'text-xl' },
    lg: { icon: 'w-16 h-16', text: 'text-2xl' },
    xl: { icon: 'w-24 h-24', text: 'text-4xl' },
  };

  const { icon: iconSize, text: textSize } = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon - Shield with upward chart */}
      <div className={`${iconSize} relative`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#1E40AF" />
            </linearGradient>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          
          {/* Shield Background */}
          <path
            d="M50 5 L85 20 L85 45 Q85 75 50 95 Q15 75 15 45 L15 20 Z"
            fill="url(#shieldGradient)"
            stroke="#1E40AF"
            strokeWidth="2"
          />
          
          {/* Inner Shield Highlight */}
          <path
            d="M50 10 L80 23 L80 45 Q80 72 50 90 Q20 72 20 45 L20 23 Z"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
          />
          
          {/* Upward Chart Line */}
          <path
            d="M30 65 L40 55 L48 60 L58 45 L68 50 L75 35"
            stroke="url(#chartGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          
          {/* Chart Points (dots) */}
          <circle cx="30" cy="65" r="3" fill="#10B981" />
          <circle cx="40" cy="55" r="3" fill="#10B981" />
          <circle cx="48" cy="60" r="3" fill="#10B981" />
          <circle cx="58" cy="45" r="3" fill="#10B981" />
          <circle cx="68" cy="50" r="3" fill="#10B981" />
          <circle cx="75" cy="35" r="3" fill="#10B981" />
          
          {/* Arrow at the end */}
          <path
            d="M75 35 L72 38 M75 35 L78 38"
            stroke="#10B981"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
      
      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold ${textSize} bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent leading-tight`}>
            STOIX
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-muted-foreground font-medium tracking-wide">
              Trade with Discipline
            </span>
          )}
        </div>
      )}
    </div>
  );
}
