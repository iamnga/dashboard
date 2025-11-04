import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { mean, standardDeviation, linearRegression, linearRegressionLine } from 'simple-statistics';
import type {
  Transaction,
  Company,
  KpiTarget,
  Feedback,
  Channel,
  Product,
  TargetComparison,
  NPSCategory,
  BadgeType,
  LeaderboardEntry,
  ForecastPoint,
  AnomalyAlert,
  ROICalculation,
  ContractPricing,
} from '../types';

dayjs.extend(isBetween);

// ============= KPI Calculations =============

export function calculateTotalTransactions(transactions: Transaction[]): number {
  return transactions.length;
}

export function calculateTotalVolume(transactions: Transaction[]): number {
  return transactions.reduce((sum, txn) => sum + txn.amount, 0);
}

export function calculateTotalRevenue(transactions: Transaction[]): number {
  return transactions.reduce((sum, txn) => sum + txn.fee, 0);
}

export function calculateUniqueCustomers(transactions: Transaction[]): number {
  const uniqueCompanies = new Set(transactions.map(txn => txn.companyId));
  return uniqueCompanies.size;
}

export function calculateNewCustomers(transactions: Transaction[]): number {
  const newCustomerTxns = transactions.filter(txn => txn.customerType === 'NEW');
  const uniqueNewCustomers = new Set(newCustomerTxns.map(txn => txn.companyId));
  return uniqueNewCustomers.size;
}

export function calculateAverageCASA(companies: Company[], activeCompanyIds: Set<string>): number {
  const activeCompanies = companies.filter(c => activeCompanyIds.has(c.id));
  if (activeCompanies.length === 0) return 0;
  return activeCompanies.reduce((sum, c) => sum + c.casaAvg, 0) / activeCompanies.length;
}

export function calculateSuccessRate(transactions: Transaction[]): number {
  if (transactions.length === 0) return 0;
  const successCount = transactions.filter(txn => txn.status === 'SUCCESS').length;
  return (successCount / transactions.length) * 100;
}

export function calculateAverageProcessTime(transactions: Transaction[]): number {
  if (transactions.length === 0) return 0;
  const totalTime = transactions.reduce((sum, txn) => sum + txn.processMs, 0);
  return totalTime / transactions.length;
}

// ============= Target Comparison =============

export function compareWithTarget(
  actual: number,
  target: number,
  threshold: number = 2
): "BELOW" | "ON_TARGET" | "ABOVE" {
  const variance = ((actual - target) / target) * 100;
  if (variance < -threshold) return "BELOW";
  if (variance > threshold) return "ABOVE";
  return "ON_TARGET";
}

export function calculateTargetComparisons(
  transactions: Transaction[],
  targets: KpiTarget[],
  period: string,
  channel?: Channel,
  product?: Product
): TargetComparison[] {
  const relevantTargets = targets.filter(t => {
    if (t.period !== period) return false;
    if (channel && t.channel !== channel) return false;
    if (product && t.product !== product) return false;
    return true;
  });

  const filteredTxns = transactions.filter(txn => {
    if (channel && txn.channel !== channel) return false;
    if (product && txn.product !== product) return false;
    return true;
  });

  return relevantTargets.map(target => {
    let actual: number;

    switch (target.metric) {
      case "TXN_COUNT":
        actual = filteredTxns.length;
        break;
      case "VOLUME":
        actual = calculateTotalVolume(filteredTxns);
        break;
      case "REVENUE":
        actual = calculateTotalRevenue(filteredTxns);
        break;
      case "SUCCESS_RATE":
        actual = calculateSuccessRate(filteredTxns);
        break;
      default:
        actual = 0;
    }

    const variance = actual - target.target;
    const status = compareWithTarget(actual, target.target);

    return {
      period: target.period,
      channel: target.channel,
      product: target.product,
      metric: target.metric,
      actual,
      target: target.target,
      variance,
      status,
    };
  });
}

// ============= NPS Calculation =============

export function getNPSCategory(score: number): NPSCategory {
  if (score >= 9) return "PROMOTER";
  if (score >= 7) return "PASSIVE";
  return "DETRACTOR";
}

export function calculateNPS(feedbacks: Feedback[]): number {
  if (feedbacks.length === 0) return 0;

  const promoters = feedbacks.filter(f => f.nps >= 9).length;
  const detractors = feedbacks.filter(f => f.nps <= 6).length;
  const total = feedbacks.length;

  return ((promoters - detractors) / total) * 100;
}

// ============= ROI Calculation =============

export function calculateROI(
  transactions: Transaction[],
  pricing: ContractPricing[],
  groupBy: 'company' | 'channel' | 'product' = 'company'
): ROICalculation[] {
  const groups = new Map<string, { revenue: number; cost: number }>();

  transactions.forEach(txn => {
    const key = groupBy === 'company' ? txn.companyId :
                groupBy === 'channel' ? txn.channel :
                txn.product;

    const pricingRule = pricing.find(p =>
      p.companyId === txn.companyId &&
      p.channel === txn.channel &&
      p.product === txn.product
    );

    if (!pricingRule) return;

    const revenue = txn.fee + (pricingRule.commission || 0);
    const cost = pricingRule.opsCost;

    if (!groups.has(key)) {
      groups.set(key, { revenue: 0, cost: 0 });
    }

    const group = groups.get(key)!;
    group.revenue += revenue;
    group.cost += cost;
  });

  return Array.from(groups.entries()).map(([entity, data]) => {
    const profit = data.revenue - data.cost;
    const roi = data.cost > 0 ? (profit / data.cost) * 100 : 0;
    const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;

    return {
      entity,
      revenue: data.revenue,
      cost: data.cost,
      profit,
      roi,
      margin,
    };
  });
}

// ============= Leaderboard & Gamification =============

export function calculateLeaderboard(
  transactions: Transaction[],
  companies: Company[]
): LeaderboardEntry[] {
  const companyStats = new Map<string, { volume: number; count: number; success: number }>();

  transactions.forEach(txn => {
    if (!companyStats.has(txn.companyId)) {
      companyStats.set(txn.companyId, { volume: 0, count: 0, success: 0 });
    }

    const stats = companyStats.get(txn.companyId)!;
    stats.volume += txn.amount;
    stats.count += 1;
    if (txn.status === 'SUCCESS') {
      stats.success += 1;
    }
  });

  const entries: LeaderboardEntry[] = Array.from(companyStats.entries()).map(([companyId, stats]) => {
    const company = companies.find(c => c.id === companyId);
    const successRate = (stats.success / stats.count) * 100;

    // Determine badge
    let badge: BadgeType | undefined;
    if (successRate > 98 && stats.volume > 0) {
      badge = "GOLD";
    } else if (successRate > 96 && stats.volume > 0) {
      badge = "SILVER";
    }

    return {
      companyId,
      companyName: company?.name || companyId,
      volume: stats.volume,
      transactions: stats.count,
      successRate,
      rank: 0, // Will be set after sorting
      badge,
    };
  });

  // Sort by volume descending
  entries.sort((a, b) => b.volume - a.volume);

  // Assign ranks
  entries.forEach((entry, index) => {
    entry.rank = index + 1;

    // Check for API Champion badge
    const apiTxns = transactions.filter(
      txn => txn.companyId === entry.companyId && txn.channel === 'API'
    );
    if (apiTxns.length > 0) {
      const apiSuccess = apiTxns.filter(txn => txn.status === 'SUCCESS').length;
      const apiSuccessRate = (apiSuccess / apiTxns.length) * 100;
      const avgP95 = apiTxns.reduce((sum, txn) => sum + txn.processMs, 0) / apiTxns.length;

      if (apiSuccessRate > 99 && avgP95 < 300) {
        entry.badge = "API_CHAMPION";
      }
    }

    // Top 10% Gold
    if (index < entries.length * 0.1 && entry.successRate > 98) {
      entry.badge = "GOLD";
    }
    // Top 30% Silver
    else if (index < entries.length * 0.3 && entry.successRate > 96) {
      entry.badge = entry.badge === "API_CHAMPION" ? "API_CHAMPION" : "SILVER";
    }
  });

  return entries;
}

// ============= Anomaly Detection =============

export function detectAnomalies(
  transactions: Transaction[],
  lookbackDays: number = 30,
  zThreshold: number = 3
): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];
  const now = dayjs();

  // Group by day and calculate error/timeout rates
  const dailyStats = new Map<string, { total: number; errors: number; timeouts: number; totalLatency: number }>();

  transactions.forEach(txn => {
    const day = dayjs(txn.ts).format('YYYY-MM-DD');
    if (!dailyStats.has(day)) {
      dailyStats.set(day, { total: 0, errors: 0, timeouts: 0, totalLatency: 0 });
    }

    const stats = dailyStats.get(day)!;
    stats.total += 1;
    stats.totalLatency += txn.processMs;
    if (txn.status === 'FAILED') stats.errors += 1;
    if (txn.status === 'TIMEOUT') stats.timeouts += 1;
  });

  // Convert to arrays for statistical analysis
  const days = Array.from(dailyStats.keys()).sort();
  const recentDays = days.slice(-lookbackDays);

  const errorRates = recentDays.map(day => {
    const stats = dailyStats.get(day)!;
    return (stats.errors / stats.total) * 100;
  });

  const timeoutRates = recentDays.map(day => {
    const stats = dailyStats.get(day)!;
    return (stats.timeouts / stats.total) * 100;
  });

  const avgLatencies = recentDays.map(day => {
    const stats = dailyStats.get(day)!;
    return stats.totalLatency / stats.total;
  });

  // Calculate z-scores for most recent day
  if (errorRates.length >= 7) {
    const errorMean = mean(errorRates.slice(0, -1));
    const errorStd = standardDeviation(errorRates.slice(0, -1));
    const latestErrorRate = errorRates[errorRates.length - 1];
    const errorZScore = errorStd > 0 ? (latestErrorRate - errorMean) / errorStd : 0;

    if (Math.abs(errorZScore) >= zThreshold) {
      alerts.push({
        id: `ALERT_ERROR_${Date.now()}`,
        ts: now.toISOString(),
        type: "ERROR_SPIKE",
        severity: errorZScore > 4 ? "HIGH" : errorZScore > 3.5 ? "MEDIUM" : "LOW",
        message: `Tỷ lệ lỗi bất thường: ${latestErrorRate.toFixed(2)}% (trung bình: ${errorMean.toFixed(2)}%)`,
        metric: "error_rate",
        value: latestErrorRate,
        zscore: errorZScore,
        suggestion: "Kiểm tra logs hệ thống và infrastructure. Có thể cần scale up resources.",
      });
    }

    const timeoutMean = mean(timeoutRates.slice(0, -1));
    const timeoutStd = standardDeviation(timeoutRates.slice(0, -1));
    const latestTimeoutRate = timeoutRates[timeoutRates.length - 1];
    const timeoutZScore = timeoutStd > 0 ? (latestTimeoutRate - timeoutMean) / timeoutStd : 0;

    if (Math.abs(timeoutZScore) >= zThreshold) {
      alerts.push({
        id: `ALERT_TIMEOUT_${Date.now()}`,
        ts: now.toISOString(),
        type: "TIMEOUT_SPIKE",
        severity: timeoutZScore > 4 ? "HIGH" : timeoutZScore > 3.5 ? "MEDIUM" : "LOW",
        message: `Tỷ lệ timeout bất thường: ${latestTimeoutRate.toFixed(2)}% (trung bình: ${timeoutMean.toFixed(2)}%)`,
        metric: "timeout_rate",
        value: latestTimeoutRate,
        zscore: timeoutZScore,
        suggestion: "Kiểm tra network latency và database performance. Cân nhắc tăng timeout threshold.",
      });
    }

    const latencyMean = mean(avgLatencies.slice(0, -1));
    const latencyStd = standardDeviation(avgLatencies.slice(0, -1));
    const latestLatency = avgLatencies[avgLatencies.length - 1];
    const latencyZScore = latencyStd > 0 ? (latestLatency - latencyMean) / latencyStd : 0;

    if (latencyZScore >= zThreshold) {
      alerts.push({
        id: `ALERT_LATENCY_${Date.now()}`,
        ts: now.toISOString(),
        type: "LATENCY_SPIKE",
        severity: latencyZScore > 4 ? "HIGH" : latencyZScore > 3.5 ? "MEDIUM" : "LOW",
        message: `Latency bất thường: ${latestLatency.toFixed(0)}ms (trung bình: ${latencyMean.toFixed(0)}ms)`,
        metric: "latency",
        value: latestLatency,
        zscore: latencyZScore,
        suggestion: "Optimize database queries và cache strategy. Kiểm tra third-party service dependencies.",
      });
    }
  }

  return alerts;
}

// ============= Forecasting =============

export function forecastTimeSeries(
  transactions: Transaction[],
  metric: 'volume' | 'count' | 'revenue',
  periodsAhead: number = 3,
  groupBy: 'day' | 'week' | 'month' = 'day'
): ForecastPoint[] {
  // Group transactions by time period
  const groups = new Map<string, number>();

  transactions.forEach(txn => {
    let period: string;
    const date = dayjs(txn.ts);

    switch (groupBy) {
      case 'day':
        period = date.format('YYYY-MM-DD');
        break;
      case 'week':
        period = date.startOf('week').format('YYYY-MM-DD');
        break;
      case 'month':
        period = date.format('YYYY-MM');
        break;
    }

    if (!groups.has(period)) {
      groups.set(period, 0);
    }

    let value: number;
    switch (metric) {
      case 'volume':
        value = txn.amount;
        break;
      case 'count':
        value = 1;
        break;
      case 'revenue':
        value = txn.fee;
        break;
    }

    groups.set(period, groups.get(period)! + value);
  });

  const sortedPeriods = Array.from(groups.keys()).sort();
  const values = sortedPeriods.map(p => groups.get(p)!);

  // Prepare data for linear regression
  const data: [number, number][] = values.map((value, index) => [index, value]);

  if (data.length < 3) {
    return []; // Not enough data for regression
  }

  const regression = linearRegression(data);
  const line = linearRegressionLine(regression);

  // Calculate residual standard deviation for confidence intervals
  const predictions = data.map(([x]) => line(x));
  const residuals = data.map(([, y], i) => y - predictions[i]);
  const residualStd = standardDeviation(residuals);

  // Generate forecast points
  const forecastPoints: ForecastPoint[] = [];

  // Add historical data
  sortedPeriods.forEach((period, index) => {
    forecastPoints.push({
      date: period,
      actual: values[index],
      forecast: line(index),
    });
  });

  // Add future predictions
  for (let i = 1; i <= periodsAhead; i++) {
    const futureIndex = sortedPeriods.length + i - 1;
    const forecastValue = line(futureIndex);
    let futureDate: string;

    const lastDate = dayjs(sortedPeriods[sortedPeriods.length - 1]);
    switch (groupBy) {
      case 'day':
        futureDate = lastDate.add(i, 'day').format('YYYY-MM-DD');
        break;
      case 'week':
        futureDate = lastDate.add(i, 'week').format('YYYY-MM-DD');
        break;
      case 'month':
        futureDate = lastDate.add(i, 'month').format('YYYY-MM');
        break;
    }

    forecastPoints.push({
      date: futureDate,
      forecast: Math.max(0, forecastValue),
      lower: Math.max(0, forecastValue - 1.96 * residualStd),
      upper: forecastValue + 1.96 * residualStd,
    });
  }

  return forecastPoints;
}

// ============= Failure Analysis =============

export function analyzeFailures(transactions: Transaction[]) {
  const failedTxns = transactions.filter(txn => txn.status === 'FAILED' || txn.status === 'TIMEOUT');
  const reasonCounts = new Map<string, number>();

  failedTxns.forEach(txn => {
    const reason = txn.reason || 'Unknown';
    reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
  });

  const total = failedTxns.length;
  const results = Array.from(reasonCounts.entries())
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  return results;
}
