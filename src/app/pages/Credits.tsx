import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { DollarSign, TrendingUp, ArrowDownToLine, Clock, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { storage, CreditTransaction } from '../utils/storage';
import { useNavigate } from 'react-router';

export function Credits() {
  const navigate = useNavigate();
  const currentUser = storage.getCurrentUser();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountLast4, setAccountLast4] = useState('');

  if (!currentUser) {
    return <div className="p-6">Please log in to view credits</div>;
  }

  // Get or create user credits
  let userCredits = storage.getUserCredits().find(c => c.userId === currentUser.id);
  if (!userCredits) {
    userCredits = {
      userId: currentUser.id,
      balance: 0,
      totalEarned: 0,
      totalWithdrawn: 0,
      transactions: [],
    };
    storage.addUserCredits(userCredits);
  }

  // Get all transactions
  const allTransactions = storage.getCreditTransactions().filter(t => t.userId === currentUser.id);

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (amount > userCredits!.balance) {
      alert('Insufficient balance');
      return;
    }

    if (amount < 10) {
      alert('Minimum withdrawal amount is $10');
      return;
    }

    if (!bankName.trim() || !accountLast4.trim()) {
      alert('Please provide bank details');
      return;
    }

    // Create withdrawal transaction
    storage.addCreditTransaction({
      userId: currentUser.id,
      type: 'withdrawal',
      amount: -amount,
      source: `Withdrawal to ${bankName} (****${accountLast4})`,
      status: 'pending',
      withdrawalDetails: {
        bankName: bankName.trim(),
        accountLast4: accountLast4.trim(),
      },
    });

    // Update user credits
    storage.updateUserCredits(currentUser.id, {
      balance: userCredits!.balance - amount,
      totalWithdrawn: userCredits!.totalWithdrawn + amount,
    });

    setShowWithdrawModal(false);
    setWithdrawAmount('');
    setBankName('');
    setAccountLast4('');

    alert(`Withdrawal of $${amount.toFixed(2)} initiated! Funds will be transferred within 3-5 business days.`);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/app/groups')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Groups
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <DollarSign className="w-8 h-8 text-green-500" />
          Credits & Earnings
        </h1>
        <p className="text-muted-foreground">
          Manage your earnings from paid groups
        </p>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Available Balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              ${userCredits.balance.toFixed(2)}
            </div>
            <Button
              onClick={() => setShowWithdrawModal(true)}
              className="w-full mt-4"
              disabled={userCredits.balance < 10}
            >
              <ArrowDownToLine className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
            {userCredits.balance < 10 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Minimum withdrawal: $10
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Earned</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${userCredits.totalEarned.toFixed(2)}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
              <TrendingUp className="w-4 h-4" />
              <span>All-time earnings</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Withdrawn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${userCredits.totalWithdrawn.toFixed(2)}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Successfully paid out</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Your earnings and withdrawals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allTransactions.length === 0 ? (
            <div className="py-12 text-center">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Earn credits by creating paid groups
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allTransactions
                .sort((a, b) => b.timestamp - a.timestamp)
                .map(transaction => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'earn'
                          ? 'bg-green-500/10'
                          : transaction.type === 'withdrawal'
                          ? 'bg-blue-500/10'
                          : 'bg-gray-500/10'
                      }`}>
                        {transaction.type === 'earn' ? (
                          <TrendingUp className={`w-5 h-5 text-green-500`} />
                        ) : transaction.type === 'withdrawal' ? (
                          <ArrowDownToLine className={`w-5 h-5 text-blue-500`} />
                        ) : (
                          <DollarSign className={`w-5 h-5 text-gray-500`} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {transaction.type === 'earn' ? 'Group Payment' : 'Withdrawal'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.source || 'No description'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.timestamp).toLocaleDateString()} • {new Date(transaction.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        transaction.type === 'earn'
                          ? 'text-green-500'
                          : 'text-blue-500'
                      }`}>
                        {transaction.type === 'earn' ? '+' : ''}{transaction.type === 'withdrawal' ? '' : ''}${Math.abs(transaction.amount).toFixed(2)}
                      </p>
                      <Badge
                        className={
                          transaction.status === 'completed'
                            ? 'bg-green-500/20 text-green-500'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : 'bg-red-500/20 text-red-500'
                        }
                      >
                        {transaction.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {transaction.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {transaction.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Fee Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-2">
            <span className="text-green-500 font-bold">95%</span>
            <p className="text-muted-foreground">
              You keep 95% of all payments from members joining your paid groups
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-blue-500 font-bold">5%</span>
            <p className="text-muted-foreground">
              Platform fee (5%) covers payment processing, hosting, and features
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-purple-500 font-bold">$10</span>
            <p className="text-muted-foreground">
              Minimum withdrawal amount. Funds transferred within 3-5 business days
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Withdraw Modal */}
      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Transfer your earnings to your bank account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-green-500">
                ${userCredits.balance.toFixed(2)}
              </p>
            </div>

            <div>
              <Label>Withdrawal Amount</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="10"
                max={userCredits.balance}
                step="0.01"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum: $10.00 • Maximum: ${userCredits.balance.toFixed(2)}
              </p>
            </div>

            <div>
              <Label>Bank Name</Label>
              <Input
                placeholder="e.g., Chase Bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>

            <div>
              <Label>Last 4 Digits of Account</Label>
              <Input
                placeholder="1234"
                value={accountLast4}
                onChange={(e) => setAccountLast4(e.target.value)}
                maxLength={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                For verification purposes only
              </p>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 text-sm">
              <p className="text-muted-foreground">
                ⏰ Funds will be transferred within <strong>3-5 business days</strong>
              </p>
            </div>

            <Button
              onClick={handleWithdraw}
              className="w-full"
              disabled={
                !withdrawAmount ||
                parseFloat(withdrawAmount) < 10 ||
                parseFloat(withdrawAmount) > userCredits.balance ||
                !bankName.trim() ||
                !accountLast4.trim()
              }
            >
              <ArrowDownToLine className="w-4 h-4 mr-2" />
              Withdraw ${withdrawAmount ? parseFloat(withdrawAmount).toFixed(2) : '0.00'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}