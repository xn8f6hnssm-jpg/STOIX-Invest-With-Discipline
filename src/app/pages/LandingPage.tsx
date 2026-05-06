import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';

export function LandingPage() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const skipLanding = localStorage.getItem('stoix_skip_landing');
    if (skipLanding === 'true') { navigate('/app'); return; }
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#080808', color: '#fff', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .gold { color: #C9A84C; }
        .heading { font-family: 'Bebas Neue', sans-serif; line-height: 1; letter-spacing: 0.02em; }
        .btn-gold { background: #C9A84C; color: #000; border: none; padding: 14px 28px; font-size: 14px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; width: 100%; }
        .btn-outline { background: transparent; color: #C9A84C; border: 1px solid #C9A84C; padding: 13px 28px; font-size: 14px; font-weight: 600; cursor: pointer; width: 100%; }
        .section-label { font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: #C9A84C; margin-bottom: 12px; }
        .feature-card { border: 1px solid #1a1a1a; background: #0e0e0e; padding: 24px; }
        .divider { width: 32px; height: 2px; background: #C9A84C; margin: 16px 0; }
      `}</style>

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrollY > 40 ? 'rgba(8,8,8,0.97)' : 'transparent',
        borderBottom: scrollY > 40 ? '1px solid #1a1a1a' : 'none',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all 0.3s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: '#0a0a0a', border: '1px solid #222', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: '#C9A84C', clipPath: 'polygon(30% 0%, 70% 0%, 55% 100%, 15% 100%)' }} />
          </div>
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: '0.1em' }}>STOIX</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/login')} style={{ background: 'transparent', color: '#C9A84C', border: '1px solid #C9A84C', padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Log In</button>
          <button onClick={() => navigate('/login?signup=true')} style={{ background: '#C9A84C', color: '#000', border: 'none', padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Sign Up</button>
        </div>
      </nav>

      {/* Hero - compact on mobile */}
      <section style={{ padding: '64px 20px 40px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#C9A84C15', border: '1px solid #C9A84C30', color: '#C9A84C', padding: '5px 14px', fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#C9A84C', display: 'inline-block' }} />
            The Ultimate Traders Dashboard
          </div>
          <h1 className="heading" style={{ fontSize: 'clamp(40px, 12vw, 80px)', marginBottom: 16 }}>
            EVERYTHING A TRADER NEEDS<br />
            <span className="gold">IN ONE PLACE.</span>
          </h1>
          <p style={{ fontSize: 15, color: '#777', lineHeight: 1.7, marginBottom: 28, maxWidth: 480 }}>
            Journal your trades, track your discipline, stop revenge trading, connect with other traders, and let AI turn your history into a refined edge.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320 }}>
            <button className="btn-gold" onClick={() => navigate('/login?signup=true')}>Start For Free</button>
            <button className="btn-outline" onClick={() => navigate('/login')}>Log In</button>
          </div>
          <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {['Free to start', 'Premium from $12.99/mo', 'Cancel anytime'].map(t => (
              <span key={t} style={{ fontSize: 12, color: '#555', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#C9A84C' }}>✓</span>{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '60px 20px', borderTop: '1px solid #141414' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div className="section-label">Features</div>
          <h2 className="heading" style={{ fontSize: 'clamp(28px, 8vw, 50px)', marginBottom: 32 }}>
            BUILT FOR TRADERS,<br /><span className="gold">BY TRADERS</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { icon: '📓', title: 'AI Trading Journal', desc: 'Log every trade with custom fields and screenshots. AI finds your patterns and builds your edge.' },
              { icon: '✅', title: 'Daily Check-In', desc: 'Build discipline daily. Log clean/forfeit days, earn points, and climb the league.' },
              { icon: '🛡️', title: 'RevengeX', desc: 'Detects revenge trading patterns. Stops you before you blow your account.' },
              { icon: '🤖', title: 'AI Analytics', desc: 'Deep analysis of your trades, backtesting, and A+ setups to find your edge.' },
              { icon: '🧠', title: 'Mental Preparation', desc: 'Customisable pre-session routine to get your mindset right before the market.' },
              { icon: '🏆', title: 'Prop Firm Success', desc: 'Customise to your prop firm rules. Track daily loss, drawdown, and consistency.' },
              { icon: '👥', title: 'Social & Community', desc: 'Follow traders, share setups, and compete on the global leaderboard.' },
              { icon: '💬', title: 'Groups & DMs', desc: 'Create paid or free trading groups. Message traders directly.' },
            ].map(f => (
              <div key={f.title} className="feature-card">
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{f.icon}</span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{f.title}</p>
                    <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* League System */}
      <section style={{ padding: '60px 20px', background: '#0a0a0a', borderTop: '1px solid #141414' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div className="section-label">League System</div>
          <h2 className="heading" style={{ fontSize: 'clamp(28px, 8vw, 50px)', marginBottom: 8 }}>
            EARN POINTS.<br /><span className="gold">CLIMB THE RANKS.</span>
          </h2>
          <div className="divider" />
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.8, marginBottom: 24 }}>
            Earn points for every clean day and journal entry. Your total points determine your league — Bronze, Silver, Gold, Diamond, or Platinum. Each league has ranks I, II, and III.
          </p>
          <div style={{ border: '1px solid #1a1a1a', overflow: 'hidden' }}>
            {[
              { league: 'Platinum', ranks: 'I · II · III', desc: '6,000 — 7,000+ pts', color: '#e2e8f0' },
              { league: 'Diamond', ranks: 'I · II · III', desc: '4,500 — 5,999 pts', color: '#67e8f9' },
              { league: 'Gold', ranks: 'I · II · III', desc: '3,000 — 4,499 pts', color: '#C9A84C' },
              { league: 'Silver', ranks: 'I · II · III', desc: '1,500 — 2,999 pts', color: '#94a3b8' },
              { league: 'Bronze', ranks: 'I · II · III', desc: '0 — 1,499 pts', color: '#b45309' },
            ].map((l, i) => (
              <div key={l.league} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < 4 ? '1px solid #141414' : 'none', background: '#0e0e0e' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                  <span style={{ fontFamily: 'Bebas Neue', fontSize: 18, color: l.color, letterSpacing: '0.05em' }}>{l.league}</span>
                  <span style={{ fontSize: 11, color: '#333' }}>{l.ranks}</span>
                </div>
                <span style={{ fontSize: 12, color: '#444' }}>{l.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '60px 20px', borderTop: '1px solid #141414' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div className="section-label">Pricing</div>
          <h2 className="heading" style={{ fontSize: 'clamp(28px, 8vw, 50px)', marginBottom: 8 }}>SIMPLE, <span className="gold">FAIR PRICING</span></h2>
          <p style={{ color: '#555', fontSize: 14, marginBottom: 24 }}>Start free. Upgrade when ready.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Free */}
            <div style={{ background: '#0e0e0e', border: '1px solid #1f1f1f', padding: 28 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', color: '#555', textTransform: 'uppercase', marginBottom: 12 }}>Free</p>
              <p style={{ fontFamily: 'Bebas Neue', fontSize: 48, marginBottom: 4 }}>$0</p>
              <p style={{ color: '#444', fontSize: 13, marginBottom: 20 }}>Forever free</p>
              {['Daily check-ins & streaks', 'Basic trading journal', '3 custom fields', 'Community & leaderboard', 'Social feed'].map(f => (
                <div key={f} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 13, color: '#666' }}>
                  <span style={{ color: '#C9A84C' }}>✓</span>{f}
                </div>
              ))}
              <button className="btn-outline" style={{ marginTop: 20 }} onClick={() => navigate('/login?signup=true')}>Get Started Free</button>
            </div>

            {/* Premium */}
            <div style={{ background: '#0d0b06', border: '1px solid #C9A84C50', padding: 28, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 16, right: 16, background: '#C9A84C', color: '#000', fontSize: 9, fontWeight: 800, padding: '3px 8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Most Popular</div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', color: '#C9A84C', textTransform: 'uppercase', marginBottom: 12 }}>Premium</p>
              <p style={{ fontFamily: 'Bebas Neue', fontSize: 48, color: '#C9A84C', marginBottom: 4 }}>$12.99</p>
              <p style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>per month · or $119.99/yr</p>
              {['Everything in Free', 'Unlimited custom fields', 'AI Strategy Builder', 'Backtesting journal', 'Mental prep suite', 'Prop firm tracker', 'Groups & paid communities'].map(f => (
                <div key={f} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 13, color: '#888' }}>
                  <span style={{ color: '#C9A84C' }}>✓</span>{f}
                </div>
              ))}
              <button className="btn-gold" style={{ marginTop: 20 }} onClick={() => navigate('/app/upgrade')}>Upgrade to Premium</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '60px 20px', borderTop: '1px solid #141414', textAlign: 'center' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <h2 className="heading" style={{ fontSize: 'clamp(32px, 10vw, 60px)', marginBottom: 16 }}>
            STOP GUESSING.<br /><span className="gold">START WINNING.</span>
          </h2>
          <p style={{ color: '#555', fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
            Join traders building real discipline and finding their edge with STOIX.
          </p>
          <button className="btn-gold" style={{ maxWidth: 280, margin: '0 auto', display: 'block' }} onClick={() => navigate('/login?signup=true')}>
            Create Free Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '24px 20px', borderTop: '1px solid #141414', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: '0.1em' }}>STOIX</span>
        <span style={{ fontSize: 11, color: '#333' }}>© 2025 Stoix. All rights reserved.</span>
        <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#444' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/app/legal')}>Privacy</span>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/app/legal')}>Terms</span>
        </div>
      </footer>
    </div>
  );
}
