import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Logo } from '../../components/Logo';
import { supabase } from '../../utils/supabase';
import { signIn } from '../../utils/auth';
import { Eye, EyeOff } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [skipLanding, setSkipLanding] = useState(localStorage.getItem('stoix_skip_landing') === 'true');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn({ email, password });
    
    if (!result.success) {
      setError(result.error || 'Login failed');
      setLoading(false);
      return;
    }

    if (skipLanding) localStorage.setItem('stoix_skip_landing', 'true');
    navigate('/app');
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) { setError('Please enter your email'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: 'https://stoix-invest-with-discipline.vercel.app/app/reset-password',
    });
    if (error) { setError(error.message); } else { setResetSent(true); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Logo size="lg" className="mx-auto mb-4" darkMode={true} />
          <h1 className="text-2xl font-bold mb-1">Welcome Back</h1>
          <p className="text-muted-foreground text-sm">Sign in to your STOIX account</p>
        </div>

        {!showForgotPassword ? (
          <form onSubmit={handleLogin} className="space-y-4 bg-card p-6 rounded-xl border">
            {error && <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">{error}</p>}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="mt-1" style={{ fontSize: '16px' }} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ fontSize: '16px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <button type="button" onClick={() => setShowForgotPassword(true)} className="w-full text-sm text-muted-foreground hover:text-foreground text-center">
              Forgot password?
            </button>
          </form>
        ) : (
          <div className="space-y-4 bg-card p-6 rounded-xl border">
            {resetSent ? (
              <div className="text-center space-y-3">
                <div className="text-4xl">📧</div>
                <h2 className="font-semibold">Check your email</h2>
                <p className="text-sm text-muted-foreground">We sent a password reset link to <strong>{resetEmail}</strong></p>
                <Button variant="outline" className="w-full" onClick={() => { setShowForgotPassword(false); setResetSent(false); }}>Back to Login</Button>
              </div>
            ) : (
              <>
                <h2 className="font-semibold">Reset Password</h2>
                {error && <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">{error}</p>}
                <div>
                  <Label>Email Address</Label>
                  <Input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="you@example.com" className="mt-1" style={{ fontSize: '16px' }} />
                </div>
                <Button className="w-full" onClick={handleForgotPassword} disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <button onClick={() => setShowForgotPassword(false)} className="w-full text-sm text-muted-foreground hover:text-foreground text-center">
                  Back to Login
                </button>
              </>
            )}
          </div>
        )}

        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">Don't have an account?</p>
          <Button variant="outline" className="w-full" onClick={() => navigate('/signup')}>Create Account</Button>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm font-medium">Skip intro page next time</p>
            <p className="text-xs text-muted-foreground">Go straight to your account</p>
          </div>
          <input type="checkbox" checked={skipLanding} onChange={e => {
            setSkipLanding(e.target.checked);
            if (e.target.checked) localStorage.setItem('stoix_skip_landing', 'true');
            else localStorage.removeItem('stoix_skip_landing');
          }} className="w-4 h-4 cursor-pointer" />
        </div>
      </div>
    </div>
  );
}
