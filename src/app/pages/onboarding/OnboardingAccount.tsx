import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Checkbox } from '../../components/ui/checkbox';
import { Logo } from '../../components/Logo';
import { signUp, signIn } from '../../utils/auth';
import { isAuthenticated } from '../../utils/supabase';
import { storage } from '../../utils/storage';

export function OnboardingAccount() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    age: '',
  });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [hasExistingAccounts, setHasExistingAccounts] = useState(false);

  useEffect(() => {
    // Redirect if already authenticated
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (authenticated) {
        navigate('/app');
      }
    };
    checkAuth();
    
    // Check if there are existing accounts
    const existingUsers = storage.getAllUsers();
    setHasExistingAccounts(existingUsers.length > 0);
    
    // Load saved email if "Remember Me" was checked
    const savedEmail = localStorage.getItem('stoix_remembered_email');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, [navigate]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 9) {
      return { 
        valid: false, 
        message: `Password must be at least 9 characters and include:
• One uppercase letter
• One lowercase letter
• One number
• One special character (!, ?, @, #, $, %, &, *)` 
      };
    }
    if (!/[A-Z]/.test(password)) {
      return { 
        valid: false, 
        message: `Password must be at least 9 characters and include:
• One uppercase letter
• One lowercase letter
• One number
• One special character (!, ?, @, #, $, %, &, *)` 
      };
    }
    if (!/[a-z]/.test(password)) {
      return { 
        valid: false, 
        message: `Password must be at least 9 characters and include:
• One uppercase letter
• One lowercase letter
• One number
• One special character (!, ?, @, #, $, %, &, *)` 
      };
    }
    if (!/[0-9]/.test(password)) {
      return { 
        valid: false, 
        message: `Password must be at least 9 characters and include:
• One uppercase letter
• One lowercase letter
• One number
• One special character (!, ?, @, #, $, %, &, *)` 
      };
    }
    if (!/[!?@#$%&*]/.test(password)) {
      return { 
        valid: false, 
        message: `Password must be at least 9 characters and include:
• One uppercase letter
• One lowercase letter
• One number
• One special character (!, ?, @, #, $, %, &, *)` 
      };
    }
    return { valid: true, message: '' };
  };

  const validateUsername = (username: string): { valid: boolean; message: string } => {
    if (username.length < 3 || username.length > 20) {
      return { valid: false, message: 'Username must be between 3 and 20 characters' };
    }
    if (!/^[A-Za-z0-9_.]+$/.test(username)) {
      return { 
        valid: false, 
        message: 'Username can only contain letters, numbers, underscores (_), and periods (.)' 
      };
    }
    return { valid: true, message: '' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setIsLoading(true);
    
    if (isLogin) {
      // Login with Supabase
      const result = await signIn({
        email: formData.email,
        password: formData.password
      });
      
      setIsLoading(false);
      
      if (result.success) {
        if (rememberMe) {
          localStorage.setItem('stoix_remembered_email', formData.email);
        } else {
          localStorage.removeItem('stoix_remembered_email');
        }
        navigate('/app');
      } else {
        setError(result.error || 'Login failed');
      }
    } else {
      // Sign up validation
      if (!validateEmail(formData.email)) {
        setError('Please enter a valid email address');
        setIsLoading(false);
        return;
      }

      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.valid) {
        setError(passwordValidation.message);
        setIsLoading(false);
        return;
      }

      const usernameValidation = validateUsername(formData.username);
      if (!usernameValidation.valid) {
        setError(usernameValidation.message);
        setIsLoading(false);
        return;
      }

      // Sign up with Supabase
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        name: formData.name
      });
      
      setIsLoading(false);
      
      if (result.success) {
        // Store signup data temporarily for onboarding flow
        const onboardingData = {
          email: formData.email,
          password: formData.password,
          username: formData.username,
          name: formData.name
        };
        sessionStorage.setItem('onboarding_user', JSON.stringify(onboardingData));
        console.log('✅ Signup successful, stored onboarding data:', onboardingData);
        console.log('📍 Navigating to /onboarding/profile');
        
        // Navigate to profile setup
        navigate('/onboarding/profile');
      } else {
        // Check if it's a duplicate email error
        if (result.error?.includes('already exists') || result.error?.includes('already been registered')) {
          setError('This email is already registered.');
          // Auto-switch to login mode after showing error
          setTimeout(() => {
            setIsLogin(true);
            setError('');
          }, 2000);
        } else {
          setError(result.error || 'Sign up failed');
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Logo size="lg" showText={false} />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {isLogin ? 'Welcome Back' : 'STOIX: Trade with Discipline'}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin ? 'Log in to continue your journey' : 'Start your trading discipline journey'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <div>{error}</div>
                  {error.includes('already registered') && (
                    <div className="mt-2 text-xs">
                      Switching to login mode... or{' '}
                      <button
                        type="button"
                        onClick={() => {
                          const confirmed = confirm('This will clear ALL app data and sign you out. Are you sure?');
                          if (confirmed) {
                            localStorage.clear();
                            sessionStorage.clear();
                            window.location.reload();
                          }
                        }}
                        className="underline hover:text-destructive/80"
                      >
                        clear data to start fresh
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            )}
            
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="@username"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              {!isLogin && (
                <p className="text-xs text-muted-foreground">At least 9 characters</p>
              )}
            </div>
            
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  required
                  min="18"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
            )}
            
            {isLogin && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked)}
                />
                <Label htmlFor="remember">Remember me</Label>
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLogin ? 'Log In' : 'Sign Up'}
            </Button>
            
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
            </button>
            
            {hasExistingAccounts && (
              <div className="pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/login')}
                >
                  View Saved Accounts
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}