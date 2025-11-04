import dayjs from 'dayjs';
import type {
  BalanceSnapshot,
  Transaction,
  CompanyFirstSeen,
  ContractPricing,
  EnhancedKPICard,
} from '../types';

// ============= CASA Calculations =============

export interface CasaData {
  avgDaily: number;
  total: number;
  trend: { date: string; value: number }[];
}

export function selectCasa(
  snapshots: BalanceSnapshot[],
  companies: string[]
): CasaData {
  let filteredSnapshots = snapshots;

  if (companies.length > 0) {
    filteredSnapshots = snapshots.filter(s => companies.includes(s.companyId));
  }

  if (filteredSnapshots.length === 0) {
    return { avgDaily: 0, total: 0, trend: [] };
  }

  // Group by date
  const byDate = new Map<string, number[]>();
  filteredSnapshots.forEach(snapshot => {
    if (!byDate.has(snapshot.ts)) {
      byDate.set(snapshot.ts, []);
    }
    byDate.get(snapshot.ts)!.push(snapshot.casaDailyAvg);
  });

  // Calculate avg daily and trend
  const trend: { date: string; value: number }[] = [];
  let totalSum = 0;
  let totalDays = 0;

  Array.from(byDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([date, values]) => {
      const dayAvg = values.reduce((sum, v) => sum + v, 0) / values.length;
      trend.push({ date, value: dayAvg });
      totalSum += dayAvg;
      totalDays++;
    });

  const avgDaily = totalDays > 0 ? totalSum / totalDays : 0;

  // Total CASA = sum of latest snapshot per company
  const latestByCompany = new Map<string, number>();
  filteredSnapshots.forEach(snapshot => {
    const existing = latestByCompany.get(snapshot.companyId);
    if (!existing || snapshot.ts > (filteredSnapshots.find(s => s.companyId === snapshot.companyId && s.casaDailyAvg === existing)?.ts || '')) {
      latestByCompany.set(snapshot.companyId, snapshot.casaDailyAvg);
    }
  });

  const total = Array.from(latestByCompany.values()).reduce((sum, v) => sum + v, 0);

  return { avgDaily, total, trend };
}

// ============= TOI Calculations =============

export interface ToiData {
  gross: number;
  net: number;
  trend: { date: string; value: number }[];
}

export function selectToi(
  transactions: Transaction[],
  contractPricing: ContractPricing[],
  allocationRate: number
): ToiData {
  const gross = transactions.reduce((sum, txn) => sum + txn.fee, 0);

  // Calculate allocated costs
  const costs = new Map<string, number>();
  transactions.forEach(txn => {
    const pricing = contractPricing.find(
      p => p.companyId === txn.companyId && p.channel === txn.channel && p.product === txn.product
    );
    if (pricing) {
      const key = `${txn.companyId}_${txn.channel}_${txn.product}`;
      costs.set(key, (costs.get(key) || 0) + pricing.opsCost);
    }
  });

  const totalCost = Array.from(costs.values()).reduce((sum, v) => sum + v, 0);
  const allocatedCost = totalCost * allocationRate;
  const net = gross - allocatedCost;

  // Trend by day
  const byDate = new Map<string, number>();
  transactions.forEach(txn => {
    const date = dayjs(txn.ts).format('YYYY-MM-DD');
    byDate.set(date, (byDate.get(date) || 0) + txn.fee);
  });

  const trend = Array.from(byDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ date, value }));

  return { gross, net, trend };
}

// ============= Term Deposit Calculations =============

export interface TermDepositData {
  ending: number;
  avg: number;
  trend: { date: string; value: number }[];
}

export function selectTermDeposit(
  snapshots: BalanceSnapshot[],
  companies: string[]
): TermDepositData {
  let filteredSnapshots = snapshots;

  if (companies.length > 0) {
    filteredSnapshots = snapshots.filter(s => companies.includes(s.companyId));
  }

  if (filteredSnapshots.length === 0) {
    return { ending: 0, avg: 0, trend: [] };
  }

  // Group by date
  const byDate = new Map<string, number[]>();
  filteredSnapshots.forEach(snapshot => {
    if (!byDate.has(snapshot.ts)) {
      byDate.set(snapshot.ts, []);
    }
    byDate.get(snapshot.ts)!.push(snapshot.termDepositEnd);
  });

  // Calculate avg and trend
  const trend: { date: string; value: number }[] = [];
  let totalSum = 0;
  let totalDays = 0;

  Array.from(byDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([date, values]) => {
      const daySum = values.reduce((sum, v) => sum + v, 0);
      trend.push({ date, value: daySum });
      totalSum += daySum;
      totalDays++;
    });

  const avg = totalDays > 0 ? totalSum / totalDays : 0;

  // Ending = latest day total
  const ending = trend.length > 0 ? trend[trend.length - 1].value : 0;

  return { ending, avg, trend };
}

// ============= New User Trend =============

export interface NewUserTrendData {
  total: number;
  trend: { date: string; value: number }[];
}

export function selectNewUserTrend(
  companyFirstSeen: CompanyFirstSeen[],
  startDate: string,
  endDate: string
): NewUserTrendData {
  const filteredCompanies = companyFirstSeen.filter(
    c => c.firstTxnDate >= startDate && c.firstTxnDate <= endDate
  );

  // Group by date
  const byDate = new Map<string, number>();
  filteredCompanies.forEach(c => {
    byDate.set(c.firstTxnDate, (byDate.get(c.firstTxnDate) || 0) + 1);
  });

  const trend = Array.from(byDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ date, value }));

  return {
    total: filteredCompanies.length,
    trend,
  };
}

// ============= Error Trend =============

export interface ErrorTrendData {
  total: number;
  errorRate: number;
  trend: { date: string; count: number; rate: number }[];
}

export function selectErrorTrend(transactions: Transaction[]): ErrorTrendData {
  const byDate = new Map<string, { total: number; errors: number }>();

  transactions.forEach(txn => {
    const date = dayjs(txn.ts).format('YYYY-MM-DD');
    if (!byDate.has(date)) {
      byDate.set(date, { total: 0, errors: 0 });
    }
    const data = byDate.get(date)!;
    data.total++;
    if (txn.status === 'FAILED' || txn.status === 'TIMEOUT') {
      data.errors++;
    }
  });

  const trend = Array.from(byDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, { total, errors }]) => ({
      date,
      count: errors,
      rate: total > 0 ? (errors / total) * 100 : 0,
    }));

  const totalErrors = transactions.filter(t => t.status === 'FAILED' || t.status === 'TIMEOUT').length;
  const errorRate = transactions.length > 0 ? (totalErrors / transactions.length) * 100 : 0;

  return {
    total: totalErrors,
    errorRate,
    trend,
  };
}

// ============= Calculate Delta (WoW/MoM) =============

export function calculateDelta(
  trend: { date: string; value: number }[],
  period: 'WoW' | 'MoM'
): { value: number; trend: 'up' | 'down' | 'neutral' } {
  if (trend.length < 2) {
    return { value: 0, trend: 'neutral' };
  }

  const daysAgo = period === 'WoW' ? 7 : 30;
  const latestValue = trend[trend.length - 1].value;
  const compareIndex = Math.max(0, trend.length - 1 - daysAgo);
  const compareValue = trend[compareIndex].value;

  if (compareValue === 0) {
    return { value: 0, trend: 'neutral' };
  }

  const delta = ((latestValue - compareValue) / compareValue) * 100;

  return {
    value: delta,
    trend: delta > 0.5 ? 'up' : delta < -0.5 ? 'down' : 'neutral',
  };
}

// ============= Build Enhanced KPI Cards =============

export function buildEnhancedKPICard(
  id: string,
  title: string,
  value: number,
  trend: { date: string; value: number }[],
  format: 'number' | 'currency' | 'percentage' | 'duration',
  tooltip: string,
  deltaPeriod: 'WoW' | 'MoM' = 'WoW'
): EnhancedKPICard {
  // Take last 30 days for sparkline
  const sparkline = trend.slice(-30);
  const delta = calculateDelta(trend, deltaPeriod);

  return {
    id,
    title,
    value,
    delta: {
      value: delta.value,
      period: deltaPeriod,
      trend: delta.trend,
    },
    sparkline,
    format,
    tooltip,
  };
}
