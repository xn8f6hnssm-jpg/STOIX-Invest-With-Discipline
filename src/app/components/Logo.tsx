// STOIX Logo — Fehu rune mark + wordmark
// Fehu: vertical staff with two thin diagonal branches sweeping upward
// Dark mass background, gold Fehu mark, text auto-adapts to light/dark mode
interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  darkMode?: boolean;
}

export function Logo({ size = 'md', showText = true, className = '', darkMode = false }: LogoProps) {
  const cfg = {
    sm: { ms: 34, fs: 17, gap: 9,  sub: false, ls: '-0.04em' },
    md: { ms: 46, fs: 22, gap: 12, sub: false, ls: '-0.04em' },
    lg: { ms: 62, fs: 30, gap: 15, sub: true,  ls: '-0.05em' },
    xl: { ms: 82, fs: 42, gap: 20, sub: true,  ls: '-0.05em' },
  }[size];
  const { ms, fs, gap, sub } = cfg;

  const B = 92;
  const s = (n: number) => (n / B) * ms;

  const massFill  = '#1e1e1e';
  const goldColor = '#c9a84c';

  const isDark = darkMode || (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subColor  = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.4)';

  const p = (pts: [number,number][]) => pts.map(([x,y]) => `${s(x)},${s(y)}`).join(' ');

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
        <rect x={s(4)} y={s(4)} width={s(72)} height={s(84)} rx={s(2)} fill={massFill} />
        <rect x={s(18)} y={s(10)} width={s(9)} height={s(70)} fill={goldColor} />
        <polygon points={p([[27,28],[66,8],[70,8],[70,13],[66,13],[27,33]])} fill={goldColor} />
        <polygon points={p([[27,50],[66,30],[70,30],[70,35],[66,35],[27,55]])} fill={goldColor} />
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
