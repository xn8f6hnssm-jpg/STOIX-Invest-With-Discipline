// CLIENT-SIDE TRADING ANALYSIS - Win Rate Optimization
// Helps traders identify what combinations of factors lead to wins

export function analyzeTradesLocally(entries: any[]) {
  console.log(`📊 Analyzing ${entries.length} trades for win rate patterns`);
  
  if (entries.length === 0) {
    return getEmptyAnalysis();
  }

  // Basic stats
  const wins = entries.filter(e => e.outcome === 'win' || e.result === 'win');
  const losses = entries.filter(e => e.outcome === 'loss' || e.result === 'loss');
  const breakevens = entries.filter(e => e.outcome === 'breakeven' || e.result === 'breakeven');
  const winRate = entries.length > 0 ? (wins.length / entries.length) * 100 : 0;
  
  // Money calculations
  const totalPnL = entries.reduce((sum, e) => sum + (parseFloat(e.profitLoss) || 0), 0);
  const avgWinAmount = wins.length > 0 
    ? wins.reduce((sum, e) => sum + (parseFloat(e.profitLoss) || 0), 0) / wins.length 
    : 0;
  const avgLossAmount = losses.length > 0 
    ? Math.abs(losses.reduce((sum, e) => sum + (parseFloat(e.profitLoss) || 0), 0) / losses.length)
    : 0;
  const profitFactor = avgLossAmount > 0 
    ? (wins.length * avgWinAmount) / (losses.length * avgLossAmount)
    : wins.length > 0 ? 999 : 0;
  
  const expectancy = entries.length > 0 ? totalPnL / entries.length : 0;

  // ====================
  // FIELD IMPACT ANALYSIS - Which fields increase win rate?
  // ====================
  const fieldInsights = analyzeFieldImpactOnWinRate(entries, wins, losses);
  
  // ====================
  // CONFLUENCE COMBINATIONS - Which combos win most?
  // ====================
  const confluenceAnalysis = analyzeWinningConfluences(entries, wins, losses);
  
  // ====================
  // CRITICAL FACTORS - What's present in wins but not losses?
  // ====================
  const criticalFactors = findCriticalWinningFactors(entries, wins, losses);
  
  // ====================
  // TIME PATTERNS
  // ====================
  const timeInsights = analyzeTimePatterns(entries, wins, losses);
  const bestDay = findBestDay(entries);
  const bestTimePattern = findBestTimeOfDay(entries);
  
  // ====================
  // EMOTIONAL PATTERNS
  // ====================
  const emotionalInsights = analyzeEmotionalPatterns(entries, wins, losses);
  
  // ====================
  // STRATEGY PERFORMANCE
  // ====================
  const strategyPerformance = analyzeStrategies(entries);
  
  // ====================
  // DISCIPLINE & RISK SCORES
  // ====================
  const disciplineScore = calculateDisciplineScore(entries, fieldInsights);
  const riskScore = calculateRiskScore(entries, emotionalInsights);
  
  // ====================
  // LOSS STREAK
  // ====================
  const maxLossStreak = calculateMaxLossStreak(entries);
  
  // ====================
  // RECENT FORM
  // ====================
  const recentTrades = entries.slice(-10);
  const recentWins = recentTrades.filter(e => (e.outcome || e.result) === 'win').length;
  const predictedProbability = recentTrades.length > 0 
    ? Math.round((recentWins / recentTrades.length) * 100)
    : Math.round(winRate);

  // ====================
  // AI RECOMMENDATIONS
  // ====================
  const recommendations = generateSmartRecommendations(
    winRate,
    expectancy,
    fieldInsights,
    confluenceAnalysis,
    criticalFactors,
    timeInsights,
    emotionalInsights,
    entries.length
  );

  // ====================
  // KEY PATTERNS
  // ====================
  const patterns = generateKeyPatterns(
    winRate,
    profitFactor,
    expectancy,
    entries.length,
    fieldInsights,
    criticalFactors
  );

  console.log(`✅ Analysis complete: ${winRate.toFixed(1)}% WR, ${disciplineScore}/100 discipline`);

  return {
    winRate: Math.round(winRate),
    totalTrades: entries.length,
    wins: wins.length,
    losses: losses.length,
    breakevens: breakevens.length,
    avgWinAmount,
    avgLossAmount,
    profitFactor: Math.round(profitFactor * 100) / 100,
    totalPnL,
    expectancy,
    predictedProbability,
    bestDay: bestDay || 'N/A',
    maxLossStreak,
    riskScore,
    disciplineScore,
    emotionalPattern: emotionalInsights.summary,
    recommendations,
    patterns,
    emotionalPatterns: emotionalInsights.patterns,
    timePatterns: timeInsights.patterns,
    strategyPerformance,
    customFieldInsights: fieldInsights.hasInsights ? {
      hasCustomFields: true,
      fieldInsights: fieldInsights.details,
    } : null,
    confluenceInsights: confluenceAnalysis,
    criticalFactors, // NEW: What makes you win
    highProbabilitySetups: confluenceAnalysis.topCombinations || [],
    bestTimePattern,
    isEnhancedByAI: false
  };
}

// ====================
// FIELD IMPACT ON WIN RATE
// ====================
function analyzeFieldImpactOnWinRate(entries: any[], wins: any[], losses: any[]) {
  const fieldStats: Record<string, { 
    presentInWins: number;
    presentInLosses: number;
    absentInWins: number;
    absentInLosses: number;
    fieldName: string;
  }> = {};

  // Analyze each field
  entries.forEach(entry => {
    const isWin = wins.includes(entry);
    const isLoss = losses.includes(entry);
    
    if (entry.customFields && typeof entry.customFields === 'object') {
      Object.entries(entry.customFields).forEach(([fieldName, fieldValue]) => {
        // Handle checkbox fields
        if (typeof fieldValue === 'boolean') {
          if (!fieldStats[fieldName]) {
            fieldStats[fieldName] = {
              fieldName,
              presentInWins: 0,
              presentInLosses: 0,
              absentInWins: 0,
              absentInLosses: 0
            };
          }
          
          const isPresent = fieldValue === true;
          
          if (isWin) {
            if (isPresent) fieldStats[fieldName].presentInWins++;
            else fieldStats[fieldName].absentInWins++;
          }
          if (isLoss) {
            if (isPresent) fieldStats[fieldName].presentInLosses++;
            else fieldStats[fieldName].absentInLosses++;
          }
        }
      });
    }
  });

  // Calculate impact
  const details = Object.values(fieldStats)
    .map(stats => {
      const totalPresent = stats.presentInWins + stats.presentInLosses;
      const totalAbsent = stats.absentInWins + stats.absentInLosses;
      
      if (totalPresent < 2) return null; // Need at least 2 occurrences
      
      const winRateWhenPresent = totalPresent > 0 
        ? (stats.presentInWins / totalPresent) * 100 
        : 0;
      const winRateWhenAbsent = totalAbsent > 0 
        ? (stats.absentInWins / totalAbsent) * 100 
        : 0;
      
      const impact = winRateWhenPresent - winRateWhenAbsent;
      
      return {
        fieldName: stats.fieldName,
        winRateWhenPresent: Math.round(winRateWhenPresent),
        winRateWhenAbsent: Math.round(winRateWhenAbsent),
        tradesWithField: totalPresent,
        tradesWithoutField: totalAbsent,
        impact: Math.round(impact),
        winsWithField: stats.presentInWins,
        lossesWithField: stats.presentInLosses,
        winsWithoutField: stats.absentInWins,
        lossesWithoutField: stats.absentInLosses,
        message: impact > 15 
          ? `🔥 CRITICAL: ${Math.round(winRateWhenPresent)}% win rate WITH vs ${Math.round(winRateWhenAbsent)}% WITHOUT (+${Math.round(impact)}%)`
          : impact > 5
          ? `✅ Important: ${Math.round(winRateWhenPresent)}% win rate WITH vs ${Math.round(winRateWhenAbsent)}% WITHOUT (+${Math.round(impact)}%)`
          : impact < -15
          ? `⚠️ AVOID: ${Math.round(winRateWhenPresent)}% win rate WITH vs ${Math.round(winRateWhenAbsent)}% WITHOUT (${Math.round(impact)}%)`
          : `Neutral: ${Math.round(winRateWhenPresent)}% win rate WITH vs ${Math.round(winRateWhenAbsent)}% WITHOUT`
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.impact || 0) - (a?.impact || 0));

  return {
    hasInsights: details.length > 0,
    details
  };
}

// ====================
// WINNING CONFLUENCE COMBINATIONS
// ====================
function analyzeWinningConfluences(entries: any[], wins: any[], losses: any[]) {
  const combinations: Record<string, { 
    wins: number; 
    losses: number; 
    fields: string[];
  }> = {};

  entries.forEach(entry => {
    if (entry.customFields && typeof entry.customFields === 'object') {
      const checkedFields = Object.entries(entry.customFields)
        .filter(([_, value]) => value === true)
        .map(([name, _]) => name)
        .sort();
      
      if (checkedFields.length >= 2) {
        const comboKey = checkedFields.join(' + ');
        
        if (!combinations[comboKey]) {
          combinations[comboKey] = { wins: 0, losses: 0, fields: checkedFields };
        }
        
        const isWin = wins.includes(entry);
        const isLoss = losses.includes(entry);
        
        if (isWin) combinations[comboKey].wins++;
        if (isLoss) combinations[comboKey].losses++;
      }
    }
  });

  // Find high win rate combinations
  const topCombinations = Object.entries(combinations)
    .map(([combo, stats]) => {
      const total = stats.wins + stats.losses;
      if (total < 2) return null; // Need at least 2 trades
      
      const winRate = Math.round((stats.wins / total) * 100);
      
      return {
        combination: stats.fields,
        comboName: combo,
        winRate,
        trades: total,
        wins: stats.wins,
        losses: stats.losses,
        description: `${combo}: ${winRate}% win rate (${stats.wins}W/${stats.losses}L from ${total} trades)`,
        isHighProbability: winRate >= 70 && total >= 3
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.winRate || 0) - (a?.winRate || 0));

  // Analyze by number of confluences
  const byConfluenceCount: Record<number, { wins: number; losses: number }> = {};
  
  entries.forEach(entry => {
    if (entry.customFields && typeof entry.customFields === 'object') {
      const checkedCount = Object.values(entry.customFields)
        .filter(v => v === true).length;
      
      if (checkedCount > 0) {
        if (!byConfluenceCount[checkedCount]) {
          byConfluenceCount[checkedCount] = { wins: 0, losses: 0 };
        }
        
        const isWin = wins.includes(entry);
        const isLoss = losses.includes(entry);
        
        if (isWin) byConfluenceCount[checkedCount].wins++;
        if (isLoss) byConfluenceCount[checkedCount].losses++;
      }
    }
  });

  const confluenceLevels = Object.entries(byConfluenceCount)
    .map(([count, stats]) => {
      const total = stats.wins + stats.losses;
      if (total < 2) return null;
      
      const winRate = Math.round((stats.wins / total) * 100);
      
      return {
        confluenceCount: parseInt(count),
        winRate,
        trades: total,
        wins: stats.wins,
        losses: stats.losses,
        description: `${count} confirmations: ${winRate}% win rate (${stats.wins}W/${stats.losses}L)`
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.confluenceCount || 0) - (a?.confluenceCount || 0));

  return {
    topCombinations: topCombinations.slice(0, 10),
    confluenceLevels,
    optimalConfluenceCount: confluenceLevels.length > 0 
      ? confluenceLevels.reduce((best, curr) => 
          (curr?.winRate || 0) > (best?.winRate || 0) ? curr : best
        )
      : null
  };
}

// ====================
// CRITICAL WINNING FACTORS - What's in your wins but NOT in your losses?
// ====================
function findCriticalWinningFactors(entries: any[], wins: any[], losses: any[]) {
  const winningFactors: Record<string, number> = {};
  const losingFactors: Record<string, number> = {};

  // Count field presence in wins
  wins.forEach(entry => {
    if (entry.customFields && typeof entry.customFields === 'object') {
      Object.entries(entry.customFields).forEach(([fieldName, fieldValue]) => {
        if (fieldValue === true) {
          winningFactors[fieldName] = (winningFactors[fieldName] || 0) + 1;
        }
      });
    }
  });

  // Count field presence in losses
  losses.forEach(entry => {
    if (entry.customFields && typeof entry.customFields === 'object') {
      Object.entries(entry.customFields).forEach(([fieldName, fieldValue]) => {
        if (fieldValue === true) {
          losingFactors[fieldName] = (losingFactors[fieldName] || 0) + 1;
        }
      });
    }
  });

  // Find factors that appear much more in wins
  const critical = Object.keys(winningFactors)
    .map(fieldName => {
      const inWins = winningFactors[fieldName] || 0;
      const inLosses = losingFactors[fieldName] || 0;
      const winPresence = wins.length > 0 ? (inWins / wins.length) * 100 : 0;
      const lossPresence = losses.length > 0 ? (inLosses / losses.length) * 100 : 0;
      const difference = winPresence - lossPresence;

      if (inWins < 2) return null; // Need at least 2 wins with this factor

      return {
        fieldName,
        inWins,
        inLosses,
        winPresence: Math.round(winPresence),
        lossPresence: Math.round(lossPresence),
        difference: Math.round(difference),
        isCritical: difference >= 30, // Present in 30%+ more wins than losses
        message: difference >= 30
          ? `🎯 CRITICAL: Present in ${Math.round(winPresence)}% of wins but only ${Math.round(lossPresence)}% of losses`
          : `Present in ${Math.round(winPresence)}% of wins and ${Math.round(lossPresence)}% of losses`
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.difference || 0) - (a?.difference || 0));

  return critical.slice(0, 5); // Top 5 critical factors
}

// ====================
// TIME PATTERNS
// ====================
function analyzeTimePatterns(entries: any[], wins: any[], losses: any[]) {
  const timeMap: Record<string, { wins: number; losses: number }> = {};
  
  entries.forEach(entry => {
    if (entry.timeOfDay) {
      if (!timeMap[entry.timeOfDay]) {
        timeMap[entry.timeOfDay] = { wins: 0, losses: 0 };
      }
      
      const isWin = wins.includes(entry);
      const isLoss = losses.includes(entry);
      
      if (isWin) timeMap[entry.timeOfDay].wins++;
      if (isLoss) timeMap[entry.timeOfDay].losses++;
    }
  });

  const patterns = Object.entries(timeMap)
    .map(([time, stats]) => {
      const total = stats.wins + stats.losses;
      if (total < 2) return null;
      
      const winRate = Math.round((stats.wins / total) * 100);
      return `${time}: ${winRate}% win rate (${stats.wins}W/${stats.losses}L)`;
    })
    .filter(Boolean);

  return { patterns };
}

function findBestTimeOfDay(entries: any[]) {
  const timeMap: Record<string, { wins: number; losses: number }> = {};
  
  entries.forEach(entry => {
    if (entry.timeOfDay) {
      if (!timeMap[entry.timeOfDay]) {
        timeMap[entry.timeOfDay] = { wins: 0, losses: 0 };
      }
      
      const outcome = entry.outcome || entry.result;
      if (outcome === 'win') timeMap[entry.timeOfDay].wins++;
      if (outcome === 'loss') timeMap[entry.timeOfDay].losses++;
    }
  });

  let bestTime = null;
  let bestWinRate = 0;

  Object.entries(timeMap).forEach(([time, stats]) => {
    const total = stats.wins + stats.losses;
    if (total >= 3) {
      const winRate = (stats.wins / total) * 100;
      if (winRate > bestWinRate) {
        bestWinRate = winRate;
        bestTime = {
          time,
          winRate: Math.round(winRate),
          trades: total,
          wins: stats.wins,
          losses: stats.losses
        };
      }
    }
  });

  return bestTime;
}

function findBestDay(entries: any[]) {
  const dayMap: Record<string, { wins: number; total: number }> = {};
  
  entries.forEach(entry => {
    if (entry.date) {
      const date = new Date(entry.date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      if (!dayMap[dayName]) {
        dayMap[dayName] = { wins: 0, total: 0 };
      }
      
      dayMap[dayName].total++;
      const outcome = entry.outcome || entry.result;
      if (outcome === 'win') dayMap[dayName].wins++;
    }
  });

  let bestDay = null;
  let bestWinRate = 0;

  Object.entries(dayMap).forEach(([day, stats]) => {
    if (stats.total >= 3) {
      const winRate = (stats.wins / stats.total) * 100;
      if (winRate > bestWinRate) {
        bestWinRate = winRate;
        bestDay = `${day} (${Math.round(winRate)}% from ${stats.total} trades)`;
      }
    }
  });

  return bestDay;
}

// ====================
// EMOTIONAL PATTERNS
// ====================
function analyzeEmotionalPatterns(entries: any[], wins: any[], losses: any[]) {
  const emotionMap: Record<string, { wins: number; losses: number }> = {};
  
  entries.forEach(entry => {
    if (entry.emotionalState) {
      if (!emotionMap[entry.emotionalState]) {
        emotionMap[entry.emotionalState] = { wins: 0, losses: 0 };
      }
      
      const isWin = wins.includes(entry);
      const isLoss = losses.includes(entry);
      
      if (isWin) emotionMap[entry.emotionalState].wins++;
      if (isLoss) emotionMap[entry.emotionalState].losses++;
    }
  });

  const patterns = Object.entries(emotionMap)
    .map(([emotion, stats]) => {
      const total = stats.wins + stats.losses;
      if (total < 2) return null;
      
      const winRate = Math.round((stats.wins / total) * 100);
      
      if (winRate >= 65) {
        return `✅ ${emotion}: Strong performance (${winRate}% win rate, ${stats.wins}W/${stats.losses}L)`;
      } else if (winRate <= 35) {
        return `⚠️ ${emotion}: Poor performance (${winRate}% win rate, ${stats.wins}W/${stats.losses}L) - AVOID trading in this state`;
      }
      return `${emotion}: ${winRate}% win rate (${stats.wins}W/${stats.losses}L)`;
    })
    .filter(Boolean);

  let summary = 'Limited emotional data';
  if (patterns.length > 0) {
    const hasWarnings = patterns.some(p => p.includes('⚠️'));
    if (hasWarnings) {
      summary = '⚠️ Your emotions significantly impact performance';
    } else {
      summary = '✅ Good emotional discipline';
    }
  }

  return { patterns, summary };
}

// ====================
// STRATEGY PERFORMANCE
// ====================
function analyzeStrategies(entries: any[]) {
  const strategyMap: Record<string, any[]> = {};
  
  entries.forEach(entry => {
    const strategy = entry.strategy || 'Default';
    if (!strategyMap[strategy]) {
      strategyMap[strategy] = [];
    }
    strategyMap[strategy].push(entry);
  });

  const performance: Record<string, any> = {};
  
  Object.entries(strategyMap).forEach(([strategy, trades]) => {
    const wins = trades.filter(t => (t.outcome || t.result) === 'win').length;
    const losses = trades.filter(t => (t.outcome || t.result) === 'loss').length;
    const total = trades.length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    const totalPnL = trades.reduce((sum, t) => sum + (parseFloat(t.profitLoss) || 0), 0);
    
    performance[strategy] = {
      trades: total,
      wins,
      losses,
      winRate: Math.round(winRate),
      totalPnL,
      avgPnL: total > 0 ? totalPnL / total : 0
    };
  });

  return performance;
}

// ====================
// DISCIPLINE SCORE
// ====================
function calculateDisciplineScore(entries: any[], fieldInsights: any) {
  let score = 50;
  
  const entriesWithFields = entries.filter(e => {
    if (!e.customFields) return false;
    const checkedCount = Object.values(e.customFields).filter(v => v === true).length;
    return checkedCount > 0;
  }).length;
  
  const fieldUsageRate = entries.length > 0 ? (entriesWithFields / entries.length) * 100 : 0;
  
  if (fieldUsageRate >= 90) {
    score += 25;
  } else if (fieldUsageRate >= 70) {
    score += 15;
  } else if (fieldUsageRate >= 50) {
    score += 5;
  } else if (fieldUsageRate < 30) {
    score -= 25;
  }
  
  const highConfluenceTrades = entries.filter(e => {
    if (!e.customFields) return false;
    const checkedCount = Object.values(e.customFields).filter(v => v === true).length;
    return checkedCount >= 3;
  }).length;
  
  const confluenceRate = entries.length > 0 ? (highConfluenceTrades / entries.length) * 100 : 0;
  
  if (confluenceRate >= 70) {
    score += 20;
  } else if (confluenceRate >= 40) {
    score += 10;
  } else if (confluenceRate < 20) {
    score -= 20;
  }
  
  const goodRRTrades = entries.filter(e => parseFloat(e.riskReward) >= 2).length;
  const rrRate = entries.length > 0 ? (goodRRTrades / entries.length) * 100 : 0;
  
  if (rrRate >= 70) {
    score += 15;
  } else if (rrRate < 30) {
    score -= 15;
  }
  
  return Math.max(0, Math.min(100, score));
}

// ====================
// RISK SCORE
// ====================
function calculateRiskScore(entries: any[], emotionalInsights: any) {
  let score = 30;
  
  let consecutiveLosses = 0;
  
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const outcome = entry.outcome || entry.result;
    
    if (outcome === 'loss') {
      consecutiveLosses++;
    } else {
      if (consecutiveLosses >= 2) {
        const pnl = Math.abs(parseFloat(entry.profitLoss) || 0);
        if (pnl > 0) {
          score += 20;
        }
      }
      consecutiveLosses = 0;
    }
  }
  
  const warnings = emotionalInsights.patterns.filter((p: string) => p.includes('⚠️')).length;
  score += warnings * 15;
  
  if (entries.length >= 10) {
    const dates = entries.map(e => new Date(e.date).getTime()).sort();
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    const dayRange = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
    const tradesPerDay = entries.length / Math.max(1, dayRange);
    
    if (tradesPerDay > 5) {
      score += 20;
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

// ====================
// LOSS STREAK
// ====================
function calculateMaxLossStreak(entries: any[]) {
  let currentStreak = 0;
  let maxStreak = 0;
  
  entries.forEach(entry => {
    const outcome = entry.outcome || entry.result;
    if (outcome === 'loss') {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });
  
  return maxStreak;
}

// ====================
// SMART RECOMMENDATIONS
// ====================
function generateSmartRecommendations(
  winRate: number,
  expectancy: number,
  fieldInsights: any,
  confluenceAnalysis: any,
  criticalFactors: any[],
  timeInsights: any,
  emotionalInsights: any,
  totalTrades: number
) {
  const recommendations: string[] = [];
  
  // Sample size
  if (totalTrades < 20) {
    recommendations.push(`📈 You have ${totalTrades} trades - aim for 30+ to identify reliable patterns`);
  }
  
  // Critical factors (appear way more in wins than losses)
  if (criticalFactors.length > 0) {
    const topCritical = criticalFactors.filter(f => f.isCritical);
    if (topCritical.length > 0) {
      const fieldNames = topCritical.map(f => f.fieldName).join(', ');
      recommendations.push(`🎯 CRITICAL CONFLUENCES: Always wait for "${fieldNames}" - they appear in your wins far more than losses`);
    }
  }
  
  // Field impact
  if (fieldInsights.hasInsights && fieldInsights.details.length > 0) {
    const highImpact = fieldInsights.details.filter((f: any) => f.impact >= 15);
    const negative = fieldInsights.details.filter((f: any) => f.impact <= -15);
    
    if (highImpact.length > 0) {
      const field = highImpact[0];
      recommendations.push(`✅ ALWAYS check "${field.fieldName}" - increases win rate by ${field.impact}% (${field.winRateWhenPresent}% vs ${field.winRateWhenAbsent}%)`);
    }
    
    if (negative.length > 0) {
      const field = negative[negative.length - 1];
      recommendations.push(`⚠️ IGNORE "${field.fieldName}" - lowers win rate by ${Math.abs(field.impact)}% when present`);
    }
  }
  
  // Optimal confluence level
  if (confluenceAnalysis.optimalConfluenceCount) {
    const optimal = confluenceAnalysis.optimalConfluenceCount;
    recommendations.push(`🎯 Wait for ${optimal.confluenceCount}+ confirmations for best results (${optimal.winRate}% win rate with ${optimal.confluenceCount} factors)`);
  }
  
  // High probability setups
  if (confluenceAnalysis.topCombinations && confluenceAnalysis.topCombinations.length > 0) {
    const best = confluenceAnalysis.topCombinations[0];
    if (best.isHighProbability) {
      recommendations.push(`🔥 Your killer setup: ${best.comboName} = ${best.winRate}% win rate (${best.wins}W/${best.losses}L)`);
    }
  }
  
  // Emotional warnings
  const badEmotions = emotionalInsights.patterns
    .filter((p: string) => p.includes('⚠️'))
    .map((p: string) => {
      const match = p.match(/⚠️ ([^:]+):/);
      return match ? match[1].trim() : null;
    })
    .filter(Boolean);
  
  if (badEmotions.length > 0) {
    recommendations.push(`🧠 NEVER trade when feeling: ${badEmotions.join(', ')} - your win rate drops significantly`);
  }
  
  // Win rate improvement
  if (winRate < 50) {
    recommendations.push(`📉 ${winRate.toFixed(0)}% win rate - focus ONLY on your high-probability setups until you're consistently above 55%`);
  } else if (winRate >= 65) {
    recommendations.push(`🎯 ${winRate.toFixed(0)}% win rate is excellent - stick to what's working and focus on risk management`);
  }
  
  return recommendations.slice(0, 6);
}

// ====================
// KEY PATTERNS
// ====================
function generateKeyPatterns(
  winRate: number,
  profitFactor: number,
  expectancy: number,
  totalTrades: number,
  fieldInsights: any,
  criticalFactors: any[]
) {
  const patterns: string[] = [];
  
  // Overall performance
  if (winRate >= 65) {
    patterns.push(`🎯 Strong ${winRate.toFixed(0)}% win rate - your strategy is working well`);
  } else if (winRate >= 50) {
    patterns.push(`📊 ${winRate.toFixed(0)}% win rate - improve by focusing on high-confluence setups`);
  } else {
    patterns.push(`⚠️ ${winRate.toFixed(0)}% win rate - review your entry criteria and wait for better setups`);
  }
  
  // Profit factor
  if (profitFactor >= 2) {
    patterns.push(`💰 Excellent ${profitFactor.toFixed(2)} profit factor - winners outweigh losers`);
  } else if (profitFactor < 1 && profitFactor > 0) {
    patterns.push(`⚠️ ${profitFactor.toFixed(2)} profit factor - cut losses faster or let winners run`);
  }
  
  // Critical factors
  if (criticalFactors.length > 0 && criticalFactors[0].isCritical) {
    const factor = criticalFactors[0];
    patterns.push(`🔥 "${factor.fieldName}" is CRITICAL - present in ${factor.winPresence}% of wins vs only ${factor.lossPresence}% of losses`);
  }
  
  // Field insights
  if (fieldInsights.hasInsights && fieldInsights.details.length > 0) {
    const topField = fieldInsights.details[0];
    if (topField.impact >= 15) {
      patterns.push(`✅ "${topField.fieldName}": ${topField.winRateWhenPresent}% win rate when present vs ${topField.winRateWhenAbsent}% when absent (+${topField.impact}%)`);
    }
  }
  
  return patterns;
}

// ====================
// EMPTY STATE
// ====================
function getEmptyAnalysis() {
  return {
    winRate: 0,
    totalTrades: 0,
    wins: 0,
    losses: 0,
    breakevens: 0,
    avgWinAmount: 0,
    avgLossAmount: 0,
    profitFactor: 0,
    totalPnL: 0,
    expectancy: 0,
    predictedProbability: 0,
    bestDay: 'N/A',
    maxLossStreak: 0,
    riskScore: 50,
    disciplineScore: 50,
    emotionalPattern: 'Not enough data',
    recommendations: ["Add more trades to get meaningful insights"],
    patterns: [],
    emotionalPatterns: [],
    timePatterns: [],
    strategyPerformance: {},
    customFieldInsights: null,
    confluenceInsights: { topCombinations: [], confluenceLevels: [], optimalConfluenceCount: null },
    criticalFactors: [],
    highProbabilitySetups: [],
    bestTimePattern: null,
    isEnhancedByAI: false
  };
}

// ====================
// TRADE INSIGHTS (for individual trade review)
// ====================
export function generateTradeInsights(entry: any): string[] {
  const insights: string[] = [];
  
  const result = entry.result || entry.outcome;
  if (result === 'win') {
    insights.push("✅ Great trade! What confluences were present that made this setup work?");
  } else if (result === 'loss') {
    insights.push("📝 Every loss is a learning opportunity. Which confirmations were missing?");
  }
  
  const rr = parseFloat(entry.riskReward) || 0;
  if (rr >= 2) {
    insights.push(`🎯 Excellent ${rr}:1 risk-reward. Keep targeting 2:1+ setups.`);
  } else if (rr > 0 && rr < 1.5) {
    insights.push(`⚠️ ${rr}:1 risk-reward is too low. Target at least 2:1 for better results.`);
  }
  
  if (entry.customFields && Object.keys(entry.customFields).length > 0) {
    const checkedCount = Object.values(entry.customFields).filter(v => v === true).length;
    if (checkedCount >= 3) {
      insights.push(`✅ ${checkedCount} confirmations = high-probability setup. This is the quality you want.`);
    } else if (checkedCount <= 1) {
      insights.push(`⚠️ Only ${checkedCount} confirmation(s). Wait for more confluences before entering.`);
    }
  } else {
    insights.push("📋 No criteria checked. Use your checklist to validate setups before entering.");
  }
  
  if (!entry.description || entry.description.length < 20) {
    insights.push("📸 Add detailed notes about what you observed and why you took this trade.");
  }

  return insights;
}
