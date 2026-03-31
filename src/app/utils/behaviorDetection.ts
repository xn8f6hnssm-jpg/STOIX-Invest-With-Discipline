import { storage, JournalEntry } from './storage';
import { BehaviorRiskType } from '../components/BehaviorRiskAlert';

export interface BehaviorRiskDetection {
  detected: boolean;
  riskType?: BehaviorRiskType;
  message?: string;
}

/**
 * Detects revenge trading pattern:
 * - Multiple trades after a recent loss
 * - 3+ trades in quick succession after a loss
 */
export function detectRevengeTradingPattern(entries: JournalEntry[]): BehaviorRiskDetection {
  if (entries.length < 3) {
    return { detected: false };
  }

  const recentEntries = entries
    .filter(e => !e.isNoTradeDay)
    .slice(0, 5); // Last 5 trades

  // Check if there was a recent loss
  const hasRecentLoss = recentEntries.slice(1).some(e => e.result === 'loss');
  
  // Check if user made multiple trades right after
  const recentTradesCount = recentEntries.slice(0, 3).length;
  const lastTradeWasLoss = recentEntries[recentEntries.length - 1]?.result === 'loss';

  if (hasRecentLoss && recentTradesCount === 3 && lastTradeWasLoss) {
    return {
      detected: true,
      riskType: 'revenge_trading',
      message: 'Multiple trades detected after a loss',
    };
  }

  return { detected: false };
}

/**
 * Detects trading outside defined hours
 * (Simplified - checks if trades are during market hours)
 */
export function detectOutsideHoursTrading(entry: JournalEntry): BehaviorRiskDetection {
  // Get current hour
  const now = new Date();
  const hour = now.getHours();

  // Market hours: 9:30 AM - 4:00 PM ET (simplified as 9-16)
  const isOutsideMarketHours = hour < 9 || hour > 16;

  if (isOutsideMarketHours) {
    return {
      detected: true,
      riskType: 'outside_hours',
      message: 'Trade logged outside normal market hours',
    };
  }

  return { detected: false };
}

/**
 * Detects repeated rule violations
 * Checks daily check-in logs for forfeit days
 */
export function detectRepeatedViolations(): BehaviorRiskDetection {
  const logs = storage.getDailyLogs();
  const user = storage.getCurrentUser();
  
  if (!user) return { detected: false };

  // Get last 7 days of logs
  const recentLogs = logs
    .filter(l => l.userId === user.id)
    .slice(0, 7);

  // Count forfeit days in last 7 days
  const forfeitCount = recentLogs.filter(l => l.type === 'forfeit').length;

  if (forfeitCount >= 3) {
    return {
      detected: true,
      riskType: 'repeated_violations',
      message: `${forfeitCount} rule violations in the last 7 days`,
    };
  }

  return { detected: false };
}

/**
 * Detects emotional selling for investors
 * Checks if selling before planned hold time
 */
export function detectEmotionalSelling(entry: JournalEntry): BehaviorRiskDetection {
  const user = storage.getCurrentUser();
  
  if (user?.tradingStyle !== 'Long Term Hold') {
    return { detected: false };
  }

  // If user is selling and hasn't filled out sell reason properly
  if (entry.action === 'sell' && !entry.sellReason) {
    return {
      detected: true,
      riskType: 'emotional_selling',
      message: 'Selling without documenting reason',
    };
  }

  // Check if selling earlier than planned
  if (entry.action === 'sell' && entry.sellReason === 'emotional_reaction') {
    return {
      detected: true,
      riskType: 'emotional_selling',
      message: 'Emotional selling detected',
    };
  }

  return { detected: false };
}

/**
 * Main function to check for any behavioral risks
 * Returns the first detected risk
 */
export function checkBehavioralRisks(latestEntry?: JournalEntry): BehaviorRiskDetection {
  // Check repeated violations (account-level)
  const violationsRisk = detectRepeatedViolations();
  if (violationsRisk.detected) return violationsRisk;

  // If we have a latest entry, check entry-specific risks
  if (latestEntry) {
    // Check emotional selling for investors
    const emotionalSellingRisk = detectEmotionalSelling(latestEntry);
    if (emotionalSellingRisk.detected) return emotionalSellingRisk;

    // Check outside hours trading
    const outsideHoursRisk = detectOutsideHoursTrading(latestEntry);
    if (outsideHoursRisk.detected) return outsideHoursRisk;
  }

  // Check revenge trading pattern
  const entries = storage.getJournalEntries();
  const user = storage.getCurrentUser();
  const userEntries = entries.filter(e => e.userId === user?.id);
  const revengeTradingRisk = detectRevengeTradingPattern(userEntries);
  if (revengeTradingRisk.detected) return revengeTradingRisk;

  return { detected: false };
}
