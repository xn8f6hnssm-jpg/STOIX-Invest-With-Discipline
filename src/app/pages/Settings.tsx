import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Button } from '../components/ui/button';
import { Crown, Shield, User, Mail, Users2, FileText, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { getAccessToken } from '../utils/supabase';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router';
import { signOut } from '../utils/auth';
import { storage } from '../utils/storage';
import { PremiumBadge } from '../components/PremiumBadge';
import { Badge } from '../components/ui/badge';

export function Settings() {
  const [isPremium, setIsPremium] = useState(false);
  const [skipLanding, setSkipLanding] = useState(localStorage.getItem('stoix_skip_landing') === 'true');
  const [profile, setProfile] = useState<any>(null);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const currentUser = storage.getCurrentUser();
  const allUsers = storage.getAllUsers();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ecfd718d/auth/profile`,
        { headers: { 'Authorization': `Bearer ${token}` } }
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

  const canAddAccount = allUsers.length < 3;

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
              <div className="pt-2 border-t space-y-2">
                {allUsers.length > 1 && (
                  <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
                    <Users2 className="w-4 h-4 mr-2" />
                    Switch Account ({allUsers.length} total)
                  </Button>
                )}
                {canAddAccount ? (
                  <Button variant="outline" className="w-full" onClick={() => navigate('/login?signup=true')}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Another Account ({3 - allUsers.length} slot{3 - allUsers.length !== 1 ? 's' : ''} left)
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground text-center">Maximum of 3 accounts reached</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Premium Status */}
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
          <CardHeader><CardTitle className="text-lg">Appearance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Toggle dark mode theme</p>
              </div>
              <Switch id="dark-mode" checked={theme === 'dark'} onCheckedChange={toggleTheme} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="skip-landing">Skip Intro Page</Label>
                <p className="text-sm text-muted-foreground">Go straight to your account when you visit</p>
              </div>
              <Switch
                id="skip-landing"
                checked={skipLanding}
                onCheckedChange={(checked) => {
                  setSkipLanding(checked);
                  if (checked) localStorage.setItem('stoix_skip_landing', 'true');
                  else localStorage.removeItem('stoix_skip_landing');
                  toast.success(checked ? 'Will skip intro page next visit' : 'Will show intro page next visit');
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Notifications</CardTitle></CardHeader>
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
          <CardHeader><CardTitle className="text-lg">Privacy</CardTitle></CardHeader>
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
          <CardHeader><CardTitle className="text-lg">Account</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full">Change Password</Button>
            <Button variant="outline" className="w-full">Update Email</Button>
            <Button variant="outline" className="w-full" onClick={async () => {
              await signOut();
              navigate('/login');
            }}>Sign Out</Button>
            <Button variant="destructive" className="w-full">Delete Account</Button>
          </CardContent>
        </Card>

        {/* Legal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              Legal
            </CardTitle>
            <CardDescription>Terms of Service and Privacy Policy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/app/legal')}>
              <FileText className="w-4 h-4 mr-2" />
              Terms of Service
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/app/legal')}>
              <Shield className="w-4 h-4 mr-2" />
              Privacy Policy
            </Button>
          </CardContent>
        </Card>


      </div>
    </div>
  );
}
