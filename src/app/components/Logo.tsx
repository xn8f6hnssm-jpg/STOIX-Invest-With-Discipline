// STOIX Logo — gold strike mark + wordmark
// Design: Dark rectangular mass with a single gold diagonal strike
// All colors hardcoded hex — works in all environments

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  darkMode?: boolean;
}

export function Logo({ size = 'md', showText = true, className = '', darkMode = false }: LogoProps) {
  const cfg = {
    sm: { ms: 28, fs: 15, gap: 8,  sub: false, ls: '-0.04em' },
    md: { ms: 38, fs: 19, gap: 11, sub: false, ls: '-0.04em' },
    lg: { ms: 52, fs: 26, gap: 14, sub: true,  ls: '-0.05em' },
    xl: { ms: 70, fs: 36, gap: 18, sub: true,  ls: '-0.05em' },
  }[size];

  const { ms, fs, gap, sub } = cfg;

  // The mark scales proportionally from the 680x680 original
  // Original: mass x=148 y=186 w=384 h=308, strike polygon proportional
  const scale = ms / 48; // base unit

  const massX = ms * (148/680);
  const massY = ms * (186/680);
  const massW = ms * (384/680);
  const massH = ms * (308/680);

  // Strike polygon — scaled from original coords
  const s = (n: number) => (n / 680) * ms;
  const strikePoints = `${s(376)},${s(186)} ${s(440)},${s(186)} ${s(256)},${s(494)} ${s(192)},${s(494)}`;

  const massFill   = darkMode ? '#2a2a2a' : '#1e1e1e';
  const bgFill     = darkMode ? 'transparent' : 'transparent';
  const textColor  = darkMode ? '#ffffff' : '#0f172a';
  const subColor   = darkMode ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.4)';
  const goldColor  = '#c9a84c';

  return (
    <div
      style={{ display: 'inline-flex', alignItems: 'center', gap, flexShrink: 0 }}
      className={className}
    >
      <svg
        width={ms}
        height={ms}
        viewBox={`0 0 ${ms} ${ms}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
        aria-hidden="true"
      >
        {/* Dark mass */}
        <rect x={massX} y={massY} width={massW} height={massH} fill={massFill} />
        {/* Gold strike */}
        <polygon points={strikePoints} fill={goldColor} />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{
            fontSize: fs,
            fontWeight: 800,
            letterSpacing: cfg.ls,
            color: textColor,
            fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
          }}>
            STOIX
          </span>
          {sub && (
            <span style={{
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              color: subColor,
              marginTop: 3,
            }}>
              Trade with Discipline
            </span>
          )}
        </div>
      )}
    </div>
  );
}
