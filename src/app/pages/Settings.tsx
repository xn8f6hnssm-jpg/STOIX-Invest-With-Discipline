import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Crown, Bug, Shield, AlertTriangle, CheckSquare, User, Mail, Users2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAccessToken } from '../utils/supabase';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router';
import { storage } from '../utils/storage';
import { PremiumBadge } from '../components/PremiumBadge';
import { Badge } from '../components/ui/badge';

export function Settings() {
  const [isPremium, setIsPremium] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const currentUser = storage.getCurrentUser();
  const allUsers = storage.getAllUsers();

  // Account Rules state
  const [maxDailyLoss, setMaxDailyLoss] = useState<string>('');
  const [maxDrawdown, setMaxDrawdown] = useState<string>('');
  const [maxContracts, setMaxContracts] = useState<string>('');
  const [consistencyRules, setConsistencyRules] = useState<string>('');
  
  // Premium settings state
  const [accountProtectionMode, setAccountProtectionMode] = useState(false);
  const [preTradeChecklistEnabled, setPreTradeChecklistEnabled] = useState(false);

  useEffect(() => {
    loadProfile();
    loadSettings();
  }, []);

  const loadProfile = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ecfd718d/auth/profile`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setIsPremium(data.profile?.isPremium || false);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadSettings = () => {
    // Load account rules
    const rules = storage.getAccountRules();
    if (rules) {
      setMaxDailyLoss(rules.maxDailyLoss?.toString() ?? '');
      setMaxDrawdown(rules.maxOverallDrawdown?.toString() ?? '');
      setMaxContracts(rules.maxContracts?.toString() ?? '');
      setConsistencyRules(rules.consistencyRules ?? '');
    }

    // Load premium settings
    setAccountProtectionMode(storage.isAccountProtectionMode() ?? false);
    setPreTradeChecklistEnabled(storage.isPreTradeChecklistEnabled() ?? false);
  };

  const saveAccountRules = () => {
    if (!isPremium) {
      toast.error('Account Rules are a Premium feature');
      return;
    }

    storage.updateAccountRules({
      maxDailyLoss: maxDailyLoss ? parseFloat(maxDailyLoss) : undefined,
      maxOverallDrawdown: maxDrawdown ? parseFloat(maxDrawdown) : undefined,
      maxContracts: maxContracts ? parseFloat(maxContracts) : undefined,
      consistencyRules: consistencyRules || undefined,
    });

    toast.success('Account rules saved');
  };

  const toggleProtectionMode = (enabled: boolean) => {
    if (!isPremium) {
      toast.error('Account Protection Mode is a Premium feature');
      return;
    }
    
    storage.toggleAccountProtectionMode(enabled);
    setAccountProtectionMode(enabled);
    toast.success(enabled ? 'Protection Mode enabled' : 'Protection Mode disabled');
  };

  const togglePreTradeChecklist = (enabled: boolean) => {
    if (!isPremium) {
      toast.error('Pre-Trade Checklist is a Premium feature');
      return;
    }
    
    storage.togglePreTradeChecklist(enabled);
    setPreTradeChecklistEnabled(enabled);
    toast.success(enabled ? 'Pre-Trade Checklist enabled' : 'Pre-Trade Checklist disabled');
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account preferences</p>
      </div>

      <div className="space-y-4">
        {/* Account Info */}
        {currentUser && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <User className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Username</p>
                  <p className="text-sm text-muted-foreground">@{currentUser.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Badge variant="outline">{currentUser.tradingStyle}</Badge>
                <span className="text-sm text-muted-foreground">Trading Style</span>
              </div>
              {allUsers.length > 1 && (
                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/login')}
                  >
                    <Users2 className="w-4 h-4 mr-2" />
                    Switch Account ({allUsers.length} total)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      
        {/* Premium Status - Only show if user is already premium */}
        {isPremium && (
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Crown className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <div className="font-semibold">Premium Member</div>
                  <div className="text-sm text-muted-foreground">
                    {profile?.plan === 'annual' ? 'Annual Plan' : 'Monthly Plan'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Toggle dark mode theme</p>
              </div>
              <Switch 
                id="dark-mode" 
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <Switch id="push-notifications" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <Switch id="email-notifications" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="daily-reminders">Daily Check-In Reminders</Label>
              <Switch id="daily-reminders" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="private-profile">Private Profile</Label>
              <Switch id="private-profile" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="hide-stats">Hide Stats from Others</Label>
              <Switch id="hide-stats" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full">Change Password</Button>
            <Button variant="outline" className="w-full">Update Email</Button>
            <Button variant="destructive" className="w-full">Delete Account</Button>
          </CardContent>
        </Card>

        {/* Developer Tools */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bug className="w-5 h-5" />
              Developer Tools
            </CardTitle>
            <CardDescription>Debug and troubleshooting utilities</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/app/debug-storage')}
            >
              <Bug className="w-4 h-4 mr-2" />
              Storage Debug Panel
            </Button>
          </CardContent>
        </Card>

        {/* Account Rules - Premium Feature */}
        <Card className={!isPremium ? 'opacity-60' : ''}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Account Rules
              {isPremium && <PremiumBadge size="sm" />}
            </CardTitle>
            <CardDescription>
              Set limits for prop firm compliance or personal discipline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="max-daily-loss" className="mb-2 block">Max Daily Loss ($)</Label>
              <Input 
                id="max-daily-loss" 
                type="number" 
                value={maxDailyLoss} 
                onChange={(e) => setMaxDailyLoss(e.target.value)}
                placeholder="e.g., 2500"
                disabled={!isPremium}
              />
            </div>
            <div>
              <Label htmlFor="max-drawdown" className="mb-2 block">Max Overall Drawdown ($)</Label>
              <Input 
                id="max-drawdown" 
                type="number" 
                value={maxDrawdown} 
                onChange={(e) => setMaxDrawdown(e.target.value)}
                placeholder="e.g., 5000"
                disabled={!isPremium}
              />
            </div>
            <div>
              <Label htmlFor="max-contracts" className="mb-2 block">Max Contracts Allowed</Label>
              <Input 
                id="max-contracts" 
                type="number" 
                value={maxContracts} 
                onChange={(e) => setMaxContracts(e.target.value)}
                placeholder="e.g., 10"
                disabled={!isPremium}
              />
            </div>
            <div>
              <Label htmlFor="consistency-rules" className="mb-2 block">Consistency Rules (Optional)</Label>
              <Textarea 
                id="consistency-rules" 
                value={consistencyRules} 
                onChange={(e) => setConsistencyRules(e.target.value)}
                placeholder="e.g., Must have 5 winning days to withdraw"
                rows={3}
                disabled={!isPremium}
              />
            </div>
            <Button 
              onClick={saveAccountRules}
              className="w-full"
              disabled={!isPremium}
            >
              <Shield className="w-4 h-4 mr-2" />
              Save Account Rules
            </Button>
            {!isPremium && (
              <p className="text-sm text-muted-foreground text-center">
                Upgrade to Premium to enable Account Rules
              </p>
            )}
          </CardContent>
        </Card>

        {/* Premium Discipline Settings */}
        <Card className={!isPremium ? 'opacity-60' : ''}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Discipline Protection
              {isPremium && <PremiumBadge size="sm" />}
            </CardTitle>
            <CardDescription>
              Advanced discipline and account safety features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="account-protection-mode" className="font-medium">Account Protection Mode</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Stricter enforcement and warnings when rules are violated
                </p>
              </div>
              <Switch 
                id="account-protection-mode" 
                checked={accountProtectionMode}
                onCheckedChange={toggleProtectionMode}
                disabled={!isPremium}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="pre-trade-checklist" className="font-medium">Pre-Trade Checklist</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Require checklist confirmation before logging trades
                </p>
              </div>
              <Switch 
                id="pre-trade-checklist" 
                checked={preTradeChecklistEnabled}
                onCheckedChange={togglePreTradeChecklist}
                disabled={!isPremium}
              />
            </div>
            {!isPremium && (
              <p className="text-sm text-muted-foreground text-center pt-2">
                Upgrade to Premium to enable Discipline Protection features
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}