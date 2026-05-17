interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizes = {
    sm: { total: 28, text: 'text-base',  sub: false },
    md: { total: 36, text: 'text-xl',    sub: false },
    lg: { total: 52, text: 'text-2xl',   sub: true  },
    xl: { total: 72, text: 'text-4xl',   sub: true  },
  };

  const { total, text: textSize, sub } = sizes[size];

  // Icon geometry
  const s = total;          // bounding box
  const cx = s / 2;
  const cy = s / 2;
  const r = s * 0.42;       // diamond radius

  // Zigzag edge line — 4 points, upward trajectory
  const p1 = { x: cx - r * 0.55, y: cy + r * 0.20 };
  const p2 = { x: cx - r * 0.10, y: cy - r * 0.28 };
  const p3 = { x: cx + r * 0.22, y: cy + r * 0.08 };
  const p4 = { x: cx + r * 0.55, y: cy - r * 0.45 };

  const polyPoints = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Mark */}
      <svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Diamond — filled, sharp */}
        <rect
          x={cx - r * 0.72}
          y={cy - r * 0.72}
          width={r * 1.44}
          height={r * 1.44}
          rx={s * 0.04}
          transform={`rotate(45 ${cx} ${cy})`}
          className="fill-foreground dark:fill-white"
        />

        {/* Edge line — cyan, sharp, upward */}
        <polyline
          points={polyPoints}
          stroke="#22d3ee"
          strokeWidth={s * 0.062}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Tip dot */}
        <circle
          cx={p4.x}
          cy={p4.y}
          r={s * 0.055}
          fill="#22d3ee"
        />
      </svg>

      {/* Wordmark */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-bold tracking-tight ${textSize} text-foreground dark:text-white`}
            style={{ letterSpacing: '-0.03em' }}
          >
            STOIX
          </span>
          {sub && (
            <span className="text-xs text-muted-foreground font-medium tracking-widest uppercase mt-0.5">
              Trade with Discipline
            </span>
          )}
        </div>
      )}
    </div>
  );
}
