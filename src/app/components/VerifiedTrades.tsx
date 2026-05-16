import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { supabase } from '../utils/supabase';
import { storage } from '../utils/storage';
import { Logo } from '../components/Logo';
import domtoimage from 'dom-to-image-more';
import { Crown } from 'lucide-react';
import { 
  Shield, Plus, Trash2, RefreshCw, TrendingUp, Upload, Share2, Download,
  Award, Target, Clock, BarChart2, Zap, CheckCircle, AlertCircle,
  Copy, Check
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
  const [currentUser, setCurrentUser] = useState<any>(storage.getCurrentUser());
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
  const [showShareCard, setShowShareCard] = useState(false);
  const [shareCardPeriod, setShareCardPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'overall'>('overall');
  const [importingCSV, setImportingCSV] = useState(false);
  const [importResult, setImportResult] = useState<{imported: number, skipped: number} | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initUser = async () => {
      let user = storage.getCurrentUser();
      if (!user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle();
          if (profile) {
            user = {
              id: profile.id, email: profile.email, username: profile.username,
              name: profile.name, totalPoints: profile.total_points || 0,
              currentStreak: profile.current_streak || 0, isPremium: profile.is_premium || false,
              profilePicture: profile.profile_picture || '',
            };
            storage.setCurrentUser(user as any);
            setCurrentUser(user);
          }
        }
      } else {
        setCurrentUser(user);
      }
      if (user) {
        loadData();

      }
    };
    initUser();
  }, []);

  const parseTradovatePnL = (pnlStr: string): number => {
    const cleaned = pnlStr.replace(/[$,\s]/g, '');
    if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
      return -parseFloat(cleaned.slice(1, -1));
    }
    return parseFloat(cleaned) || 0;
  };

  const parseTradovateDate = (dateStr: string): string => {
    const [date, time] = dateStr.trim().split(' ');
    const [month, day, year] = date.split('/');
    return new Date(`${year}-${month}-${day}T${time}Z`).toISOString();
  };

  const parseDurationMinutes = (dur: string): number => {
    let total = 0;
    const h = dur.match(/(\d+)hr/);
    const m = dur.match(/(\d+)min/);
    const s = dur.match(/(\d+)sec/);
    if (h) total += parseInt(h[1]) * 60;
    if (m) total += parseInt(m[1]);
    if (s) total += parseInt(s[1]) / 60;
    return Math.round(total);
  };

  const detectSession = (isoDate: string): string => {
    const h = new Date(isoDate).getUTCHours();
    if (h >= 0 && h < 7) return 'asian';
    if (h >= 7 && h < 12) return 'london';
    if (h >= 12 && h < 16) return 'london_newyork_overlap';
    if (h >= 16 && h < 21) return 'newyork';
    return 'off_hours';
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const file = files && files.length > 0 ? files[0] : null;
    console.log("CSV import triggered, file:", file?.name, "user:", currentUser?.id);
    if (!file) { console.log("No file selected"); return; }
    if (!currentUser) { console.log("No current user"); return; }
    setImportingCSV(true);
    processCSVFile(file);
  };

  const processCSVFile = async (file: File) => {
    try {
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string || '');
        reader.onerror = reject;
        reader.readAsText(file);
      });

      console.log('RAW TEXT first 200 chars:', JSON.stringify(text.substring(0, 200)));
      console.log('RAW TEXT length:', text.length);

      const lines = text.length > 0 ? text.trim().split(/[\r\n]+/) : [];
      const headers = lines[0].split(',').map((h: string) => h.trim().replace(/^"|"$/g, ''));
      console.log('CSV parsed — lines:', lines.length, 'headers:', headers);

      let imported = 0;
      let skipped = 0;

      // Get or create broker connection
      let connectionId: string | null = null;
      console.log('Looking up broker connection for user:', currentUser.id);

      const { data: existingConn, error: connLookupErr } = await supabase
        .from('broker_connections')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('broker_name', 'Tradovate (CSV)')
        .maybeSingle();

      console.log('Existing connection lookup:', existingConn, 'error:', connLookupErr);

      if (existingConn) {
        connectionId = existingConn.id;
        console.log('Using existing connection:', connectionId);
      } else {
        const { data: newConn, error: connInsertErr } = await supabase
          .from('broker_connections')
          .insert({
            user_id: currentUser.id,
            broker_name: 'Tradovate (CSV)',
            account_number: 'CSV Import',
            account_type: 'mt4',
            ea_api_key: `csv_${currentUser.id}_${Date.now()}`,
            ea_api_key_hash: `csv_${currentUser.id}_${Date.now()}`,
            is_active: true,
            sync_status: 'success',
          })
          .select('id')
          .single();

        console.log('New connection insert:', newConn, 'error:', connInsertErr);
        connectionId = newConn?.id || null;
      }

      if (!connectionId) {
        console.error('FAILED to get connectionId — broker_connections insert likely blocked by RLS');
        toast.error('Connection setup failed — check Supabase RLS policies');
        return;
      }

      console.log('Processing', lines.length - 1, 'trade rows...');

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) { console.log(`Row ${i}: empty, skipping`); continue; }

        const fields: string[] = [];
        let current = '';
        let inQuotes = false;
        for (const char of line) {
          if (char === '"') { inQuotes = !inQuotes; }
          else if (char === ',' && !inQuotes) { fields.push(current); current = ''; }
          else { current += char; }
        }
        fields.push(current);

        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = (fields[idx] || '').trim().replace(/\r/g, ''); });

        console.log(`Row ${i} raw:`, row);

        const symbol = row['symbol'] || '';
        const buyPriceRaw = row['buyPrice'] || '';
        const sellPriceRaw = row['sellPrice'] || '';
        const buyPrice = parseFloat(buyPriceRaw) || 0;
        const sellPrice = parseFloat(sellPriceRaw) || 0;
        const pnl = parseTradovatePnL(row['pnl'] || '0');
        const boughtTs = row['boughtTimestamp'] || '';
        const soldTs = row['soldTimestamp'] || '';

        if (!symbol) { console.log(`Row ${i}: no symbol, skipping`); skipped++; continue; }
        if (!buyPrice) { console.log(`Row ${i}: no buyPrice (raw="${buyPriceRaw}"), skipping`); skipped++; continue; }
        if (!boughtTs) { console.log(`Row ${i}: no boughtTimestamp, skipping`); skipped++; continue; }

        const openTime = parseTradovateDate(boughtTs);
        const closeTime = soldTs ? parseTradovateDate(soldTs) : openTime;
        const durationMins = parseDurationMinutes(row['duration'] || '');
        const qty = parseInt(row['qty']) || 1;
        const buyFillId = row['buyFillId'] || '';
        const isWinner = pnl > 0;
        const pips = sellPrice - buyPrice;
        const ticket = Math.abs(parseInt(buyFillId.replace(/\D/g, '')) || 0) || (Date.now() + i);

        const tradeRecord = {
          user_id: currentUser.id,
          connection_id: connectionId,
          ticket,
          symbol,
          trade_type: 'buy',
          open_time: openTime,
          close_time: closeTime,
          open_price: buyPrice,
          close_price: sellPrice,
          lot_size: qty,
          gross_profit: pnl,
          commission: 0,
          swap: 0,
          net_profit: pnl,
          risk_reward: null,
          pips: Math.round(pips * 4) / 4,
          duration_minutes: durationMins,
          session: detectSession(openTime),
          result: isWinner ? 'win' : pnl === 0 ? 'breakeven' : 'loss',
          is_winner: isWinner,
          status: 'closed',
          raw_payload: row,
        };

        console.log(`Row ${i}: inserting trade`, symbol, pnl, ticket);

        const { error: upsertErr } = await supabase
          .from('verified_trades')
          .upsert(tradeRecord, { onConflict: 'connection_id,ticket' });

        if (upsertErr) {
          console.error(`Row ${i}: upsert error:`, upsertErr.message, upsertErr.details, upsertErr.hint);
          skipped++;
        } else {
          console.log(`Row ${i}: ✅ imported`);
          imported++;
        }
      }

      await loadData();
      setImportResult({ imported, skipped });
      toast.success(`Imported ${imported} trades!`);
    } catch (err: any) {
      console.error('CSV import error:', err?.message || err);
      toast.error('Import failed — check console for details');
    } finally {
      setImportingCSV(false);
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
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
        ea_api_key_hash: apiKey,
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
            {/* Timeframe selector — always show all 5 tabs */}
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {(['daily', 'weekly', 'monthly', 'yearly', 'overall'] as const).map(p => (
                <button key={p} onClick={() => setShareCardPeriod(p)}
                  className={`flex-1 py-1 rounded-md text-xs font-medium transition-colors ${shareCardPeriod === p ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                  {p === 'daily' ? 'Today' : p === 'weekly' ? 'Week' : p === 'monthly' ? 'Month' : p === 'yearly' ? 'Year' : 'All'}
                </button>
              ))}
            </div>

            {/* Computed stats for selected period */}
            {(() => {
              const now = new Date();
              const filtered = trades.filter(t => {
                const d = new Date(t.open_time);
                if (shareCardPeriod === 'daily') return d.toDateString() === now.toDateString();
                if (shareCardPeriod === 'weekly') {
                  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); startOfWeek.setHours(0,0,0,0);
                  return d >= startOfWeek;
                }
                if (shareCardPeriod === 'monthly') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                if (shareCardPeriod === 'yearly') return d.getFullYear() === now.getFullYear();
                return true;
              });
              const total = filtered.length;
              const wins = filtered.filter(t => t.result === 'win').length;
              const losses = filtered.filter(t => t.result === 'loss').length;
              const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
              const totalPnl = filtered.reduce((s, t) => s + (t.net_profit || 0), 0);
              const grossWins = filtered.filter(t => t.result === 'win').reduce((s, t) => s + (t.net_profit || 0), 0);
              const grossLosses = Math.abs(filtered.filter(t => t.result === 'loss').reduce((s, t) => s + (t.net_profit || 0), 0));
              const profitFactor = grossLosses > 0 ? (grossWins / grossLosses).toFixed(2) : wins > 0 ? '∞' : '—';
              const periodLabel = shareCardPeriod === 'daily' ? 'Today' : shareCardPeriod === 'weekly' ? 'This Week' : shareCardPeriod === 'monthly' ? 'This Month' : shareCardPeriod === 'yearly' ? 'This Year' : 'All Time';
              const cardId = 'share-card-canvas';

              const handleDownload = () => {
                const el = document.getElementById(cardId);
                if (!el) return;
                const a = document.createElement('a');
                a.download = `stoix-verified-${shareCardPeriod}-${new Date().toISOString().slice(0,10)}.png`;
                document.body.appendChild(a);
                domtoimage.toBlob(el, { scale: 2 }).then((blob: Blob) => {
                  const url = URL.createObjectURL(blob);
                  a.href = url;
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }).catch((err: any) => {
                  console.error('Download error:', err);
                  document.body.removeChild(a);
                  toast.error('Download failed — try again');
                });
              };

              const handleShare = () => {
                const el = document.getElementById(cardId);
                if (!el) return;
                domtoimage.toBlob(el, { scale: 2 }).then((blob: Blob) => {
                  const file = new File([blob], `stoix-verified-${shareCardPeriod}.png`, { type: 'image/png' });
                  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    navigator.share({
                      title: 'STOIX',
                      text: `${winRate}% Win Rate — ${periodLabel} 📈`,
                      files: [file],
                    }).catch(() => {});
                  } else {
                    const a = document.createElement('a');
                    a.download = `stoix-verified-${shareCardPeriod}.png`;
                    a.href = URL.createObjectURL(blob);
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }
                }).catch((err: any) => {
                  console.error('Share error:', err);
                  toast.error('Share failed — try downloading instead');
                });
              };

              return (
                <>
                  {/* Card — fully inline styled so dom-to-image captures correctly */}
                  <div id={cardId} style={{
                    width: '100%',
                    aspectRatio: '1/1',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                    borderRadius: '16px',
                    padding: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    boxSizing: 'border-box',
                    border: 'none',
                    boxShadow: 'none',
                  }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', border: 'none', background: 'transparent', padding: 0, margin: 0 }}>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', letterSpacing: '4px', marginBottom: '4px', border: 'none', background: 'transparent' }}>STOIX</div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff', marginBottom: '2px', border: 'none', background: 'transparent' }}>
                        {currentUser?.name || currentUser?.username || 'Trader'}
                        {currentUser?.isPremium && ' 👑'}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px', border: 'none', background: 'transparent' }}>{periodLabel}</div>
                      {isVerified && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '20px', padding: '2px 10px', fontSize: '10px', color: '#60a5fa' }}>
                          ✓ Verified
                        </div>
                      )}
                    </div>

                    {/* Main stat */}
                    {total > 0 ? (
                      <div style={{ textAlign: 'center', border: 'none', background: 'transparent', padding: 0 }}>
                        <div style={{ fontSize: '64px', fontWeight: '800', color: '#ffffff', lineHeight: 1, border: 'none', background: 'transparent' }}>{winRate}%</div>
                        <div style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: '600', marginTop: '4px', border: 'none', background: 'transparent' }}>Win Rate</div>
                        {/* Stats grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px', border: 'none', background: 'transparent' }}>
                          <div style={{ textAlign: 'center', border: 'none', background: 'transparent', padding: 0 }}>
                            <div style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', border: 'none', background: 'transparent' }}>{total}</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', border: 'none', background: 'transparent' }}>Trades</div>
                          </div>
                          <div style={{ textAlign: 'center', border: 'none', background: 'transparent', padding: 0 }}>
                            <div style={{ fontSize: '22px', fontWeight: '700', color: totalPnl >= 0 ? '#4ade80' : '#f87171', border: 'none', background: 'transparent' }}>{totalPnl >= 0 ? '+' : ''}${Math.abs(totalPnl).toFixed(0)}</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', border: 'none', background: 'transparent' }}>Net P&L</div>
                          </div>
                          <div style={{ textAlign: 'center', border: 'none', background: 'transparent', padding: 0 }}>
                            <div style={{ fontSize: '22px', fontWeight: '700', color: '#4ade80', border: 'none', background: 'transparent' }}>{wins}</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', border: 'none', background: 'transparent' }}>Wins</div>
                          </div>
                          <div style={{ textAlign: 'center', border: 'none', background: 'transparent', padding: 0 }}>
                            <div style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', border: 'none', background: 'transparent' }}>{profitFactor}</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', border: 'none', background: 'transparent' }}>Profit Factor</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', border: 'none', background: 'transparent' }}>No trades for this period</div>
                    )}

                    {/* Footer */}
                    <div style={{ textAlign: 'center', border: 'none', background: 'transparent', padding: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#cbd5e1', letterSpacing: '3px', border: 'none', background: 'transparent' }}>STOIX</div>
                      <div style={{ fontSize: '10px', color: '#64748b', border: 'none', background: 'transparent' }}>Trade With Discipline</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" className="w-full" onClick={handleShare} disabled={total === 0}>
                      <Share2 className="w-3.5 h-3.5 mr-1.5" />Share
                    </Button>
                    <Button size="sm" variant="outline" className="w-full" onClick={handleDownload} disabled={total === 0}>
                      <Download className="w-3.5 h-3.5 mr-1.5" />Download
                    </Button>
                  </div>
                  {total === 0 && <p className="text-xs text-center text-muted-foreground">No trades in this period to share</p>}
                </>
              );
            })()}
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

      {/* CSV Import */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Import from Tradovate</p>
              <p className="text-xs text-muted-foreground">Download CSV from Account Reports → Performance and upload here</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => csvInputRef.current?.click()} disabled={importingCSV}>
              <Plus className="w-4 h-4 mr-1" />{importingCSV ? 'Importing...' : 'Import CSV'}
            </Button>
            <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
          </div>
          {importResult && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm">
              ✅ Imported <strong>{importResult.imported}</strong> trades{importResult.skipped > 0 ? `, skipped ${importResult.skipped}` : ''}
            </div>
          )}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>In Tradovate: <strong>Account Reports → Performance → Download CSV</strong></p>
            <p>Supports: NQ, ES, CL, GC and all futures symbols</p>
          </div>
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
              <div className="grid grid-cols-2 gap-3">
                {stats.best_session && (
                  <Card><CardContent className="pt-4 pb-4 text-center">
                    <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                    <p className="font-semibold text-sm">{SESSION_LABELS[stats.best_session] || stats.best_session}</p>
                    <p className="text-xs text-muted-foreground">Best Session</p>
                  </CardContent></Card>
                )}
                {stats.best_symbol && (
                  <Card><CardContent className="pt-4 pb-4 text-center">
                    <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-500" />
                    <p className="font-semibold text-sm">{stats.best_symbol}</p>
                    <p className="text-xs text-muted-foreground">Best Symbol</p>
                  </CardContent></Card>
                )}
              </div>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-sm font-semibold mb-3">Streaks</p>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div><p className="text-lg font-bold">🔥 {stats.current_streak}</p><p className="text-xs text-muted-foreground">Current Streak</p></div>
                    <div><p className="text-lg font-bold">⚡ {stats.longest_streak}</p><p className="text-xs text-muted-foreground">Longest Streak</p></div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Max Drawdown</p>
                    <p className="text-sm font-bold text-red-500">-${stats.max_drawdown?.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
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
                <p className="text-center text-sm text-muted-foreground py-8">No verified trades yet.</p>
              )}
            </div>
          )}
        </>
      )}

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
