// Enums
export type Channel = "IB" | "MB" | "API" | "VA" | "QR" | "ERP";
export type Product = "Payroll" | "SocialInsurancePayout" | "Tuition" | "Payout" | "BillPayment" | "B2BTransfer" | "Remittance" | "TaxPayment";
export type TransactionStatus = "SUCCESS" | "TIMEOUT" | "FAILED";
export type CustomerType = "NEW" | "EXISTING";
export type MetricType = "TXN_COUNT" | "VOLUME" | "REVENUE" | "SUCCESS_RATE";
export type BadgeType = "GOLD" | "SILVER" | "API_CHAMPION" | "BRONZE";
export type NPSCategory = "PROMOTER" | "PASSIVE" | "DETRACTOR";

// Core Data Models
export interface Transaction {
  id: string;
  ts: string;            // ISO datetime
  companyId: string;
  channel: Channel;
  product: Product;
  amount: number;        // VND
  fee: number;           // VND
  status: TransactionStatus;
  processMs: number;     // Processing time in milliseconds
  reason?: string;       // Failure/timeout reason
  customerType: CustomerType;
}

export interface Company {
  id: string;
  name: string;
  casaAvg: number;       // Average CASA balance (VND)
  industry?: string;
  tier?: "ENTERPRISE" | "SME" | "STARTUP";
}

export interface KpiTarget {
  period: string;        // YYYY-MM format
  channel?: Channel;
  product?: Product;
  metric: MetricType;
  target: number;
}

export interface ApiMetric {
  ts: string;
  endpoint: string;
  method: string;
  requests: number;
  success: number;
  errors: number;
  p95ms: number;
  avgms: number;
  topError?: string;
}

export interface ContractPricing {
  companyId: string;
  product: Product;
  channel: Channel;
  unitFee: number;       // Fee per transaction (VND)
  variableRate?: number; // Variable fee rate (%)
  opsCost: number;       // Operational cost (VND)
  commission?: number;   // Commission amount (VND)
}

export interface Feedback {
  id: string;
  ts: string;
  companyId: string;
  nps: number;           // 0-10 scale
  comment?: string;
  channel?: Channel;
  product?: Product;
}

// Computed/Derived Types
export interface KPICard {
  id: string;
  title: string;
  value: string | number;
  change?: number;       // Percentage change
  trend?: "up" | "down" | "neutral";
  icon?: string;
  format?: "number" | "currency" | "percentage" | "duration";
}

export interface ChannelDistribution {
  channel: Channel;
  count: number;
  volume: number;
  percentage: number;
  color: string;
}

export interface TimeSeriesData {
  date: string;
  [key: string]: number | string;  // Dynamic channel/product values
}

export interface TargetComparison {
  period: string;
  channel?: Channel;
  product?: Product;
  metric: MetricType;
  actual: number;
  target: number;
  variance: number;      // actual - target
  status: "BELOW" | "ON_TARGET" | "ABOVE";  // Within ±2%
}

export interface FailureAnalysis {
  reason: string;
  count: number;
  percentage: number;
  trend?: number;        // WoW change
  suggestion?: string;
}

export interface LeaderboardEntry {
  companyId: string;
  companyName: string;
  volume: number;
  transactions: number;
  successRate: number;
  rank: number;
  badge?: BadgeType;
  change?: number;       // Rank change
}

export interface ForecastPoint {
  date: string;
  actual?: number;
  forecast: number;
  lower?: number;        // Confidence interval
  upper?: number;
}

export interface AnomalyAlert {
  id: string;
  ts: string;
  type: "ERROR_SPIKE" | "TIMEOUT_SPIKE" | "VOLUME_DROP" | "LATENCY_SPIKE";
  severity: "HIGH" | "MEDIUM" | "LOW";
  message: string;
  metric: string;
  value: number;
  zscore: number;
  channel?: Channel;
  product?: Product;
  suggestion?: string;
}

export interface ActionableInsight {
  id: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  category: "KPI" | "ERROR" | "ROI" | "CUSTOMER" | "API";
  title: string;
  description: string;
  impact?: string;
  action: string;
  assignee?: string;
  dueDate?: string;
  status?: "OPEN" | "IN_PROGRESS" | "COMPLETED";
}

export interface CustomerSegment {
  segment: string;
  customers: number;
  avgTransactions: number;
  avgVolume: number;
  digitalAdoption: number;  // Percentage
  growth?: number;           // Period over period
}

export interface ApiEndpointStats {
  endpoint: string;
  method: string;
  totalRequests: number;
  successRate: number;
  errorRate: number;
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
  topError?: string;
  errorCount: number;
}

export interface ROICalculation {
  entity: string;        // Company, Channel, or Product
  revenue: number;
  cost: number;
  profit: number;
  roi: number;           // (revenue - cost) / cost
  margin: number;        // profit / revenue
  trend?: number;        // Period over period
}

// Filter Types
export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface Filters {
  dateRange: DateRange;
  companies: string[];
  channels: Channel[];
  products: Product[];
  preset?: "MTD" | "Q1" | "Q2" | "Q3" | "Q4" | "YTD" | "30D" | "90D" | "CUSTOM";
}

// Store State
export interface DashboardState {
  // Data
  transactions: Transaction[];
  companies: Company[];
  kpiTargets: KpiTarget[];
  apiMetrics: ApiMetric[];
  contractPricing: ContractPricing[];
  feedbacks: Feedback[];

  // Filters
  filters: Filters;

  // UI State
  isLoading: boolean;
  theme: "light" | "dark";

  // Actions
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
  refreshData: () => void;
}
