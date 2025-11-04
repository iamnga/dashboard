import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import {
  TrendingUp, DollarSign, Activity,
  Award, AlertTriangle, BarChart3, Download,
  RefreshCw, Sun, Moon, Filter, ChevronDown, Crown,
  Medal, Trophy, Star
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie,
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';

import { useDashboardStore, useFilteredTransactions, useFilteredFeedbacks } from './store/useDashboardStore';
import {
  calculateTotalTransactions, calculateTotalVolume, calculateTotalRevenue,
  calculateUniqueCustomers, calculateNewCustomers, calculateAverageCASA,
  calculateSuccessRate, calculateAverageProcessTime, calculateNPS, getNPSCategory,
  calculateLeaderboard, detectAnomalies, forecastTimeSeries, analyzeFailures,
  calculateROI
} from './utils/businessLogic';
import { formatCurrency, formatNumber, formatPercentage, formatDuration, getChannelColor, getBadgeColor } from './lib/utils';
import { exportToCSV } from './utils/export';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';

import type { Channel } from './types';

function App() {
  const { filters, setFilters, resetFilters, theme, toggleTheme, companies, contractPricing } = useDashboardStore();
  const transactions = useFilteredTransactions();
  const feedbacks = useFilteredFeedbacks();

  const [showFilters, setShowFilters] = useState(false);

  // ============= KPI Calculations =============
  const kpis = useMemo(() => {
    const totalTxn = calculateTotalTransactions(transactions);
    const totalVolume = calculateTotalVolume(transactions);
    const totalRevenue = calculateTotalRevenue(transactions);
    const uniqueCustomers = calculateUniqueCustomers(transactions);
    const newCustomers = calculateNewCustomers(transactions);
    const activeCompanyIds = new Set(transactions.map(t => t.companyId));
    const avgCASA = calculateAverageCASA(companies, activeCompanyIds);
    const successRate = calculateSuccessRate(transactions);
    const avgProcessTime = calculateAverageProcessTime(transactions);

    return {
      totalTxn,
      totalVolume,
      totalRevenue,
      uniqueCustomers,
      newCustomers,
      avgCASA,
      successRate,
      avgProcessTime,
    };
  }, [transactions, companies]);

  // ============= Channel Distribution =============
  const channelData = useMemo(() => {
    const channelMap = new Map<Channel, { count: number; volume: number }>();

    transactions.forEach(txn => {
      if (!channelMap.has(txn.channel)) {
        channelMap.set(txn.channel, { count: 0, volume: 0 });
      }
      const data = channelMap.get(txn.channel)!;
      data.count += 1;
      data.volume += txn.amount;
    });

    return Array.from(channelMap.entries()).map(([channel, data]) => ({
      name: channel,
      value: data.count,
      volume: data.volume,
      color: getChannelColor(channel),
    }));
  }, [transactions]);

  // ============= Time Series Data =============
  const timeSeriesData = useMemo(() => {
    const dailyMap = new Map<string, Record<Channel, number>>();

    transactions.forEach(txn => {
      const date = dayjs(txn.ts).format('YYYY-MM-DD');
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {} as Record<Channel, number>);
      }
      const dayData = dailyMap.get(date)!;
      dayData[txn.channel] = (dayData[txn.channel] || 0) + txn.amount;
    });

    return Array.from(dailyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, channels]) => ({
        date: dayjs(date).format('MM/DD'),
        ...channels,
      }));
  }, [transactions]);

  // ============= Failure Analysis =============
  const failureData = useMemo(() => {
    return analyzeFailures(transactions).slice(0, 8);
  }, [transactions]);

  // ============= Leaderboard =============
  const leaderboard = useMemo(() => {
    return calculateLeaderboard(transactions, companies).slice(0, 10);
  }, [transactions, companies]);

  // ============= Anomaly Detection =============
  const anomalies = useMemo(() => {
    return detectAnomalies(transactions, 30, 3);
  }, [transactions]);

  // ============= Forecasting =============
  const forecastData = useMemo(() => {
    if (transactions.length < 7) return [];
    return forecastTimeSeries(transactions, 'volume', 7, 'day');
  }, [transactions]);

  // ============= NPS =============
  const npsScore = useMemo(() => {
    return calculateNPS(feedbacks);
  }, [feedbacks]);

  // ============= ROI =============
  const roiData = useMemo(() => {
    if (contractPricing.length === 0) return [];
    return calculateROI(transactions, contractPricing, 'channel').slice(0, 6);
  }, [transactions, contractPricing]);

  // ============= Status Distribution =============
  // const statusData = useMemo(() => {
  //   const statusMap = new Map<string, number>();
  //   transactions.forEach(txn => {
  //     statusMap.set(txn.status, (statusMap.get(txn.status) || 0) + 1);
  //   });
  //   return Array.from(statusMap.entries()).map(([status, count]) => ({
  //     name: status,
  //     value: count,
  //     color: getStatusColor(status),
  //   }));
  // }, [transactions]);

  // ============= API Metrics (simulated from transactions) =============
  const apiMetrics = useMemo(() => {
    const apiTxns = transactions.filter(txn => txn.channel === 'API');
    const endpoints = new Map<string, { total: number; success: number; latencies: number[] }>();

    apiTxns.forEach(txn => {
      const endpoint = `/api/v1/${txn.product.toLowerCase()}`;
      if (!endpoints.has(endpoint)) {
        endpoints.set(endpoint, { total: 0, success: 0, latencies: [] });
      }
      const data = endpoints.get(endpoint)!;
      data.total += 1;
      if (txn.status === 'SUCCESS') data.success += 1;
      data.latencies.push(txn.processMs);
    });

    return Array.from(endpoints.entries()).map(([endpoint, data]) => {
      const sortedLatencies = [...data.latencies].sort((a, b) => a - b);
      const p95Index = Math.floor(sortedLatencies.length * 0.95);
      return {
        endpoint,
        requests: data.total,
        successRate: (data.success / data.total) * 100,
        p95: sortedLatencies[p95Index] || 0,
        avgLatency: data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length,
      };
    }).slice(0, 6);
  }, [transactions]);

  // ============= Filter Presets =============
  const applyPreset = (preset: string) => {
    let end = dayjs();
    let start = end;

    switch (preset) {
      case 'MTD':
        start = end.startOf('month');
        break;
      case 'Q1':
        start = dayjs().month(0).startOf('month');
        end = dayjs().month(2).endOf('month');
        break;
      case 'Q2':
        start = dayjs().month(3).startOf('month');
        end = dayjs().month(5).endOf('month');
        break;
      case 'Q3':
        start = dayjs().month(6).startOf('month');
        end = dayjs().month(8).endOf('month');
        break;
      case 'Q4':
        start = dayjs().month(9).startOf('month');
        end = dayjs().month(11).endOf('month');
        break;
      case 'YTD':
        start = end.startOf('year');
        break;
      case '30D':
        start = end.subtract(30, 'day');
        break;
      case '90D':
        start = end.subtract(90, 'day');
        break;
    }

    setFilters({
      dateRange: {
        startDate: start.format('YYYY-MM-DD'),
        endDate: end.format('YYYY-MM-DD'),
      },
      preset: preset as any,
    });
  };

  // ============= Export Handlers =============
  const handleExportCSV = () => {
    exportToCSV(transactions, 'transactions_export');
  };

  return (
    <div id="dashboard-root" className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl">
              VIB
            </div>
            <div>
              <h1 className="text-xl font-bold">Digital Banking Dashboard</h1>
              <p className="text-xs text-muted-foreground">Transaction Analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Filters
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => useDashboardStore.getState().refreshData()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t bg-muted/50 px-4 py-3"
          >
            <div className="container">
              <div className="flex flex-wrap gap-2 mb-3">
                <p className="text-sm font-medium w-full mb-1">Time Presets:</p>
                {['MTD', '30D', '90D', 'Q1', 'Q2', 'Q3', 'Q4', 'YTD'].map(preset => (
                  <Button
                    key={preset}
                    variant={filters.preset === preset ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => applyPreset(preset)}
                  >
                    {preset}
                  </Button>
                ))}
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Reset
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Period: {dayjs(filters.dateRange.startDate).format('MMM DD, YYYY')} - {dayjs(filters.dateRange.endDate).format('MMM DD, YYYY')}
                {' • '}
                {transactions.length.toLocaleString()} transactions
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(kpis.totalTxn)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.newCustomers} new customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(kpis.totalVolume)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg CASA: {formatCurrency(kpis.avgCASA)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Service Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(kpis.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                From {kpis.uniqueCustomers} customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(kpis.successRate)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg time: {formatDuration(kpis.avgProcessTime)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Anomaly Alerts */}
        {anomalies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                  Anomaly Alerts Detected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {anomalies.map(alert => (
                    <div key={alert.id} className="flex items-start gap-3 p-3 bg-background rounded-lg">
                      <Badge variant={alert.severity === 'HIGH' ? 'destructive' : 'warning'}>
                        {alert.severity}
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Z-score: {alert.zscore.toFixed(2)} • {alert.suggestion}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Charts Row 1: Channel Distribution & Time Series */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Channel Distribution</CardTitle>
              <CardDescription>Transaction volume by channel</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={channelData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.name}: ${formatPercentage((entry.value / kpis.totalTxn) * 100, 1)}`}
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatNumber(value)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaction Trends</CardTitle>
              <CardDescription>Daily volume by channel</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeSeriesData.slice(-30)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  {['IB', 'MB', 'API', 'VA', 'QR', 'ERP'].map(channel => (
                    <Area
                      key={channel}
                      type="monotone"
                      dataKey={channel}
                      stackId="1"
                      stroke={getChannelColor(channel)}
                      fill={getChannelColor(channel)}
                      fillOpacity={0.6}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard & Failure Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Leaderboard & Gamification
              </CardTitle>
              <CardDescription>Top performing companies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <div key={entry.companyId} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold text-sm">
                      {entry.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{entry.companyName}</p>
                        {entry.badge && (
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{ backgroundColor: getBadgeColor(entry.badge) + '20', color: getBadgeColor(entry.badge) }}
                          >
                            {entry.badge === 'GOLD' && <Crown className="h-3 w-3 mr-1" />}
                            {entry.badge === 'SILVER' && <Medal className="h-3 w-3 mr-1" />}
                            {entry.badge === 'API_CHAMPION' && <Award className="h-3 w-3 mr-1" />}
                            {entry.badge.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{formatCurrency(entry.volume)}</span>
                        <span>•</span>
                        <span>{formatPercentage(entry.successRate)} success</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Failure Analysis</CardTitle>
              <CardDescription>Top reasons for failed/timeout transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={failureData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="reason" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Forecasting */}
        {forecastData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Volume Forecast</CardTitle>
              <CardDescription>7-day forecast based on linear regression</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={forecastData.slice(-30)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#1E88E5"
                    strokeWidth={2}
                    name="Actual"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#43A047"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Forecast"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* API Analytics */}
        {apiMetrics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>API Analytics</CardTitle>
              <CardDescription>Endpoint performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium">Endpoint</th>
                      <th className="text-right py-2 px-3 font-medium">Requests</th>
                      <th className="text-right py-2 px-3 font-medium">Success Rate</th>
                      <th className="text-right py-2 px-3 font-medium">Avg Latency</th>
                      <th className="text-right py-2 px-3 font-medium">P95</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiMetrics.map((metric, index) => (
                      <tr key={index} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-2 px-3 font-mono text-xs">{metric.endpoint}</td>
                        <td className="text-right py-2 px-3">{formatNumber(metric.requests)}</td>
                        <td className="text-right py-2 px-3">
                          <Badge variant={metric.successRate > 95 ? 'success' : 'warning'}>
                            {formatPercentage(metric.successRate)}
                          </Badge>
                        </td>
                        <td className="text-right py-2 px-3">{formatDuration(metric.avgLatency)}</td>
                        <td className="text-right py-2 px-3">
                          <span className={metric.p95 > 500 ? 'text-red-500 font-medium' : ''}>
                            {formatDuration(metric.p95)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ROI & NPS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {roiData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>ROI by Channel</CardTitle>
                <CardDescription>Return on investment analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {roiData.map((roi, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: getChannelColor(roi.entity) }}
                      >
                        {roi.entity}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{roi.entity}</span>
                          <span className={`font-bold ${roi.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(roi.roi)} ROI
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>Revenue: {formatCurrency(roi.revenue)}</span>
                          <span>•</span>
                          <span>Cost: {formatCurrency(roi.cost)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                Customer Feedback (NPS)
              </CardTitle>
              <CardDescription>{feedbacks.length} feedback entries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Net Promoter Score</span>
                  <span className={`text-3xl font-bold ${npsScore > 50 ? 'text-green-600' : npsScore > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                    {formatNumber(npsScore, 1)}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${npsScore > 50 ? 'bg-green-500' : npsScore > 0 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.max(0, Math.min(100, (npsScore + 100) / 2))}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {feedbacks.slice(0, 5).map((feedback) => {
                  const category = getNPSCategory(feedback.nps);
                  return (
                    <div key={feedback.id} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={category === 'PROMOTER' ? 'success' : category === 'PASSIVE' ? 'warning' : 'destructive'}
                          className="text-xs"
                        >
                          {category} ({feedback.nps}/10)
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {dayjs(feedback.ts).format('MMM DD, YYYY')}
                        </span>
                      </div>
                      {feedback.comment && (
                        <p className="text-sm text-muted-foreground">{feedback.comment}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground py-6 border-t">
          <p>VIB Digital Banking Dashboard v1.0.0 • Demo Application with Mock Data</p>
          <p className="mt-1">⚠️ All data is simulated for demonstration purposes only</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
