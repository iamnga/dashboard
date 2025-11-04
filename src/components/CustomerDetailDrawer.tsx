import { X, Pin, TrendingUp, DollarSign, BarChart3, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import dayjs from 'dayjs';

import { useDashboardStore, useFilteredTransactions, useFilteredBalanceSnapshots } from '../store/useDashboardStore';
import {
  calculateTotalTransactions, calculateTotalVolume, calculateSuccessRate,
  calculateAverageProcessTime, analyzeFailures
} from '../utils/businessLogic';
import { selectCasa, selectToi, selectTermDeposit } from '../utils/businessLogicV2';
import { formatCurrency, formatNumber, formatPercentage, getChannelColor } from '../lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function CustomerDetailDrawer() {
  const {
    selectedCompanyId,
    setSelectedCompany,
    pinnedCompanies,
    togglePinCompany,
    companies,
    contractPricing,
    allocationRate,
  } = useDashboardStore();

  const allTransactions = useFilteredTransactions();
  const allSnapshots = useFilteredBalanceSnapshots();

  const company = useMemo(() => {
    if (!selectedCompanyId) return null;
    return companies.find(c => c.id === selectedCompanyId) || null;
  }, [selectedCompanyId, companies]);

  const isPinned = selectedCompanyId ? pinnedCompanies.includes(selectedCompanyId) : false;

  // Filter data for this company only
  const transactions = useMemo(() => {
    return allTransactions.filter(t => t.companyId === selectedCompanyId);
  }, [allTransactions, selectedCompanyId]);

  const snapshots = useMemo(() => {
    return allSnapshots.filter(s => s.companyId === selectedCompanyId);
  }, [allSnapshots, selectedCompanyId]);

  // KPIs for this company
  const kpis = useMemo(() => {
    const totalTxn = calculateTotalTransactions(transactions);
    const totalVolume = calculateTotalVolume(transactions);
    const successRate = calculateSuccessRate(transactions);
    const avgProcessTime = calculateAverageProcessTime(transactions);

    const casaData = selectCasa(snapshots, []);
    const toiData = selectToi(transactions, contractPricing, allocationRate);
    const termDepositData = selectTermDeposit(snapshots, []);

    return {
      totalTxn,
      totalVolume,
      successRate,
      avgProcessTime,
      casa: casaData.avgDaily,
      toi: toiData.net,
      termDeposit: termDepositData.ending,
    };
  }, [transactions, snapshots, contractPricing, allocationRate]);

  // Channel distribution
  const channelData = useMemo(() => {
    const channelMap = new Map<string, number>();
    transactions.forEach(txn => {
      channelMap.set(txn.channel, (channelMap.get(txn.channel) || 0) + txn.amount);
    });
    return Array.from(channelMap.entries()).map(([name, value]) => ({
      name,
      value,
      color: getChannelColor(name),
    }));
  }, [transactions]);

  // Volume trend
  const volumeTrend = useMemo(() => {
    const byDate = new Map<string, number>();
    transactions.forEach(txn => {
      const date = dayjs(txn.ts).format('YYYY-MM-DD');
      byDate.set(date, (byDate.get(date) || 0) + txn.amount);
    });
    return Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30) // Last 30 days
      .map(([date, value]) => ({ date: dayjs(date).format('MM/DD'), value }));
  }, [transactions]);

  // Failure analysis
  const failures = useMemo(() => {
    return analyzeFailures(transactions).slice(0, 5);
  }, [transactions]);

  if (!selectedCompanyId || !company) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-screen w-full md:w-2/3 lg:w-1/2 bg-background border-l shadow-2xl z-50 overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur border-b p-4 flex items-center justify-between z-10">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{company.name}</h2>
            <p className="text-sm text-muted-foreground">Company ID: {company.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isPinned ? 'default' : 'outline'}
              size="sm"
              onClick={() => togglePinCompany(selectedCompanyId)}
            >
              <Pin className="h-4 w-4 mr-1" />
              {isPinned ? 'Pinned' : 'Pin'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedCompany(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* KPI Mini Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatNumber(kpis.totalTxn)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatCurrency(kpis.totalVolume)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatPercentage(kpis.successRate)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  CASA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatCurrency(kpis.casa)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Channel Distribution */}
          {channelData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Channel Distribution</CardTitle>
                <CardDescription>Volume by channel</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={channelData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => entry.name}
                    >
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Volume Trend */}
          {volumeTrend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Volume Trend (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={volumeTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="value" stroke="#1E88E5" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Failure Analysis */}
          {failures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Failure Reasons</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={failures} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="reason" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transactions.slice(0, 5).map((txn) => (
                  <div key={txn.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{txn.product}</p>
                      <p className="text-xs text-muted-foreground">
                        {dayjs(txn.ts).format('MMM DD, YYYY HH:mm')} • {txn.channel}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(txn.amount)}</p>
                      <Badge
                        variant={txn.status === 'SUCCESS' ? 'success' : 'destructive'}
                        className="text-xs"
                      >
                        {txn.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-40"
        onClick={() => setSelectedCompany(null)}
      />
    </AnimatePresence>
  );
}
