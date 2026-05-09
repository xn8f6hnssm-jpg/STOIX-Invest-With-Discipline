import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { supabase } from '../utils/supabase';
import { storage } from '../utils/storage';
import { 
  Shield, Plus, Trash2, RefreshCw, TrendingUp, TrendingDown, 
  Award, Target, Clock, BarChart2, Zap, CheckCircle, AlertCircle,
  Copy, Check, Download
} from 'lucide-react';
import { toast } from 'sonner';

function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'stoix_';
  for (let i = 0; i < 32; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key;
}

const SESSION_LABELS: Record<string, string> = {
  asian: 'Asian',
  london: 'London',
  london_newyork_overlap: 'London/NY Overlap',
  newyork: 'New York',
  off_hours: 'Off Hours',
};

export function VerifiedTrades() {
  const currentUser = storage.getCurrentUser();
  const [connections, setConnections] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trades' | 'connect'>('dashboard');
  const [showConnect, setShowConnect] = useState(false);
  const [brokerName, setBrokerName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState('mt4');
  const [connecting, setConnecting] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (currentUser) loadData();
  }, []);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [{ data: conns }, { data: statsData }, { data: tradesData }] = await Promise.all([
        supabase.from('broker_connections').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }),
        supabase.from('verified_stats').select('*').eq('user_id', currentUser.id).maybeSingle(),
        supabase.from('verified_trades').select('*').eq('user_id', currentUser.id).order('open_time', { ascending: false }).limit(100),
      ]);
      setConnections(conns || []);
      setStats(statsData);
      setTrades(tradesData || []);
    } catch (err) {
      console.error('Error loading verified trades:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!currentUser || !brokerName.trim() || !accountNumber.trim()) return;
    setConnecting(true);
    try {
      const apiKey = generateApiKey();
      const { error } = await supabase.from('broker_connections').insert({
        user_id: currentUser.id,
        broker_name: brokerName.trim(),
        account_number: accountNumber.trim(),
        account_type: accountType,
        ea_api_key: apiKey,
        ea_api_key_hash: apiKey, // simplified for MVP
        is_active: true,
        sync_status: 'pending',
      });
      if (error) throw error;
      setNewKey(apiKey);
      setBrokerName('');
      setAccountNumber('');
      await loadData();
    } catch (err) {
      toast.error('Failed to create connection');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Disconnect this account? Your verified trade history will be kept.')) return;
    await supabase.from('broker_connections').update({ is_active: false }).eq('id', id);
    await loadData();
    toast.success('Account disconnected');
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fmtPnl = (val: number) => `${val >= 0 ? '+' : ''}$${Math.abs(val).toFixed(2)}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  const hasConnection = connections.some(c => c.is_active);
  const isVerified = stats?.is_verified;

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg">Verified Trades</h2>
          {isVerified && (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />Verified
            </Badge>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-1" />Refresh
        </Button>
      </div>

      {/* No connection state */}
      {!hasConnection && !showConnect && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center space-y-4">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground opacity-40" />
            <div>
              <h3 className="font-semibold mb-1">Connect Your MT4/MT5 Account</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Automatically sync all your trades directly from your broker. No manual entry — everything is verified.
              </p>
            </div>
            <Button onClick={() => setShowConnect(true)}>
              <Plus className="w-4 h-4 mr-2" />Connect Account
            </Button>
          </CardContent>
        </Card>
      )}

      {/* New key display */}
      {newKey && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="font-semibold text-green-500">Account Connected!</p>
            </div>
            <p className="text-sm text-muted-foreground">Copy your connection key and paste it into the STOIX EA in MT4/MT5. <strong>This key is shown once.</strong></p>
            <div className="flex gap-2">
              <Input value={newKey} readOnly className="font-mono text-xs" />
              <Button size="icon" variant="outline" onClick={() => copyKey(newKey)}>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="pt-2 border-t space-y-1">
              <p className="text-xs font-semibold">How to install:</p>
              <p className="text-xs text-muted-foreground">1. Download the STOIX_Sync.mq4 EA file</p>
              <p className="text-xs text-muted-foreground">2. Copy it to your MT4 → MQL4/Experts folder</p>
              <p className="text-xs text-muted-foreground">3. In MT4: Tools → Options → Expert Advisors → Add URL: <code className="text-xs bg-muted px-1 rounded">https://pwgsrikdthttjbnboiua.supabase.co</code></p>
              <p className="text-xs text-muted-foreground">4. Attach EA to any chart, paste your key, enable AutoTrading</p>
            </div>
            <Button size="sm" variant="outline" className="w-full" onClick={() => {
              const link = document.createElement('a');
              link.href = '/STOIX_Sync.mq4';
              link.download = 'STOIX_Sync.mq4';
              link.click();
            }}>
              <Download className="w-4 h-4 mr-2" />Download STOIX_Sync.mq4
            </Button>
            <Button size="sm" variant="ghost" className="w-full" onClick={() => setNewKey(null)}>
              I've saved my key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Connect form */}
      {showConnect && !newKey && (
        <Card>
          <CardHeader><CardTitle className="text-base">Connect MT4/MT5 Account</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Broker Name</Label>
              <Input value={brokerName} onChange={e => setBrokerName(e.target.value)} placeholder="e.g. FTMO, MyFundedFX, IC Markets" className="mt-1" />
            </div>
            <div>
              <Label>Account Number</Label>
              <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Your MT4/MT5 account number" className="mt-1" />
            </div>
            <div>
              <Label>Platform</Label>
              <div className="flex gap-2 mt-1">
                {['mt4', 'mt5'].map(t => (
                  <button key={t} onClick={() => setAccountType(t)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${accountType === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleConnect} disabled={connecting || !brokerName.trim() || !accountNumber.trim()}>
                {connecting ? 'Connecting...' : 'Generate Connection Key'}
              </Button>
              <Button variant="outline" onClick={() => setShowConnect(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected accounts */}
      {connections.length > 0 && (
        <div className="space-y-2">
          {connections.map(conn => (
            <Card key={conn.id} className={conn.is_active ? '' : 'opacity-50'}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${conn.sync_status === 'success' ? 'bg-green-500' : conn.sync_status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                    <div>
                      <p className="font-medium text-sm">{conn.broker_name}</p>
                      <p className="text-xs text-muted-foreground">#{conn.account_number} · {conn.account_type.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {conn.last_sync && <p className="text-xs text-muted-foreground">{fmtDate(conn.last_sync)}</p>}
                    {conn.is_active && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDisconnect(conn.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
                {!conn.is_active && <p className="text-xs text-muted-foreground mt-1">Disconnected</p>}
              </CardContent>
            </Card>
          ))}
          {hasConnection && !showConnect && (
            <Button variant="outline" size="sm" className="w-full" onClick={() => setShowConnect(true)}>
              <Plus className="w-4 h-4 mr-2" />Add Another Account
            </Button>
          )}
        </div>
      )}

      {/* Stats dashboard */}
      {stats && trades.length > 0 && (
        <>
          {/* Tabs */}
          <div className="flex border-b">
            {(['dashboard', 'trades'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
                {tab === 'dashboard' ? 'Analytics' : 'Trade Log'}
              </button>
            ))}
          </div>

          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Win Rate', value: `${stats.win_rate}%`, color: stats.win_rate >= 50 ? 'text-green-500' : 'text-red-500', icon: Target },
                  { label: 'Avg R:R', value: stats.avg_rr?.toFixed(2) || '—', color: stats.avg_rr >= 1 ? 'text-green-500' : 'text-red-500', icon: BarChart2 },
                  { label: 'Net P&L', value: fmtPnl(stats.total_pnl), color: stats.total_pnl >= 0 ? 'text-green-500' : 'text-red-500', icon: TrendingUp },
                  { label: 'Profit Factor', value: stats.profit_factor?.toFixed(2) || '—', color: stats.profit_factor >= 1 ? 'text-green-500' : 'text-red-500', icon: Zap },
                  { label: 'Expectancy', value: `$${stats.expectancy?.toFixed(2) || '0'}`, color: stats.expectancy >= 0 ? 'text-green-500' : 'text-red-500', icon: Award },
                  { label: 'Consistency', value: `${stats.consistency_score?.toFixed(0) || 0}%`, color: stats.consistency_score >= 70 ? 'text-green-500' : 'text-yellow-500', icon: Shield },
                ].map(m => (
                  <Card key={m.label}>
                    <CardContent className="pt-4 pb-4 text-center">
                      <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Trade breakdown */}
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-sm font-semibold mb-3">Trade Breakdown</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div><p className="text-lg font-bold">{stats.total_trades}</p><p className="text-xs text-muted-foreground">Total</p></div>
                    <div><p className="text-lg font-bold text-green-500">{stats.winning_trades}</p><p className="text-xs text-muted-foreground">Wins</p></div>
                    <div><p className="text-lg font-bold text-red-500">{stats.losing_trades}</p><p className="text-xs text-muted-foreground">Losses</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center mt-3 pt-3 border-t">
                    <div><p className="text-lg font-bold text-green-500">+${stats.avg_winner?.toFixed(2)}</p><p className="text-xs text-muted-foreground">Avg Winner</p></div>
                    <div><p className="text-lg font-bold text-red-500">-${stats.avg_loser?.toFixed(2)}</p><p className="text-xs text-muted-foreground">Avg Loser</p></div>
                  </div>
                </CardContent>
              </Card>

              {/* Best performers */}
              <div className="grid grid-cols-2 gap-3">
                {stats.best_session && (
                  <Card>
                    <CardContent className="pt-4 pb-4 text-center">
                      <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                      <p className="font-semibold text-sm">{SESSION_LABELS[stats.best_session] || stats.best_session}</p>
                      <p className="text-xs text-muted-foreground">Best Session</p>
                    </CardContent>
                  </Card>
                )}
                {stats.best_symbol && (
                  <Card>
                    <CardContent className="pt-4 pb-4 text-center">
                      <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-500" />
                      <p className="font-semibold text-sm">{stats.best_symbol}</p>
                      <p className="text-xs text-muted-foreground">Best Symbol</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Streaks */}
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-sm font-semibold mb-3">Streaks</p>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div><p className="text-lg font-bold">🔥 {stats.current_streak}</p><p className="text-xs text-muted-foreground">Current Streak</p></div>
                    <div><p className="text-lg font-bold">⚡ {stats.longest_streak}</p><p className="text-xs text-muted-foreground">Longest Streak</p></div>
                  </div>
                </CardContent>
              </Card>

              {/* Max drawdown */}
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Max Drawdown</p>
                    <p className="text-sm font-bold text-red-500">-${stats.max_drawdown?.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Not verified yet */}
              {!isVerified && (
                <Card className="border-yellow-500/30 bg-yellow-500/5">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <p className="text-sm font-semibold text-yellow-500">Not Verified Yet</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Complete {10 - (stats.total_trades || 0)} more verified trades to earn your Verified badge.
                    </p>
                    <div className="mt-2 w-full bg-muted rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-yellow-500" style={{ width: `${Math.min(100, ((stats.total_trades || 0) / 10) * 100)}%` }} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'trades' && (
            <div className="space-y-2">
              {trades.map(trade => (
                <Card key={trade.id}>
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{trade.symbol}</span>
                        <Badge variant="outline" className="text-xs capitalize">{trade.trade_type}</Badge>
                        <Badge className={`text-xs ${trade.result === 'win' ? 'bg-green-500/20 text-green-500' : trade.result === 'loss' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                          {trade.result || 'open'}
                        </Badge>
                      </div>
                      {trade.net_profit !== null && (
                        <span className={`text-sm font-bold ${trade.net_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {fmtPnl(trade.net_profit)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{fmtDate(trade.open_time)}</span>
                      {trade.risk_reward !== null && <span>RR: {trade.risk_reward}</span>}
                      {trade.pips !== null && <span>{trade.pips > 0 ? '+' : ''}{trade.pips} pips</span>}
                      {trade.session && <span>{SESSION_LABELS[trade.session]}</span>}
                      <span>{trade.lot_size} lots</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {trades.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No verified trades yet. Install the EA to start syncing.</p>
              )}
            </div>
          )}
        </>
      )}

      {/* Waiting for first sync */}
      {hasConnection && trades.length === 0 && !showConnect && !newKey && (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <RefreshCw className="w-10 h-10 mx-auto text-muted-foreground opacity-40 animate-spin" />
            <p className="font-medium">Waiting for trades...</p>
            <p className="text-sm text-muted-foreground">Install the EA on MT4/MT5 and enable AutoTrading. Trades will appear here automatically.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
