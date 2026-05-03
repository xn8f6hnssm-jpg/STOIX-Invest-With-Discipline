import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { DollarSign, TrendingUp, ArrowDownToLine, Clock, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { storage } from '../utils/storage';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

const ADMIN_USER_ID = '4f2c0248-b281-4260-97ff-25c375024c7e'; // Your user ID

export function Credits() {
  const navigate = useNavigate();
  const currentUser = storage.getCurrentUser();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'paypal' | 'venmo' | 'zelle' | 'cashapp'>('paypal');
  const [payoutHandle, setPayoutHandle] = useState('');

  if (!currentUser) return <div className="p-6">Please log in to view credits</div>;

  let userCredits = storage.getUserCredits().find(c => c.userId === currentUser.id);
  if (!userCredits) {
    userCredits = { userId: currentUser.id, balance: 0, totalEarned: 0, totalWithdrawn: 0, transactions: [] };
    storage.addUserCredits(userCredits);
  }

  const allTransactions = storage.getCreditTransactions().filter(t => t.userId === currentUser.id);
  const isAdmin = currentUser.id === ADMIN_USER_ID;

  // Admin: get ALL pending withdrawals across all users
  const allPendingWithdrawals = isAdmin
    ? storage.getCreditTransactions().filter(t => t.type === 'withdrawal' && t.status === 'pending')
    : [];

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    if (amount > userCredits!.balance) { toast.error('Insufficient balance'); return; }
    if (amount < 10) { toast.error('Minimum withdrawal is $10'); return; }
    if (!payoutHandle.trim()) { toast.error(`Enter your ${payoutMethod} handle`); return; }

    storage.addCreditTransaction({
      userId: currentUser.id,
      type: 'withdrawal',
      amount: -amount,
      source: `Withdrawal via ${payoutMethod.toUpperCase()} (${payoutHandle.trim()})`,
      status: 'pending',
      withdrawalDetails: {
        bankName: payoutMethod,
        accountLast4: payoutHandle.trim(),
      },
    });

    storage.updateUserCredits(currentUser.id, {
      balance: userCredits!.balance - amount,
      totalWithdrawn: userCredits!.totalWithdrawn + amount,
    });

    setShowWithdrawModal(false);
    setWithdrawAmount('');
    setPayoutHandle('');
    toast.success('Withdrawal requested! You\'ll receive payment within 3-5 business days.');
  };

  const handleMarkPaid = (transactionId: string) => {
    // Mark the transaction as completed
    const allTx = storage.getCreditTransactions();
    const updated = allTx.map((t: any) =>
      t.id === transactionId ? { ...t, status: 'completed' } : t
    );
    localStorage.setItem('tradeforge_credit_transactions', JSON.stringify(updated));
    toast.success('Marked as paid!');
    window.location.reload();
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/app/groups')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />Back to Groups
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
          <DollarSign className="w-7 h-7 text-green-500" />Credits & Earnings
        </h1>
        <p className="text-muted-foreground text-sm">Manage your earnings from paid groups</p>
      </div>

      {/* Admin Panel */}
      {isAdmin && allPendingWithdrawals.length > 0 && (
        <Card className="mb-6 border-red-500/30 bg-red-500/5">
          <CardHeader>
            <CardTitle className="text-red-600">⚠️ Pending Withdrawals ({allPendingWithdrawals.length})</CardTitle>
            <CardDescription>These users are waiting to be paid out manually</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {allPendingWithdrawals.map((tx: any) => {
              const user = storage.getAllUsers().find((u: any) => u.id === tx.userId);
              return (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                  <div>
                    <p className="font-semibold text-sm">@{user?.username || tx.userId}</p>
                    <p className="text-xs text-muted-foreground">{tx.source}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.timestamp).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <p className="font-bold text-green-500 text-lg">${Math.abs(tx.amount).toFixed(2)}</p>
                    <Button size="sm" onClick={() => handleMarkPaid(tx.id)}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />Mark Paid
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Balance Overview */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Available</p>
            <p className="text-2xl font-bold text-green-500">${userCredits.balance.toFixed(2)}</p>
            <Button onClick={() => setShowWithdrawModal(true)} className="w-full mt-3" size="sm" disabled={userCredits.balance < 10}>
              <ArrowDownToLine className="w-3 h-3 mr-1" />Withdraw
            </Button>
            {userCredits.balance < 10 && <p className="text-xs text-muted-foreground mt-1 text-center">Min: $10</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Total Earned</p>
            <p className="text-2xl font-bold">${userCredits.totalEarned.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Withdrawn</p>
            <p className="text-2xl font-bold">${userCredits.totalWithdrawn.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Paid out</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {allTransactions.length === 0 ? (
            <div className="py-10 text-center">
              <DollarSign className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-muted-foreground text-sm">No transactions yet</p>
              <p className="text-xs text-muted-foreground mt-1">Earn credits by creating paid groups</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allTransactions.sort((a, b) => b.timestamp - a.timestamp).map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.type === 'earn' ? 'bg-green-500/10' : 'bg-blue-500/10'}`}>
                      {tx.type === 'earn' ? <TrendingUp className="w-4 h-4 text-green-500" /> : <ArrowDownToLine className="w-4 h-4 text-blue-500" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tx.type === 'earn' ? 'Group Payment' : 'Withdrawal'}</p>
                      <p className="text-xs text-muted-foreground">{tx.source}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.type === 'earn' ? 'text-green-500' : 'text-blue-500'}`}>
                      {tx.type === 'earn' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                    </p>
                    <Badge className={tx.status === 'completed' ? 'bg-green-500/20 text-green-500' : tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'}>
                      {tx.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {tx.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                      {tx.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader><CardTitle className="text-base">How It Works</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-2"><span className="text-green-500 font-bold">95%</span><p className="text-muted-foreground">You keep 95% of all group payments</p></div>
          <div className="flex gap-2"><span className="text-blue-500 font-bold">5%</span><p className="text-muted-foreground">Platform fee covers hosting and features</p></div>
          <div className="flex gap-2"><span className="text-purple-500 font-bold">$10</span><p className="text-muted-foreground">Minimum withdrawal. Paid within 3-5 business days via PayPal, Venmo, Zelle, or Cash App</p></div>
        </CardContent>
      </Card>

      {/* Withdraw Modal */}
      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>We'll send payment manually within 3-5 business days</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-xs text-muted-foreground mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-green-500">${userCredits.balance.toFixed(2)}</p>
            </div>

            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" placeholder="0.00" value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)} min="10" max={userCredits.balance} step="0.01" />
              <p className="text-xs text-muted-foreground">Min $10 · Max ${userCredits.balance.toFixed(2)}</p>
            </div>

            <div className="space-y-2">
              <Label>Payout Method</Label>
              <Select value={payoutMethod} onValueChange={(v: any) => setPayoutMethod(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="venmo">Venmo</SelectItem>
                  <SelectItem value="zelle">Zelle</SelectItem>
                  <SelectItem value="cashapp">Cash App</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                {payoutMethod === 'paypal' ? 'PayPal Email' :
                 payoutMethod === 'venmo' ? 'Venmo Username (@...)' :
                 payoutMethod === 'zelle' ? 'Zelle Email or Phone' :
                 'Cash App $Cashtag'}
              </Label>
              <Input
                placeholder={
                  payoutMethod === 'paypal' ? 'you@email.com' :
                  payoutMethod === 'venmo' ? '@username' :
                  payoutMethod === 'zelle' ? 'email or phone' :
                  '$cashtag'
                }
                value={payoutHandle}
                onChange={e => setPayoutHandle(e.target.value)}
              />
            </div>

            <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground">
              ⏰ We'll review and send payment within <strong>3-5 business days</strong>. You'll see the status update here.
            </div>

            <Button onClick={handleWithdraw} className="w-full"
              disabled={!withdrawAmount || parseFloat(withdrawAmount) < 10 || parseFloat(withdrawAmount) > userCredits.balance || !payoutHandle.trim()}>
              <ArrowDownToLine className="w-4 h-4 mr-2" />
              Request ${withdrawAmount ? parseFloat(withdrawAmount).toFixed(2) : '0.00'} Withdrawal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
