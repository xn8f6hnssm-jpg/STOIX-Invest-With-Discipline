// STOIX Logo — hand-crafted mark
// Design: A square split diagonally by an orange slash — two interlocking
// pieces representing discipline cutting through market noise.
// Uses explicit hex colors (not Tailwind className fill) so it always renders.

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  darkMode?: boolean;
}

export function Logo({ size = 'md', showText = true, className = '', darkMode = false }: LogoProps) {
  const cfg = {
    sm: { s: 24, text: 'text-base',  gap: 8,  sub: false, sw: 2.4, weight: '800' },
    md: { s: 32, text: 'text-xl',    gap: 10, sub: false, sw: 3.2, weight: '800' },
    lg: { s: 44, text: 'text-2xl',   gap: 12, sub: true,  sw: 4.2, weight: '900' },
    xl: { s: 60, text: 'text-4xl',   gap: 16, sub: true,  sw: 5.8, weight: '900' },
  }[size];

  const { s, sw } = cfg;

  // Hardcoded hex — works in all environments, no Tailwind SVG fill issues
  const fg     = darkMode ? '#ffffff' : '#0f172a';
  const accent = '#f97316'; // orange-500

  const pad = s * 0.07;
  const x0 = pad, y0 = pad, x1 = s - pad, y1 = s - pad;

  // Diagonal cut — 32% from top on right side, 68% from top on left side
  const ry = y0 + (y1 - y0) * 0.30; // where slash exits top-right
  const ly = y0 + (y1 - y0) * 0.70; // where slash exits bottom-left

  // Upper piece
  const upper = `${x0},${y0} ${x1},${y0} ${x1},${ry} ${x0},${ly}`;
  // Lower piece
  const lower = `${x0},${ly} ${x1},${ry} ${x1},${y1} ${x0},${y1}`;

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: cfg.gap, flexShrink: 0 }}
      className={className}
    >
      <svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        {/* Lower piece — full weight */}
        <polygon points={lower} fill={fg} />

        {/* Upper piece — recessed, creates depth */}
        <polygon points={upper} fill={fg} opacity="0.38" />

        {/* The slash — orange accent, the "edge" */}
        <line
          x1={x0} y1={ly}
          x2={x1} y2={ry}
          stroke={accent}
          strokeWidth={sw}
          strokeLinecap="butt"
        />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span
            className={cfg.text}
            style={{
              fontWeight: cfg.weight,
              letterSpacing: '-0.05em',
              color: darkMode ? '#ffffff' : '#0f172a',
              fontFamily: 'inherit',
            }}
          >
            STOIX
          </span>
          {cfg.sub && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
                color: darkMode ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.4)',
                marginTop: 3,
              }}
            >
              Trade with Discipline
            </span>
          )}
        </div>
      )}
    </div>
  );
}
