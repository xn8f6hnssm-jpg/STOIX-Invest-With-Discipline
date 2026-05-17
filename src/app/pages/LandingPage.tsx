import { useNavigate } from 'react-router';
import { useEffect, useRef, useState } from 'react';

export function LandingPage() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", background: '#080808', color: '#fff', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .gold { color: #C9A84C; }
        .btn-primary {
          background: #C9A84C;
          color: #000;
          border: none;
          padding: 14px 36px;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary:hover { background: #e0bf6a; transform: translateY(-1px); }
        .btn-outline {
          background: transparent;
          color: #C9A84C;
          border: 1px solid #C9A84C;
          padding: 13px 32px;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.06em;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-outline:hover { background: #C9A84C20; }
        .fade-up {
          opacity: 0;
          transform: translateY(30px);
          animation: fadeUp 0.7s forwards;
        }
        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }
        .stripe {
          position: absolute;
          width: 3px;
          background: linear-gradient(to bottom, transparent, #C9A84C60, transparent);
          transform: rotate(-45deg);
          transform-origin: top center;
        }
        .card-feature {
          border: 1px solid #1f1f1f;
          background: #0e0e0e;
          padding: 32px;
          transition: border-color 0.3s;
        }
        .card-feature:hover { border-color: #C9A84C40; }
        .stat-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 64px;
          color: #C9A84C;
          line-height: 1;
        }
        .section-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #C9A84C;
          margin-bottom: 16px;
        }
        .big-heading {
          font-family: 'Bebas Neue', sans-serif;
          line-height: 0.95;
          letter-spacing: 0.02em;
        }
        .divider { width: 40px; height: 2px; background: #C9A84C; margin: 24px 0; }
        .pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #C9A84C15;
          border: 1px solid #C9A84C30;
          color: #C9A84C;
          padding: 6px 16px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 24px;
        }
        @media (max-width: 768px) {
          .big-heading { font-size: 56px !important; }
          .hero-grid { grid-template-columns: 1fr !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .nav-links { display: none !important; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, borderBottom: scrollY > 50 ? '1px solid #1a1a1a' : 'none', background: scrollY > 50 ? 'rgba(8,8,8,0.95)' : 'transparent', backdropFilter: scrollY > 50 ? 'blur(12px)' : 'none', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: '#0a0a0a', position: 'relative', overflow: 'hidden', border: '1px solid #222' }}>
            <div style={{ position: 'absolute', inset: 0, background: '#C9A84C', clipPath: 'polygon(30% 0%, 70% 0%, 60% 100%, 20% 100%)' }} />
          </div>
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: '0.1em' }}>STOIX</span>
        </div>
        <div className="nav-links" style={{ display: 'flex', gap: 36, fontSize: 13, color: '#888', fontWeight: 500 }}>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = '#888')}>Features</span>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = '#888')}>Pricing</span>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = '#888')}>Community</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-outline" style={{ padding: '10px 24px', fontSize: 13 }} onClick={() => navigate('/login')}>Log In</button>
          <button className="btn-primary" style={{ padding: '10px 24px', fontSize: 13 }} onClick={() => navigate('/login')}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 40px 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Background diagonal stripes */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.06 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ position: 'absolute', top: '-50%', left: `${i * 20 - 10}%`, width: '2px', height: '200%', background: 'linear-gradient(to bottom, transparent, #C9A84C, transparent)', transform: 'rotate(-35deg)' }} />
          ))}
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <div className="fade-up">
            <div className="pill">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9A84C', display: 'inline-block' }} />
              Built for serious traders
            </div>
          </div>

          <h1 className="big-heading fade-up" style={{ fontSize: '96px', maxWidth: 900, animationDelay: '0.1s' }}>
            TRADE WITH<br />
            <span className="gold">DISCIPLINE.</span><br />
            WIN WITH DATA.
          </h1>

          <p className="fade-up" style={{ fontSize: 18, color: '#888', maxWidth: 520, lineHeight: 1.7, margin: '32px 0 48px', animationDelay: '0.2s', fontWeight: 300 }}>
            STOIX is the trading journal that holds you accountable, tracks your patterns, and uses AI to turn your trading history into a refined edge.
          </p>

          <div className="fade-up" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', animationDelay: '0.3s' }}>
            <button className="btn-primary" style={{ fontSize: 15 }} onClick={() => navigate('/login')}>Start For Free</button>
            <button className="btn-outline" onClick={() => navigate('/login')}>View Demo</button>
          </div>

          <div className="fade-up" style={{ marginTop: 64, display: 'flex', gap: 48, flexWrap: 'wrap', animationDelay: '0.4s' }}>
            {[['Free to start', ''], ['Premium from $14.99/mo', ''], ['Cancel anytime', '']].map(([text]) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#555' }}>
                <span style={{ color: '#C9A84C' }}>✓</span> {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '80px 40px', borderTop: '1px solid #141414', borderBottom: '1px solid #141414' }}>
        <div className="stats-grid" style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 40 }}>
          {[
            ['Track', 'Every trade logged and analysed'],
            ['Improve', 'AI finds your edge in the data'],
            ['Compete', 'Leaderboards and community'],
            ['Earn', 'Rewards for staying disciplined'],
          ].map(([title, desc]) => (
            <div key={title} style={{ borderLeft: '1px solid #1f1f1f', paddingLeft: 24 }}>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 40, color: '#C9A84C', marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '120px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="section-label">Features</div>
          <h2 className="big-heading" style={{ fontSize: 64, marginBottom: 64 }}>
            EVERYTHING YOU NEED<br />TO <span className="gold">MASTER YOUR EDGE</span>
          </h2>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {[
              { icon: '📓', title: 'Smart Journal', desc: 'Log every trade with custom fields, screenshots, and strategy tags. The AI learns from every entry.' },
              { icon: '🤖', title: 'AI Strategy Builder', desc: 'Your journal becomes your edge. The AI analyses your wins and losses to extract your highest-probability setups.' },
              { icon: '✅', title: 'Daily Check-In', desc: 'Build the discipline habit. Log clean days, track streaks, and earn points for staying consistent.' },
              { icon: '⭐', title: 'A+ Trade Tracker', desc: 'Log your best setups separately. The AI compares them to your regular trades to show you the difference.' },
              { icon: '📊', title: 'Backtesting Journal', desc: 'Track backtesting separately from live trading. Compare results to see if your edge translates.' },
              { icon: '👥', title: 'Trading Community', desc: 'Follow other traders, share your journey, compete on leaderboards, and grow together.' },
            ].map(f => (
              <div key={f.title} className="card-feature">
                <div style={{ fontSize: 32, marginBottom: 20 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, letterSpacing: '0.02em' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Discipline section */}
      <section style={{ padding: '120px 40px', background: '#0a0a0a', borderTop: '1px solid #141414' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="hero-grid">
          <div>
            <div className="section-label">Discipline System</div>
            <h2 className="big-heading" style={{ fontSize: 56, marginBottom: 24 }}>
              YOUR RULES.<br /><span className="gold">YOUR LEAGUE.</span>
            </h2>
            <div className="divider" />
            <p style={{ fontSize: 15, color: '#666', lineHeight: 1.8, marginBottom: 32 }}>
              Earn points for every clean day. Lose them when you break your rules. Climb from Bronze to Platinum league based on your discipline rate — not your P&L.
            </p>
            {['Daily check-ins with streak tracking', 'Bronze to Platinum league system', 'Points for journaling and consistency', 'Community leaderboard'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, fontSize: 14, color: '#888' }}>
                <span style={{ color: '#C9A84C', fontWeight: 700 }}>→</span> {item}
              </div>
            ))}
            <button className="btn-primary" style={{ marginTop: 32 }} onClick={() => navigate('/login')}>Start Building Discipline</button>
          </div>
          <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', padding: 40 }}>
            {[
              { league: 'Platinum', rate: '90%+', color: '#e2e8f0' },
              { league: 'Diamond', rate: '75%+', color: '#67e8f9' },
              { league: 'Gold', rate: '60%+', color: '#C9A84C' },
              { league: 'Silver', rate: '40%+', color: '#94a3b8' },
              { league: 'Bronze', rate: '0%+', color: '#b45309' },
            ].map((l, i) => (
              <div key={l.league} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: i < 4 ? '1px solid #141414' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                  <span style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: '0.05em', color: l.color }}>{l.league}</span>
                </div>
                <span style={{ fontSize: 13, color: '#444' }}>{l.rate} discipline rate</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '120px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="section-label">Pricing</div>
          <h2 className="big-heading" style={{ fontSize: 64, marginBottom: 16 }}>SIMPLE, <span className="gold">FAIR PRICING</span></h2>
          <p style={{ color: '#555', fontSize: 15, marginBottom: 64 }}>Start free. Upgrade when you're ready to unlock everything.</p>

          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, maxWidth: 800 }}>
            {/* Free */}
            <div style={{ background: '#0e0e0e', border: '1px solid #1f1f1f', padding: 48 }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.15em', color: '#555', textTransform: 'uppercase', marginBottom: 20 }}>Free</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 56, marginBottom: 4 }}>$0</div>
              <div style={{ color: '#444', fontSize: 13, marginBottom: 40 }}>Forever free</div>
              {['Daily check-ins', 'Basic journal', '3 custom fields', 'Community access', 'Leaderboard'].map(f => (
                <div key={f} style={{ display: 'flex', gap: 12, marginBottom: 14, fontSize: 13, color: '#666' }}>
                  <span style={{ color: '#C9A84C' }}>✓</span>{f}
                </div>
              ))}
              <button className="btn-outline" style={{ width: '100%', marginTop: 40 }} onClick={() => navigate('/login')}>Get Started Free</button>
            </div>

            {/* Premium */}
            <div style={{ background: '#0d0b06', border: '1px solid #C9A84C40', padding: 48, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 20, right: 20, background: '#C9A84C', color: '#000', fontSize: 10, fontWeight: 800, padding: '4px 10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Most Popular</div>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.15em', color: '#C9A84C', textTransform: 'uppercase', marginBottom: 20 }}>Premium</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 56, color: '#C9A84C', marginBottom: 4 }}>$14.99</div>
              <div style={{ color: '#666', fontSize: 13, marginBottom: 40 }}>per month · or $99/yr</div>
              {['Everything in Free', 'Unlimited custom fields', 'AI Strategy Builder', 'Backtesting journal', 'A+ Trade tracker', 'Groups & paid communities', 'Priority support'].map(f => (
                <div key={f} style={{ display: 'flex', gap: 12, marginBottom: 14, fontSize: 13, color: '#888' }}>
                  <span style={{ color: '#C9A84C' }}>✓</span>{f}
                </div>
              ))}
              <button className="btn-primary" style={{ width: '100%', marginTop: 40 }} onClick={() => navigate('/app/upgrade')}>Upgrade to Premium</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '120px 40px', borderTop: '1px solid #141414', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.04 }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ position: 'absolute', top: '-50%', left: `${i * 14 - 5}%`, width: '2px', height: '200%', background: '#C9A84C', transform: 'rotate(-35deg)' }} />
          ))}
        </div>
        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative' }}>
          <div className="section-label" style={{ textAlign: 'center' }}>Get Started Today</div>
          <h2 className="big-heading" style={{ fontSize: 72, marginBottom: 24 }}>
            STOP GUESSING.<br /><span className="gold">START WINNING.</span>
          </h2>
          <p style={{ color: '#555', fontSize: 16, marginBottom: 48, lineHeight: 1.7 }}>
            Join traders who are building real discipline, finding their edge, and becoming consistently profitable.
          </p>
          <button className="btn-primary" style={{ fontSize: 16, padding: '18px 52px' }} onClick={() => navigate('/login')}>Create Free Account</button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px', borderTop: '1px solid #141414', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, background: '#0a0a0a', position: 'relative', overflow: 'hidden', border: '1px solid #222' }}>
            <div style={{ position: 'absolute', inset: 0, background: '#C9A84C', clipPath: 'polygon(30% 0%, 70% 0%, 60% 100%, 20% 100%)' }} />
          </div>
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: '0.1em' }}>STOIX</span>
        </div>
        <div style={{ fontSize: 12, color: '#333' }}>© 2025 Stoix. All rights reserved.</div>
        <div style={{ display: 'flex', gap: 24, fontSize: 12, color: '#444' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/app/legal')}>Privacy</span>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/app/legal')}>Terms</span>
        </div>
      </footer>
    </div>
  );
}
