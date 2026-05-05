import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Crown, CheckCircle, XCircle } from 'lucide-react';
import { storage } from '../utils/storage';
import { toast } from 'sonner';

const VALID_TOKEN = 'stoix_paid_2024_secure';

export function UpgradeSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activated, setActivated] = useState(false);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');

    if (token === VALID_TOKEN && !activated) {
      storage.upgradeToPremium();
      setActivated(true);
      toast.success('Welcome to Premium! 🎉');
    } else {
      setInvalid(true);
    }
  }, []);

  if (invalid) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <Card className="border-red-500">
          <CardContent className="pt-12 pb-10 space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Invalid Access</h1>
              <p className="text-muted-foreground">This page can only be accessed after completing a payment through Stripe.</p>
            </div>
            <Button size="lg" className="w-full" onClick={() => navigate('/app/upgrade')}>
              Go to Upgrade Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-lg text-center">
      <Card className="border-yellow-500 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20">
        <CardContent className="pt-12 pb-10 space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-yellow-600" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">You're Premium! 🎉</h1>
            <p className="text-muted-foreground">Your account has been upgraded. All premium features are now unlocked.</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-yellow-600 font-semibold">
            <Crown className="w-5 h-5" />
            <span>STOIX Premium Active</span>
          </div>
          <Button size="lg" className="w-full" onClick={() => navigate('/app')}>
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
