interface BudgetProfile {
  monthlyIncome: number;
  fixedExpenses: number;
  loanPayment: number;
  monthlySavingsGoal: number;
  disposableIncome: number;
  dailyBudget: number;
  createdAt?: string;
}

interface DailySpending {
  date: string;
  amount: number;
  budgetStatus: 'under' | 'within_range' | 'over';
  feeling?: string;
  savedAmount: number;
}

interface AdaptiveBudgetHealth {
  status: 'excellent' | 'good' | 'warning' | 'critical';
  percentageUsed: number;
  remainingBalance: number;
  daysLeft: number;
  daysElapsed: number;
  adaptiveDailyBudget: number;
  totalSpentThisMonth: number;
  spendableIncome: number;
  recoveryMessage?: string;
  savingOpportunities: string[];
  healthScore: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
}

export class AdaptiveBudgetService {
  /**
   * Calculate the current budget health with real-time adaptive daily budget
   */
  static calculateBudgetHealth(
    profile: BudgetProfile,
    spendingHistory: DailySpending[]
  ): AdaptiveBudgetHealth {
    // Guard against undefined/invalid profile
    if (!profile || !profile.disposableIncome) {
      return {
        status: 'excellent',
        percentageUsed: 0,
        remainingBalance: 0,
        daysLeft: 0,
        daysElapsed: 0,
        adaptiveDailyBudget: 0,
        totalSpentThisMonth: 0,
        spendableIncome: 0,
        recoveryMessage: 'Set up your budget to track spending',
        savingOpportunities: [],
        healthScore: 100,
        trend: 'stable',
      };
    }

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = today.getDate();
    const daysLeft = Math.max(1, lastDayOfMonth - currentDay + 1);
    const daysElapsed = Math.max(1, currentDay - 1);

    // Calculate total spent this month
    const monthlySpending = spendingHistory
      .filter(s => {
        try {
          const spendDate = new Date(s.date);
          return (
            spendDate.getMonth() === currentMonth &&
            spendDate.getFullYear() === currentYear
          );
        } catch {
          return false;
        }
      })
      .reduce((sum, s) => sum + (s.amount || 0), 0);

    const spendableIncome = Math.max(0, (profile.disposableIncome || 0) - (profile.monthlySavingsGoal || 0));
    const remainingBalance = spendableIncome - monthlySpending;
    const adaptiveDailyBudget = spendableIncome > 0 && daysLeft > 0 ? remainingBalance / daysLeft : 0;
    const percentageUsed = spendableIncome > 0 ? (monthlySpending / spendableIncome) * 100 : 0;

    // Determine status and calculate health score
    let status: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';
    let healthScore = 100;
    let recoveryMessage: string | undefined;
    const savingOpportunities: string[] = [];

    if (percentageUsed > 100) {
      status = 'critical';
      healthScore = Math.max(0, 100 - (percentageUsed - 100) * 2);
      const overspent = monthlySpending - spendableIncome;
      const dailyRecoveryNeeded = daysLeft > 0 ? overspent / daysLeft : overspent;
      recoveryMessage = `🚨 CRITICAL: You're ${overspent.toFixed(2)} over budget! You need to reduce spending by ${dailyRecoveryNeeded.toFixed(2)}/day for the next ${daysLeft} days to recover.`;
      savingOpportunities.push('Cut non-essential spending immediately');
      savingOpportunities.push('Review daily purchases and postpone discretionary items');
      savingOpportunities.push('Look for quick wins: cancel subscriptions, reduce dining out');
    } else if (percentageUsed > 85) {
      status = 'warning';
      healthScore = Math.max(20, 100 - (percentageUsed - 85) * 3);
      const dailyTarget = daysLeft > 0 ? remainingBalance / daysLeft : 0;
      recoveryMessage = `⚡ WARNING: You've used ${percentageUsed.toFixed(1)}% of your budget. Only ${remainingBalance.toFixed(2)} left for ${daysLeft} days!`;
      savingOpportunities.push('Slow down spending - be mindful of purchases');
      savingOpportunities.push(`Target: ${dailyTarget.toFixed(2)}/day to finish month on budget`);
    } else if (percentageUsed > 60) {
      status = 'good';
      healthScore = 75;
      const dailyAvg = daysElapsed > 0 ? monthlySpending / daysElapsed : 0;
      savingOpportunities.push('You\'re on track! Maintain current pace.');
      savingOpportunities.push(`Current daily average: ${dailyAvg.toFixed(2)}`);
    } else {
      status = 'excellent';
      healthScore = 90;
      const saved = spendableIncome - monthlySpending;
      const dailyAvg = daysElapsed > 0 ? monthlySpending / daysElapsed : 0;
      savingOpportunities.push(`🎉 Excellent control! You could save an extra ${saved.toFixed(2)} this month.`);
      savingOpportunities.push(`At current pace: ${dailyAvg.toFixed(2)}/day`);
    }

    // Calculate trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (spendingHistory.length >= 14) {
      const last7Days = spendingHistory.slice(-7);
      const first7Days = spendingHistory.slice(0, 7);
      const last7Avg = last7Days.length > 0 ? last7Days.reduce((sum, s) => sum + (s.amount || 0), 0) / 7 : 0;
      const first7Avg = first7Days.length > 0 ? first7Days.reduce((sum, s) => sum + (s.amount || 0), 0) / 7 : 0;
      if (last7Avg < first7Avg * 0.9) trend = 'improving';
      else if (last7Avg > first7Avg * 1.1) trend = 'declining';
    }

    return {
      status,
      percentageUsed: Math.min(Math.max(0, percentageUsed), 100),
      remainingBalance: Math.max(remainingBalance, 0),
      daysLeft,
      daysElapsed,
      adaptiveDailyBudget: Math.max(adaptiveDailyBudget, 0),
      totalSpentThisMonth: monthlySpending,
      spendableIncome: Math.max(0, spendableIncome),
      recoveryMessage,
      savingOpportunities,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      trend,
    };
  }

  /**
   * Get recommendations based on spending patterns
   */
  static getSmartRecommendations(
    health: AdaptiveBudgetHealth,
    spendingHistory: DailySpending[]
  ): string[] {
    const recommendations: string[] = [];

    if (health.status === 'critical') {
      recommendations.push('🔴 EMERGENCY MODE: Reduce daily spending immediately');
      recommendations.push(`You need to spend max ${health.adaptiveDailyBudget.toFixed(2)}/day`);
    } else if (health.status === 'warning') {
      recommendations.push('⚠️ Be extra careful with purchases');
      recommendations.push(`Recommended daily spend: ${health.adaptiveDailyBudget.toFixed(2)}`);
    } else if (health.status === 'good') {
      recommendations.push('✅ On track! Continue current habits');
    } else {
      recommendations.push('🌟 Excellent! You could increase savings');
    }

    // Pattern-based recommendations
    if (spendingHistory.length > 0) {
      const lastEntry = spendingHistory[spendingHistory.length - 1];
      if (lastEntry.budgetStatus === 'over') {
        recommendations.push('Last purchase exceeded daily limit - adjust next time');
      }

      const overBudgetDays = spendingHistory.filter(
        s => s.budgetStatus === 'over'
      ).length;
      if (overBudgetDays > spendingHistory.length / 2) {
        recommendations.push('More than half your days exceeded budget - time to reset habits');
      }
    }

    return recommendations;
  }

  /**
   * Calculate if user is on track to meet savings goal
   */
  static calculateSavingsProjection(
    profile: BudgetProfile,
    spendingHistory: DailySpending[]
  ): { onTrack: boolean; projectedSavings: number; message: string } {
    const today = new Date();
    const lastDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate();
    const daysElapsed = today.getDate();
    const daysLeft = lastDayOfMonth - daysElapsed;

    const monthlySpent = spendingHistory.reduce((sum, s) => sum + s.amount, 0);
    const avgDailySpending = monthlySpent / daysElapsed;
    const projectedMonthlySpend = avgDailySpending * lastDayOfMonth;

    const spendableIncome = profile.disposableIncome - profile.monthlySavingsGoal;
    const projectedSavings = spendableIncome - projectedMonthlySpend;
    const onTrack = projectedSavings >= profile.monthlySavingsGoal * 0.9; // 90% of goal

    let message = '';
    if (onTrack) {
      message = `✅ On track to save ${projectedSavings.toFixed(2)} this month!`;
    } else {
      const deficit = profile.monthlySavingsGoal - projectedSavings;
      message = `📉 Projected savings short by ${deficit.toFixed(2)} at current pace`;
    }

    return { onTrack, projectedSavings: Math.max(projectedSavings, 0), message };
  }

  /**
   * Get color based on budget health status
   */
  static getHealthColor(status: AdaptiveBudgetHealth['status']): string {
    switch (status) {
      case 'excellent':
        return '#10b981'; // Green
      case 'good':
        return '#3b82f6'; // Blue
      case 'warning':
        return '#f59e0b'; // Amber
      case 'critical':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  }

  /**
   * Get emoji based on budget health status
   */
  static getHealthEmoji(status: AdaptiveBudgetHealth['status']): string {
    switch (status) {
      case 'excellent':
        return '🌟';
      case 'good':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'critical':
        return '🚨';
      default:
        return '❓';
    }
  }
}
