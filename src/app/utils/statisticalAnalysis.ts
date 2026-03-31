// Statistical Analysis Engine - No AI required, instant results
// Analyzes trading patterns using pure mathematics

export interface TradeEntry {
  id: string;
  date: string;
  result: 'win' | 'loss' | 'breakeven';
  riskReward?: number;
  description?: string;
  tags?: string[];
  timestamp?: number;
}

export interface AnalysisResult {
  winRate: number;
  totalTrades: number;
  bestDay: string;
  bestTime: string;
  mostProfitableSetup: string;
  emotionalPattern: string;
  recommendations: string[];
  predictedProbability: number;
  riskScore: number;
  strengthAreas: string[];
  improvementAreas: string[];
  consecutiveLossStreak: number;
  averageRiskReward: number;
  isEnhancedByAI?: boolean;
}

export class StatisticalAnalyzer {
  private entries: TradeEntry[];

  constructor(entries: TradeEntry[]) {
    this.entries = entries.filter(e => e.result !== 'breakeven');
  }

  // Main analysis method
  analyze(): AnalysisResult {
    const wins = this.entries.filter(e => e.result === 'win').length;
    const losses = this.entries.filter(e => e.result === 'loss').length;
    const total = wins + losses;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

    return {
      winRate,
      totalTrades: total,
      bestDay: this.findBestDay(),
      bestTime: this.findBestTime(),
      mostProfitableSetup: this.findMostProfitableSetup(),
      emotionalPattern: this.detectEmotionalPattern(),
      recommendations: this.generateRecommendations(),
      predictedProbability: this.calculatePredictedProbability(),
      riskScore: this.calculateRiskScore(),
      strengthAreas: this.identifyStrengths(),
      improvementAreas: this.identifyImprovements(),
      consecutiveLossStreak: this.calculateLongestLossStreak(),
      averageRiskReward: this.calculateAverageRR(),
      isEnhancedByAI: false,
    };
  }

  private findBestDay(): string {
    const dayPerformance: Record<string, { wins: number; total: number }> = {};
    
    this.entries.forEach(entry => {
      const day = new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long' });
      if (!dayPerformance[day]) {
        dayPerformance[day] = { wins: 0, total: 0 };
      }
      dayPerformance[day].total++;
      if (entry.result === 'win') {
        dayPerformance[day].wins++;
      }
    });

    let bestDay = 'Tuesday'; // Default
    let bestWinRate = 0;

    Object.entries(dayPerformance).forEach(([day, stats]) => {
      const winRate = stats.total > 0 ? stats.wins / stats.total : 0;
      if (winRate > bestWinRate && stats.total >= 2) { // Need at least 2 trades
        bestWinRate = winRate;
        bestDay = day;
      }
    });

    return bestDay;
  }

  private findBestTime(): string {
    // Analyze time patterns if timestamps available
    const timeSlots = [
      { name: '9:30 AM - 11:00 AM', start: 9.5, end: 11 },
      { name: '11:00 AM - 1:00 PM', start: 11, end: 13 },
      { name: '1:00 PM - 3:00 PM', start: 13, end: 15 },
      { name: '3:00 PM - 4:00 PM', start: 15, end: 16 },
    ];

    const performance: Record<string, { wins: number; total: number }> = {};

    this.entries.forEach(entry => {
      if (entry.timestamp) {
        const hour = new Date(entry.timestamp).getHours() + new Date(entry.timestamp).getMinutes() / 60;
        const slot = timeSlots.find(s => hour >= s.start && hour < s.end);
        if (slot) {
          if (!performance[slot.name]) {
            performance[slot.name] = { wins: 0, total: 0 };
          }
          performance[slot.name].total++;
          if (entry.result === 'win') {
            performance[slot.name].wins++;
          }
        }
      }
    });

    let bestTime = '9:30 AM - 11:00 AM'; // Default
    let bestWinRate = 0;

    Object.entries(performance).forEach(([time, stats]) => {
      const winRate = stats.total > 0 ? stats.wins / stats.total : 0;
      if (winRate > bestWinRate && stats.total >= 2) {
        bestWinRate = winRate;
        bestTime = time;
      }
    });

    return bestTime;
  }

  private findMostProfitableSetup(): string {
    const setupPerformance: Record<string, { wins: number; total: number }> = {};

    this.entries.forEach(entry => {
      if (entry.tags && entry.tags.length > 0) {
        entry.tags.forEach(tag => {
          if (!setupPerformance[tag]) {
            setupPerformance[tag] = { wins: 0, total: 0 };
          }
          setupPerformance[tag].total++;
          if (entry.result === 'win') {
            setupPerformance[tag].wins++;
          }
        });
      }
    });

    let bestSetup = 'Breakout with Volume'; // Default
    let bestWinRate = 0;

    Object.entries(setupPerformance).forEach(([setup, stats]) => {
      const winRate = stats.total > 0 ? stats.wins / stats.total : 0;
      if (winRate > bestWinRate && stats.total >= 2) {
        bestWinRate = winRate;
        bestSetup = setup;
      }
    });

    return bestSetup;
  }

  private detectEmotionalPattern(): string {
    const recentLosses = this.entries.slice(0, 10).filter(e => e.result === 'loss').length;
    const lossStreak = this.calculateLongestLossStreak();

    if (lossStreak >= 3) {
      return 'High risk of revenge trading detected after consecutive losses';
    }

    if (recentLosses >= 6) {
      return 'Emotional fatigue detected - consider taking a break';
    }

    // Check win rate after losses (revenge trading indicator)
    const tradesAfterLoss = this.getTradesAfterLosses();
    if (tradesAfterLoss.total > 0) {
      const winRateAfterLoss = (tradesAfterLoss.wins / tradesAfterLoss.total) * 100;
      const overallWinRate = (this.entries.filter(e => e.result === 'win').length / this.entries.length) * 100;
      
      if (winRateAfterLoss < overallWinRate - 15) {
        return 'Lower win rate after losses - possible revenge trading pattern';
      }
    }

    return 'Emotional discipline maintained - good psychological control';
  }

  private getTradesAfterLosses(): { wins: number; total: number } {
    let wins = 0;
    let total = 0;

    for (let i = 1; i < this.entries.length; i++) {
      if (this.entries[i - 1].result === 'loss') {
        total++;
        if (this.entries[i].result === 'win') {
          wins++;
        }
      }
    }

    return { wins, total };
  }

  private calculateLongestLossStreak(): number {
    let maxStreak = 0;
    let currentStreak = 0;

    this.entries.forEach(entry => {
      if (entry.result === 'loss') {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    return maxStreak;
  }

  private calculateAverageRR(): number {
    const rrTrades = this.entries.filter(e => e.riskReward && e.riskReward > 0);
    if (rrTrades.length === 0) return 0;
    
    const sum = rrTrades.reduce((acc, e) => acc + (e.riskReward || 0), 0);
    return Math.round((sum / rrTrades.length) * 10) / 10;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const winRate = (this.entries.filter(e => e.result === 'win').length / this.entries.length) * 100;
    const lossStreak = this.calculateLongestLossStreak();
    const avgRR = this.calculateAverageRR();
    const bestDay = this.findBestDay();

    // Recommendation 1: Break after losses
    if (lossStreak >= 2) {
      recommendations.push('Take a 15-minute break after any loss to reset emotionally and avoid revenge trading');
    } else {
      recommendations.push('Maintain your current discipline - continue taking breaks between trades');
    }

    // Recommendation 2: Best day trading
    recommendations.push(`Your highest win rate is on ${bestDay} - consider focusing your trading activity on this day`);

    // Recommendation 3: Position sizing
    if (winRate >= 60) {
      recommendations.push('Strong win rate detected - consider gradually increasing position size while maintaining risk management');
    } else if (winRate < 50) {
      recommendations.push('Focus on quality over quantity - reduce position size until win rate improves above 55%');
    } else {
      recommendations.push('Maintain current position sizing until win rate stabilizes above 60%');
    }

    // Recommendation 4: Risk/Reward
    if (avgRR > 0 && avgRR < 2) {
      recommendations.push(`Current R:R of ${avgRR} is acceptable, but aim for minimum 2:1 to improve profitability`);
    } else if (avgRR >= 2) {
      recommendations.push(`Excellent R:R ratio of ${avgRR} - maintain these high-quality setups`);
    } else {
      recommendations.push('Start tracking Risk:Reward ratios for every trade - target minimum 2:1');
    }

    // Recommendation 5: Trade frequency
    const tradesPerDay = this.entries.length / 30; // Assuming 30 day period
    if (tradesPerDay > 5) {
      recommendations.push('High trade frequency detected - focus on quality setups and avoid overtrading');
    }

    return recommendations.slice(0, 5); // Return top 5
  }

  private calculatePredictedProbability(): number {
    const recentTrades = this.entries.slice(0, 10);
    const recentWins = recentTrades.filter(e => e.result === 'win').length;
    const recentWinRate = recentTrades.length > 0 ? (recentWins / recentTrades.length) * 100 : 50;

    const overallWins = this.entries.filter(e => e.result === 'win').length;
    const overallWinRate = this.entries.length > 0 ? (overallWins / this.entries.length) * 100 : 50;

    // Weight recent performance more heavily
    const predicted = (recentWinRate * 0.6) + (overallWinRate * 0.4);

    // Check for consecutive losses (reduces probability)
    const lastThree = this.entries.slice(0, 3);
    const consecutiveLosses = lastThree.filter(e => e.result === 'loss').length;
    
    let adjustment = 0;
    if (consecutiveLosses === 3) {
      adjustment = -15; // Likely to revenge trade
    } else if (consecutiveLosses === 2) {
      adjustment = -8;
    }

    return Math.max(20, Math.min(90, Math.round(predicted + adjustment)));
  }

  private calculateRiskScore(): number {
    const lossStreak = this.calculateLongestLossStreak();
    const recentLosses = this.entries.slice(0, 5).filter(e => e.result === 'loss').length;
    const tradesAfterLoss = this.getTradesAfterLosses();
    
    let riskScore = 0;

    // Loss streak increases risk
    riskScore += lossStreak * 8;

    // Recent losses increase risk
    riskScore += recentLosses * 5;

    // Poor performance after losses
    if (tradesAfterLoss.total > 0) {
      const winRateAfterLoss = (tradesAfterLoss.wins / tradesAfterLoss.total) * 100;
      if (winRateAfterLoss < 40) {
        riskScore += 15;
      }
    }

    // High frequency trading
    const avgTradesPerDay = this.entries.length / 30;
    if (avgTradesPerDay > 5) {
      riskScore += 10;
    }

    return Math.min(85, riskScore);
  }

  private identifyStrengths(): string[] {
    const strengths: string[] = [];
    const winRate = (this.entries.filter(e => e.result === 'win').length / this.entries.length) * 100;
    const avgRR = this.calculateAverageRR();
    const consistency = this.calculateConsistency();

    if (winRate >= 60) {
      strengths.push('High win rate demonstrates strong market analysis skills');
    }

    if (avgRR >= 2) {
      strengths.push('Excellent risk management with strong R:R ratios');
    }

    if (consistency >= 70) {
      strengths.push('Consistent performance shows good discipline and system adherence');
    }

    if (this.entries.length >= 20) {
      strengths.push('Strong commitment to journaling and self-improvement');
    }

    return strengths.slice(0, 3);
  }

  private identifyImprovements(): string[] {
    const improvements: string[] = [];
    const winRate = (this.entries.filter(e => e.result === 'win').length / this.entries.length) * 100;
    const avgRR = this.calculateAverageRR();
    const lossStreak = this.calculateLongestLossStreak();

    if (winRate < 50) {
      improvements.push('Win rate below 50% - review entry criteria and wait for higher probability setups');
    }

    if (avgRR < 2 && avgRR > 0) {
      improvements.push('Risk:Reward ratio needs improvement - target minimum 2:1 on all trades');
    }

    if (lossStreak >= 3) {
      improvements.push('Implement mandatory breaks after 2 consecutive losses to prevent revenge trading');
    }

    const tradesAfterLoss = this.getTradesAfterLosses();
    if (tradesAfterLoss.total > 0 && (tradesAfterLoss.wins / tradesAfterLoss.total) < 0.4) {
      improvements.push('Performance drops significantly after losses - work on emotional control');
    }

    if (avgRR === 0) {
      improvements.push('Start defining Risk:Reward ratios before entering trades');
    }

    return improvements.slice(0, 3);
  }

  private calculateConsistency(): number {
    // Measure consistency by looking at win rate variance over time
    const chunkSize = 5;
    const chunks: number[] = [];

    for (let i = 0; i < this.entries.length; i += chunkSize) {
      const chunk = this.entries.slice(i, i + chunkSize);
      const wins = chunk.filter(e => e.result === 'win').length;
      const winRate = chunk.length > 0 ? (wins / chunk.length) * 100 : 0;
      chunks.push(winRate);
    }

    if (chunks.length < 2) return 50;

    // Calculate standard deviation
    const avg = chunks.reduce((a, b) => a + b, 0) / chunks.length;
    const variance = chunks.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / chunks.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation = higher consistency
    const consistency = Math.max(0, 100 - stdDev);
    return Math.round(consistency);
  }
}
