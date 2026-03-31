import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Progress } from './ui/progress';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { storage } from '../utils/storage';
import { PremiumBadge } from './PremiumBadge';

export function AccountRulesWidget() {
  const isPremium = storage.isPremium();
  const accountRules = storage.getAccountRules();
  const journalEntries = storage.getJournalEntries();
  const currentUser = storage.getCurrentUser();

  if (!isPremium || !accountRules) {
    return null; // Don't show if not premium or no rules set
  }

  // Calculate current usage from today's trades
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = journalEntries.filter(e => 
    e.userId === currentUser?.id && 
    e.date === today
  );

  // Calculate daily P&L
  let dailyPnL = 0;
  todayEntries.forEach(entry => {
    const pnl = entry.customFields?.pnl || entry.customFields?.['P&L'];
    if (pnl) {
      dailyPnL += parseFloat(pnl.toString());
    }
  });

  // Calculate daily loss (only negative)
  const dailyLoss = dailyPnL < 0 ? Math.abs(dailyPnL) : 0;

  // Calculate overall drawdown (simplified - just worst day in last 30 days)
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const recentEntries = journalEntries.filter(e => 
    e.userId === currentUser?.id && 
    e.date >= last30Days
  );
  
  // Group by date and calculate daily P&L
  const dailyPnLs: Record<string, number> = {};
  recentEntries.forEach(entry => {
    const pnl = entry.customFields?.pnl || entry.customFields?.['P&L'];
    if (pnl && entry.date) {
      dailyPnLs[entry.date] = (dailyPnLs[entry.date] || 0) + parseFloat(pnl.toString());
    }
  });

  // Find worst drawdown
  const worstDailyLoss = Math.min(...Object.values(dailyPnLs), 0);
  const overallDrawdown = Math.abs(worstDailyLoss);

  // Count today's contracts
  const todayContracts = todayEntries.length;

  // Calculate percentages and states
  const dailyLossPercent = accountRules.maxDailyLoss 
    ? Math.min((dailyLoss / accountRules.maxDailyLoss) * 100, 100) 
    : 0;
  
  const drawdownPercent = accountRules.maxOverallDrawdown 
    ? Math.min((overallDrawdown / accountRules.maxOverallDrawdown) * 100, 100) 
    : 0;
  
  const contractsPercent = accountRules.maxContracts 
    ? Math.min((todayContracts / accountRules.maxContracts) * 100, 100) 
    : 0;

  // Determine color states
  const getColorClass = (percent: number) => {
    if (percent >= 90) return 'text-red-500';
    if (percent >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getProgressClass = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStateIcon = (percent: number) => {
    if (percent >= 90) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (percent >= 70) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const hasAnyRules = accountRules.maxDailyLoss || accountRules.maxOverallDrawdown || accountRules.maxContracts;

  if (!hasAnyRules) {
    return null; // Don't show if no rules configured
  }

  return (
    <Card className="border-blue-500/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          Account Rules Monitor
          <PremiumBadge size="sm" className="ml-auto" />
        </CardTitle>
        <CardDescription>
          Track your limits and stay compliant
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Daily Loss */}
        {accountRules.maxDailyLoss && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStateIcon(dailyLossPercent)}
                <span className="text-sm font-medium">Daily Loss</span>
              </div>
              <span className={`text-sm font-bold ${getColorClass(dailyLossPercent)}`}>
                ${dailyLoss.toFixed(2)} / ${accountRules.maxDailyLoss.toFixed(2)}
              </span>
            </div>
            <Progress 
              value={dailyLossPercent} 
              className="h-2"
              indicatorClassName={getProgressClass(dailyLossPercent)}
            />
            <div className="flex justify-between mt-1">
              <span className={`text-xs font-medium ${getColorClass(dailyLossPercent)}`}>
                Remaining: ${(accountRules.maxDailyLoss - dailyLoss).toFixed(2)}
              </span>
              {dailyLossPercent >= 70 && dailyLossPercent < 90 && (
                <span className="text-xs text-yellow-500 font-medium">
                  ⚠️ Approaching limit
                </span>
              )}
              {dailyLossPercent >= 90 && (
                <span className="text-xs text-red-500 font-medium">
                  🚨 Risk of violation
                </span>
              )}
            </div>
          </div>
        )}

        {/* Overall Drawdown */}
        {accountRules.maxOverallDrawdown && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStateIcon(drawdownPercent)}
                <span className="text-sm font-medium">Max Drawdown</span>
              </div>
              <span className={`text-sm font-bold ${getColorClass(drawdownPercent)}`}>
                ${overallDrawdown.toFixed(2)} / ${accountRules.maxOverallDrawdown.toFixed(2)}
              </span>
            </div>
            <Progress 
              value={drawdownPercent} 
              className="h-2"
              indicatorClassName={getProgressClass(drawdownPercent)}
            />
            <div className="flex justify-between mt-1">
              <span className={`text-xs font-medium ${getColorClass(drawdownPercent)}`}>
                Remaining: ${(accountRules.maxOverallDrawdown - overallDrawdown).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Contracts */}
        {accountRules.maxContracts && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStateIcon(contractsPercent)}
                <span className="text-sm font-medium">Contracts Today</span>
              </div>
              <span className={`text-sm font-bold ${getColorClass(contractsPercent)}`}>
                {todayContracts} / {accountRules.maxContracts}
              </span>
            </div>
            <Progress 
              value={contractsPercent} 
              className="h-2"
              indicatorClassName={getProgressClass(contractsPercent)}
            />
            <div className="flex justify-between mt-1">
              <span className={`text-xs font-medium ${getColorClass(contractsPercent)}`}>
                Remaining: {accountRules.maxContracts - todayContracts}
              </span>
            </div>
          </div>
        )}

        {/* Consistency Rules */}
        {accountRules.consistencyRules && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-1">Consistency Rules:</p>
            <p className="text-sm">{accountRules.consistencyRules}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
