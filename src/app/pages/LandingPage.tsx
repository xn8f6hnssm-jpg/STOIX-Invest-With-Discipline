import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';

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
          background: #C9A84C; color: #000; border: none;
          padding: 14px 36px; font-size: 15px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-primary:hover { background: #e0bf6a; transform: translateY(-1px); }
        .btn-outline {
          background: transparent; color: #C9A84C;
          border: 1px solid #C9A84C; padding: 13px 32px;
          font-size: 15px; font-weight: 600; letter-spacing: 0.06em;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-outline:hover { background: #C9A84C20; }
        .fade-up { opacity: 0; transform: translateY(30px); animation: fadeUp 0.7s forwards; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
        .card-feature { border: 1px solid #1f1f1f; background: #0e0e0e; padding: 32px; transition: border-color 0.3s, transform 0.2s; }
        .card-feature:hover { border-color: #C9A84C40; transform: translateY(-2px); }
        .big-heading { font-family: 'Bebas Neue', sans-serif; line-height: 0.95; letter-spacing: 0.02em; }
        .divider { width: 40px; height: 2px; background: #C9A84C; margin: 24px 0; }
        .pill { display: inline-flex; align-items: center; gap: 8px; background: #C9A84C15; border: 1px solid #C9A84C30; color: #C9A84C; padding: 6px 16px; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 24px; }
        .section-label { font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: #C9A84C; margin-bottom: 16px; }
        @media (max-width: 768px) {
          .big-heading { font-size: 52px !important; }
          .two-col { grid-template-columns: 1fr !important; gap: 40px !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr !important; max-width: 400px !important; }
          .nav-links { display: none !important; }
          .hero-section { padding: 100px 24px 60px !important; }
          .section-pad { padding: 80px 24px !important; }
          .stats-row { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, borderBottom: scrollY > 50 ? '1px solid #1a1a1a' : 'none', background: scrollY > 50 ? 'rgba(8,8,8,0.95)' : 'transparent', backdropFilter: scrollY > 50 ? 'blur(12px)' : 'none', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: '#0a0a0a', position: 'relative', overflow: 'hidden', border: '1px solid #222' }}>
            <div style={{ position: 'absolute', inset: 0, background: '#C9A84C', clipPath: 'polygon(30% 0%, 70% 0%, 55% 100%, 15% 100%)' }} />
          </div>
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: '0.1em' }}>STOIX</span>
        </div>
        <div className="nav-links" style={{ display: 'flex', gap: 36, fontSize: 13, color: '#888', fontWeight: 500 }}>
          {['Features', 'Pricing', 'Community'].map(item => (
            <span key={item} style={{ cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = '#888')}>{item}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-outline" style={{ padding: '10px 24px', fontSize: 13 }} onClick={() => navigate('/login')}>Log In</button>
          <button className="btn-primary" style={{ padding: '10px 24px', fontSize: 13 }} onClick={() => navigate('/login?signup=true')}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 40px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.05 }}>
          {[...Array(7)].map((_, i) => (
            <div key={i} style={{ position: 'absolute', top: '-50%', left: `${i * 16 - 5}%`, width: '2px', height: '200%', background: 'linear-gradient(to bottom, transparent, #C9A84C, transparent)', transform: 'rotate(-35deg)' }} />
          ))}
        </div>
        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <div className="fade-up">
            <div className="pill"><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9A84C', display: 'inline-block' }} />The Ultimate Traders Dashboard</div>
          </div>
          <h1 className="big-heading fade-up" style={{ fontSize: '88px', maxWidth: 900, animationDelay: '0.1s' }}>
            EVERYTHING A<br />TRADER NEEDS<br /><span className="gold">IN ONE PLACE.</span>
          </h1>
          <p className="fade-up" style={{ fontSize: 17, color: '#777', maxWidth: 560, lineHeight: 1.8, margin: '32px 0 48px', animationDelay: '0.2s', fontWeight: 300 }}>
            Journal your trades, track your discipline, stop revenge trading, connect with other traders, and let AI turn your history into a refined edge — all in one dashboard built for serious traders.
          </p>
          <div className="fade-up" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', animationDelay: '0.3s' }}>
            <button className="btn-primary" style={{ fontSize: 15 }} onClick={() => navigate('/login?signup=true')}>Start For Free</button>
            <button className="btn-outline" onClick={() => navigate('/login')}>Log In</button>
          </div>
          <div className="fade-up" style={{ marginTop: 56, display: 'flex', gap: 40, flexWrap: 'wrap', animationDelay: '0.4s' }}>
            {['Free to start', 'Premium from $12.99/mo', 'Cancel anytime'].map(text => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#555' }}>
                <span style={{ color: '#C9A84C' }}>✓</span> {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section-pad" style={{ padding: '120px 40px', borderTop: '1px solid #141414' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="section-label">Everything You Need</div>
          <h2 className="big-heading" style={{ fontSize: 60, marginBottom: 16 }}>BUILT FOR TRADERS,<br /><span className="gold">BY TRADERS</span></h2>
          <p style={{ color: '#555', fontSize: 15, marginBottom: 64, maxWidth: 500 }}>Every feature was designed to make you a more disciplined, more consistent, and more profitable trader.</p>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {[
              { icon: '📓', title: 'AI Trading Journal', desc: 'Log every trade with custom fields, screenshots, and strategy tags. The AI analyses your patterns and turns your history into a refined edge.' },
              { icon: '✅', title: 'Daily Check-In', desc: 'Build the discipline habit. Log clean and forfeit days, track streaks, earn points, and climb the league system from Bronze to Platinum.' },
              { icon: '🛡️', title: 'RevengeX', desc: 'Automatically detects revenge trading patterns from your journal. Get alerts before you blow your account chasing losses.' },
              { icon: '🤖', title: 'AI Analytics', desc: 'Deep analysis of your live trades, backtesting, and A+ setups. Finds your highest-probability confluences and tells you exactly what to focus on.' },
              { icon: '🧠', title: 'Mental Preparation', desc: 'A fully customisable pre-session mental prep routine. Set your mindset, review your rules, and get ready to trade before the market opens.' },
              { icon: '🏆', title: 'Prop Firm Success', desc: 'Customise the dashboard to your prop firm\'s rules. Track daily loss limits, drawdown, and consistency rules to pass your challenge.' },
              { icon: '👥', title: 'Social & Community', desc: 'Follow other traders, share your journey, see what setups others are taking, and compete on the global leaderboard.' },
              { icon: '💬', title: 'Groups & DMs', desc: 'Create or join trading groups. Message traders directly. Build your own paid community and earn from your knowledge.' },
              { icon: '⭐', title: 'League System', desc: 'Earn points for discipline, not just profits. Climb from Bronze III to Platinum I based on your consistency and daily check-in rate.' },
            ].map(f => (
              <div key={f.title} className="card-feature">
                <div style={{ fontSize: 28, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, letterSpacing: '0.02em' }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.75 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* League System */}
      <section className="section-pad" style={{ padding: '120px 40px', background: '#0a0a0a', borderTop: '1px solid #141414' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="two-col">
          <div>
            <div className="section-label">League System</div>
            <h2 className="big-heading" style={{ fontSize: 54, marginBottom: 24 }}>DISCIPLINE<br />IS THE <span className="gold">REAL EDGE.</span></h2>
            <div className="divider" />
            <p style={{ fontSize: 15, color: '#666', lineHeight: 1.8, marginBottom: 32 }}>
              Most trading apps reward P&L. STOIX rewards discipline. Earn points for every clean day, every journal entry, every time you follow your rules. Lose points when you don't. Your league rank reflects who you actually are as a trader.
            </p>
            {['Points for every clean day and journal entry', 'Bronze → Silver → Gold → Diamond → Platinum', 'Global leaderboard ranked by discipline rate', 'Streak tracking and demotion risk alerts'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, fontSize: 14, color: '#777' }}>
                <span style={{ color: '#C9A84C', fontWeight: 700, flexShrink: 0 }}>→</span> {item}
              </div>
            ))}
            <button className="btn-primary" style={{ marginTop: 36 }} onClick={() => navigate('/login?signup=true')}>Start Climbing</button>
          </div>
          <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', padding: 40 }}>
            {[
              { league: 'Platinum', sub: 'I — V', rate: '90%+', color: '#e2e8f0' },
              { league: 'Diamond', sub: 'I — V', rate: '75%+', color: '#67e8f9' },
              { league: 'Gold', sub: 'I — V', rate: '60%+', color: '#C9A84C' },
              { league: 'Silver', sub: 'I — V', rate: '40%+', color: '#94a3b8' },
              { league: 'Bronze', sub: 'I — V', rate: 'Starting', color: '#b45309' },
            ].map((l, i) => (
              <div key={l.league} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0', borderBottom: i < 4 ? '1px solid #141414' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                  <div>
                    <span style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: '0.05em', color: l.color }}>{l.league}</span>
                    <span style={{ fontSize: 12, color: '#333', marginLeft: 8 }}>{l.sub}</span>
                  </div>
                </div>
                <span style={{ fontSize: 13, color: '#444' }}>{l.rate} discipline</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section-pad" style={{ padding: '120px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="section-label">Pricing</div>
          <h2 className="big-heading" style={{ fontSize: 60, marginBottom: 16 }}>SIMPLE, <span className="gold">FAIR PRICING</span></h2>
          <p style={{ color: '#555', fontSize: 15, marginBottom: 64 }}>Start free. Upgrade when you're ready to unlock everything.</p>

          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, maxWidth: 760 }}>
            <div style={{ background: '#0e0e0e', border: '1px solid #1f1f1f', padding: 48 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', color: '#555', textTransform: 'uppercase', marginBottom: 20 }}>Free</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 56, marginBottom: 4 }}>$0</div>
              <div style={{ color: '#444', fontSize: 13, marginBottom: 40 }}>Forever free</div>
              {['Daily check-ins & streaks', 'Basic trading journal', '3 custom journal fields', 'Community & leaderboard', 'A+ Trade tracker (2 fields)', 'Social feed'].map(f => (
                <div key={f} style={{ display: 'flex', gap: 12, marginBottom: 13, fontSize: 13, color: '#666' }}>
                  <span style={{ color: '#C9A84C', flexShrink: 0 }}>✓</span>{f}
                </div>
              ))}
              <button className="btn-outline" style={{ width: '100%', marginTop: 40 }} onClick={() => navigate('/login?signup=true')}>Get Started Free</button>
            </div>

            <div style={{ background: '#0d0b06', border: '1px solid #C9A84C40', padding: 48, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 20, right: 20, background: '#C9A84C', color: '#000', fontSize: 10, fontWeight: 800, padding: '4px 10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Most Popular</div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', color: '#C9A84C', textTransform: 'uppercase', marginBottom: 20 }}>Premium</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 56, color: '#C9A84C', marginBottom: 4 }}>$12.99</div>
              <div style={{ color: '#666', fontSize: 13, marginBottom: 40 }}>per month · or $119.99/yr (save 23%)</div>
              {['Everything in Free', 'Unlimited custom journal fields', 'AI Strategy Builder & Analytics', 'Backtesting journal', 'Mental preparation suite', 'Prop firm success tracker', 'Groups & paid communities', 'Unlimited A+ trade fields', 'Priority support'].map(f => (
                <div key={f} style={{ display: 'flex', gap: 12, marginBottom: 13, fontSize: 13, color: '#888' }}>
                  <span style={{ color: '#C9A84C', flexShrink: 0 }}>✓</span>{f}
                </div>
              ))}
              <button className="btn-primary" style={{ width: '100%', marginTop: 40 }} onClick={() => navigate('/app/upgrade')}>Upgrade to Premium</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-pad" style={{ padding: '120px 40px', borderTop: '1px solid #141414', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.04 }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ position: 'absolute', top: '-50%', left: `${i * 14 - 5}%`, width: '2px', height: '200%', background: '#C9A84C', transform: 'rotate(-35deg)' }} />
          ))}
        </div>
        <div style={{ maxWidth: 680, margin: '0 auto', position: 'relative' }}>
          <div className="section-label" style={{ textAlign: 'center' }}>Join Today</div>
          <h2 className="big-heading" style={{ fontSize: 72, marginBottom: 24 }}>
            STOP GUESSING.<br /><span className="gold">START WINNING.</span>
          </h2>
          <p style={{ color: '#555', fontSize: 16, marginBottom: 48, lineHeight: 1.8 }}>
            Join traders who are building real discipline, finding their edge, and becoming consistently profitable with STOIX.
          </p>
          <button className="btn-primary" style={{ fontSize: 16, padding: '18px 52px' }} onClick={() => navigate('/login?signup=true')}>Create Free Account</button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 40px', borderTop: '1px solid #141414', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, background: '#0a0a0a', position: 'relative', overflow: 'hidden', border: '1px solid #222' }}>
            <div style={{ position: 'absolute', inset: 0, background: '#C9A84C', clipPath: 'polygon(30% 0%, 70% 0%, 55% 100%, 15% 100%)' }} />
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
