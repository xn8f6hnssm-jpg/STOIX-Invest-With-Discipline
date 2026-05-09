import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { supabase } from '../utils/supabase';
import { storage } from '../utils/storage';
import { 
  Shield, Plus, Trash2, RefreshCw, TrendingUp, TrendingDown, Upload, Share2, Download, Crown, 
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
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const [showShareCard, setShowShareCard] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadData();
      const saved = localStorage.getItem(`stoix_trade_screenshots_${currentUser.id}`);
      if (saved) setScreenshots(JSON.parse(saved));
    }
  }, []);

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !currentUser) return;
    setUploadingScreenshot(true);
    const readers = files.map(file => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    }));
    Promise.all(readers).then(newScreenshots => {
      const updated = [...screenshots, ...newScreenshots];
      setScreenshots(updated);
      localStorage.setItem(`stoix_trade_screenshots_${currentUser.id}`, JSON.stringify(updated));
      setUploadingScreenshot(false);
      toast.success('Screenshot added!');
    });
  };

  const handleDeleteScreenshot = (idx: number) => {
    const updated = screenshots.filter((_, i) => i !== idx);
    setScreenshots(updated);
    if (currentUser) localStorage.setItem(`stoix_trade_screenshots_${currentUser.id}`, JSON.stringify(updated));
  };

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
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowShareCard(true)}>
            <Share2 className="w-4 h-4 mr-1" />Share Card
          </Button>
          <Button size="sm" variant="outline" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-1" />Refresh
          </Button>
        </div>
      </div>

      {/* Share Card Dialog */}
      <Dialog open={showShareCard} onOpenChange={setShowShareCard}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Verified Trading Card</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-3">
            {/* Coming soon banner */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-2">
              <span className="text-lg">🔧</span>
              <div>
                <p className="text-xs font-bold text-amber-500">Coming Soon</p>
                <p className="text-xs text-muted-foreground">Full verified share card with broker-synced data</p>
              </div>
            </div>

            {/* Preview card */}
            <div className="w-full aspect-square bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-5 flex flex-col justify-between">
              {/* Header */}
              <div className="text-center space-y-1">
                <div className="flex justify-center items-center gap-2">
                  <span className="text-white font-bold text-base tracking-widest">STOIX</span>
                </div>
                <p className="text-xs text-slate-400 uppercase tracking-widest">Verified Performance</p>
                {isVerified && (
                  <div className="flex justify-center">
                    <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />Verified
                    </span>
                  </div>
                )}
              </div>

              {/* Stats */}
              {stats ? (
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-white">{stats.win_rate}%</p>
                    <p className="text-sm text-slate-300 font-semibold">Win Rate</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div>
                      <p className="text-xl font-bold text-white">{stats.avg_rr?.toFixed(2)}</p>
                      <p className="text-xs text-slate-400">Avg R:R</p>
                    </div>
                    <div>
                      <p className={`text-xl font-bold ${stats.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {stats.total_pnl >= 0 ? '+' : ''}${Math.abs(stats.total_pnl).toFixed(0)}
                      </p>
                      <p className="text-xs text-slate-400">Net P&L</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{stats.total_trades}</p>
                      <p className="text-xs text-slate-400">Trades</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{stats.consistency_score?.toFixed(0)}%</p>
                      <p className="text-xs text-slate-400">Consistency</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <p className="text-slate-400 text-sm">Connect your broker to see verified stats</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['Win Rate', 'Avg R:R', 'Net P&L', 'Trades'].map(label => (
                      <div key={label} className="bg-slate-800 rounded-lg p-2 text-center">
                        <p className="text-slate-600 text-lg font-bold">—</p>
                        <p className="text-slate-500 text-xs">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="text-center">
                <p className="text-xs text-slate-500">stoixtrader.com · Trade With Discipline</p>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" className="w-full" disabled>
                <Share2 className="w-3.5 h-3.5 mr-1.5" />Share
              </Button>
              <Button size="sm" variant="outline" className="w-full" disabled>
                <Download className="w-3.5 h-3.5 mr-1.5" />Download
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">Full functionality coming when broker sync launches</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* WIP Banner */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔧</span>
            <div>
              <p className="font-semibold text-sm text-amber-500">Work in Progress</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                We're building direct broker integration so STOIX automatically pulls all your trade data — entries, exits, P&L, RR, and more — directly from your account. No manual input. No faking results.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Coming soon:</strong> Tradovate, NinjaTrader, Rithmic, MT4/MT5, cTrader
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Screenshot Upload */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Trade Screenshots</p>
              <p className="text-xs text-muted-foreground">Upload screenshots of your trades while broker sync is being built</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => screenshotInputRef.current?.click()} disabled={uploadingScreenshot}>
              <Plus className="w-4 h-4 mr-1" />{uploadingScreenshot ? 'Uploading...' : 'Add'}
            </Button>
            <input ref={screenshotInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleScreenshotUpload} />
          </div>

          {screenshots.length === 0 ? (
            <div className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => screenshotInputRef.current?.click()}>
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">Tap to upload trade screenshots</p>
              <p className="text-xs text-muted-foreground mt-1">PnL screenshots, trade confirmations, broker statements</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {screenshots.map((src, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border">
                  <img src={src} alt={`Trade ${i + 1}`} className="w-full h-36 object-cover" />
                  <button onClick={() => handleDeleteScreenshot(i)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="border-2 border-dashed rounded-xl h-36 flex items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => screenshotInputRef.current?.click()}>
                <Plus className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* No connection state */}
      {!hasConnection && !showConnect && (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center space-y-3">
            <Shield className="w-10 h-10 mx-auto text-muted-foreground opacity-40" />
            <div>
              <h3 className="font-semibold text-sm mb-1">MT4/MT5 Available Now</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                If you trade on MT4 or MT5 you can connect your account now using our EA.
              </p>
            </div>
            <Button size="sm" onClick={() => setShowConnect(true)}>
              <Plus className="w-4 h-4 mr-2" />Connect MT4/MT5
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Coming Soon platforms */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Coming Soon</p>
        {[
          { name: 'Tradovate', desc: 'Futures · NQ, ES, CL', icon: '⚡' },
          { name: 'NinjaTrader', desc: 'Futures · All instruments', icon: '🥷' },
          { name: 'Rithmic', desc: 'Apex, Topstep, & more', icon: '🏆' },
          { name: 'cTrader', desc: 'Forex & CFDs', icon: '📊' },
        ].map(p => (
          <div key={p.name} className="flex items-center justify-between p-3 rounded-lg border border-dashed bg-muted/30">
            <div className="flex items-center gap-3">
              <span className="text-lg">{p.icon}</span>
              <div>
                <p className="font-medium text-sm">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">Coming Soon</Badge>
          </div>
        ))}
      </div>

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
