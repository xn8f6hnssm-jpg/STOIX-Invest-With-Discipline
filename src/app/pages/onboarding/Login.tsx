import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Logo } from '../../components/Logo';
import { storage } from '../../utils/storage';
import { User, Shield, TrendingUp, Briefcase } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

export function Login() {
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState(storage.getAllUsers());

  useEffect(() => {
    // Reload users when component mounts
    setAllUsers(storage.getAllUsers());
  }, []);

  const handleSelectUser = (user: typeof allUsers[0]) => {
    storage.setCurrentUser(user);
    navigate('/app');
  };

  const handleCreateNewAccount = () => {
    navigate('/');
  };

  const getTradingStyleIcon = (style: string) => {
    switch (style) {
      case 'Long Term Hold':
        return Briefcase;
      case 'Day Trader':
        return TrendingUp;
      case 'Swing Trader':
        return Shield;
      default:
        return User;
    }
  };

  const getTradingStyleColor = (style: string) => {
    switch (style) {
      case 'Long Term Hold':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';
      case 'Day Trader':
        return 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20';
      case 'Swing Trader':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20';
    }
  };

  const canCreateMore = allUsers.length < 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center mb-8">
          <Logo size="lg" className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Welcome Back to STOIX</h1>
          <p className="text-muted-foreground">Select an account to continue</p>
        </div>

        {allUsers.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No Accounts Found</h2>
              <p className="text-muted-foreground mb-6">Create your first account to get started</p>
              <Button onClick={handleCreateNewAccount} size="lg">
                Create Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {allUsers.map((user) => {
                const Icon = getTradingStyleIcon(user.tradingStyle);
                return (
                  <Card
                    key={user.id}
                    className="group hover:shadow-lg transition-all duration-200 hover:border-primary/50 cursor-pointer"
                    onClick={() => handleSelectUser(user)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon className="w-7 h-7 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold">{user.name}</h3>
                              {user.isPremium && (
                                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                                  Premium
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className={getTradingStyleColor(user.tradingStyle)}
                              >
                                {user.tradingStyle}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {user.totalPoints} points
                              </span>
                              <span className="text-sm text-muted-foreground">
                                • {user.currentStreak} day streak
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Login →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {canCreateMore && (
              <Card className="border-dashed border-2">
                <CardContent className="pt-6 text-center py-8">
                  <User className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Create Another Account</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Test different trading styles ({3 - allUsers.length} slot{3 - allUsers.length !== 1 ? 's' : ''} remaining)
                  </p>
                  <Button onClick={handleCreateNewAccount} variant="outline">
                    + Add Account
                  </Button>
                </CardContent>
              </Card>
            )}

            {!canCreateMore && (
              <p className="text-center text-sm text-muted-foreground">
                Maximum of 3 accounts reached
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
