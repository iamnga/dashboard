import dayjs from 'dayjs';
import type {
  Transaction,
  Company,
  KpiTarget,
  ApiMetric,
  ContractPricing,
  Feedback,
  Channel,
  Product,
  TransactionStatus,
} from '../types';

// Constants
const CHANNELS: Channel[] = ["IB", "MB", "API", "VA", "QR", "ERP"];
const PRODUCTS: Product[] = [
  "Payroll",
  "SocialInsurancePayout",
  "Tuition",
  "Payout",
  "BillPayment",
  "B2BTransfer",
  "Remittance",
  "TaxPayment"
];

const FAILURE_REASONS = [
  "Insufficient balance",
  "Invalid account number",
  "Network timeout",
  "Service unavailable",
  "Validation error",
  "Duplicate transaction",
  "Daily limit exceeded",
  "Beneficiary bank offline"
];

const API_ENDPOINTS = [
  "/api/v1/transfer",
  "/api/v1/payroll/batch",
  "/api/v1/balance/inquiry",
  "/api/v1/statement",
  "/api/v1/beneficiary/add",
  "/api/v1/qr/generate",
  "/api/v1/payment/verify",
  "/api/v1/transaction/status"
];

// Utility functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateNormalRandom(mean: number, stdDev: number): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * stdDev + mean;
}

// Generate Companies
export function generateCompanies(): Company[] {
  const companyNames = [
    "VinGroup",
    "FPT Corporation",
    "Viettel Group",
    "Masan Group",
    "Hoa Phat Group",
    "Mobile World",
    "Vinamilk",
    "Techcombank Staff",
    "Biti's",
    "Saigon Co.op",
    "TNG Holdings",
    "Dien Quang"
  ];

  return companyNames.map((name, index) => ({
    id: `COMP${String(index + 1).padStart(3, '0')}`,
    name,
    casaAvg: randomFloat(500000000, 50000000000, 0), // 500M to 50B VND
    industry: randomChoice(["Manufacturing", "Retail", "Technology", "Services", "Finance"]),
    tier: randomChoice(["ENTERPRISE", "SME", "STARTUP"] as const),
  }));
}

// Generate Transactions
export function generateTransactions(companies: Company[], numTransactions: number = 80000): Transaction[] {
  const transactions: Transaction[] = [];
  const endDate = dayjs();
  const startDate = endDate.subtract(90, 'day');

  for (let i = 0; i < numTransactions; i++) {
    const channel = randomChoice(CHANNELS);
    const product = randomChoice(PRODUCTS);

    // Different success rates by channel
    const successRates: Record<Channel, number> = {
      IB: 0.97,
      MB: 0.96,
      API: 0.94,
      VA: 0.98,
      QR: 0.95,
      ERP: 0.93,
    };

    const rand = Math.random();
    let status: TransactionStatus;
    const successRate = successRates[channel];

    if (rand < successRate) {
      status = "SUCCESS";
    } else if (rand < successRate + 0.02) {
      status = "TIMEOUT";
    } else {
      status = "FAILED";
    }

    // Generate timestamp with business hours bias
    const daysAgo = randomInt(0, 90);
    const hour = Math.abs(Math.round(generateNormalRandom(12, 4))) % 24; // Peak around noon
    const minute = randomInt(0, 59);
    const second = randomInt(0, 59);

    const ts = startDate
      .add(daysAgo, 'day')
      .hour(hour)
      .minute(minute)
      .second(second)
      .toISOString();

    // Amount varies by product type
    let amount: number;
    if (product === "Payroll") {
      amount = randomFloat(5000000, 50000000, 0); // 5M-50M per payroll
    } else if (product === "B2BTransfer") {
      amount = randomFloat(100000000, 5000000000, 0); // 100M-5B
    } else if (product === "BillPayment") {
      amount = randomFloat(100000, 10000000, 0); // 100K-10M
    } else {
      amount = randomFloat(1000000, 100000000, 0); // 1M-100M
    }

    // Fee calculation (0.05% - 0.2% of amount)
    const feeRate = randomFloat(0.0005, 0.002, 6);
    const fee = Math.round(amount * feeRate);

    // Processing time varies by channel and status
    let processMs: number;
    if (status === "SUCCESS") {
      if (channel === "API") {
        processMs = randomInt(200, 800);
      } else if (channel === "IB" || channel === "MB") {
        processMs = randomInt(100, 500);
      } else {
        processMs = randomInt(150, 600);
      }
    } else if (status === "TIMEOUT") {
      processMs = randomInt(5000, 30000); // 5-30 seconds
    } else {
      processMs = randomInt(50, 300);
    }

    // Add latency spike during peak hours (9-11, 14-16)
    if (hour >= 9 && hour <= 11 || hour >= 14 && hour <= 16) {
      processMs = Math.round(processMs * randomFloat(1.2, 2.5));
    }

    transactions.push({
      id: `TXN${String(i + 1).padStart(8, '0')}`,
      ts,
      companyId: randomChoice(companies).id,
      channel,
      product,
      amount,
      fee,
      status,
      processMs,
      reason: status !== "SUCCESS" ? randomChoice(FAILURE_REASONS) : undefined,
      customerType: Math.random() < 0.15 ? "NEW" : "EXISTING", // 15% new customers
    });
  }

  return transactions.sort((a, b) => a.ts.localeCompare(b.ts));
}

// Generate KPI Targets
export function generateKpiTargets(): KpiTarget[] {
  const targets: KpiTarget[] = [];
  const currentMonth = dayjs();

  // Generate targets for last 6 months
  for (let i = 0; i < 6; i++) {
    const period = currentMonth.subtract(i, 'month').format('YYYY-MM');

    // Overall targets
    targets.push(
      {
        period,
        metric: "TXN_COUNT",
        target: randomInt(8000, 12000),
      },
      {
        period,
        metric: "VOLUME",
        target: randomFloat(50000000000, 80000000000, 0), // 50-80B VND
      },
      {
        period,
        metric: "REVENUE",
        target: randomFloat(200000000, 400000000, 0), // 200-400M VND
      },
      {
        period,
        metric: "SUCCESS_RATE",
        target: 96.5,
      }
    );

    // Per-channel targets
    CHANNELS.forEach(channel => {
      targets.push({
        period,
        channel,
        metric: "TXN_COUNT",
        target: randomInt(1000, 3000),
      });
    });

    // Per-product targets
    PRODUCTS.slice(0, 4).forEach(product => {
      targets.push({
        period,
        product,
        metric: "VOLUME",
        target: randomFloat(5000000000, 15000000000, 0),
      });
    });
  }

  return targets;
}

// Generate API Metrics
export function generateApiMetrics(): ApiMetric[] {
  const metrics: ApiMetric[] = [];
  const endDate = dayjs();
  const startDate = endDate.subtract(90, 'day');

  // Generate hourly metrics for last 90 days
  for (let day = 0; day < 90; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const ts = startDate.add(day, 'day').hour(hour).minute(0).second(0).toISOString();

      API_ENDPOINTS.forEach(endpoint => {
        const requests = randomInt(50, 500);
        const errorRate = randomFloat(0.01, 0.08); // 1-8% error rate
        const errors = Math.round(requests * errorRate);
        const success = requests - errors;

        // Higher latency during peak hours
        let baseLatency = randomInt(100, 300);
        if (hour >= 9 && hour <= 11 || hour >= 14 && hour <= 16) {
          baseLatency = Math.round(baseLatency * randomFloat(1.5, 3));
        }

        metrics.push({
          ts,
          endpoint,
          method: endpoint.includes('inquiry') ? 'GET' : 'POST',
          requests,
          success,
          errors,
          p95ms: Math.round(baseLatency * randomFloat(1.8, 2.5)),
          avgms: baseLatency,
          topError: errors > 0 ? randomChoice([
            "Connection timeout",
            "Invalid token",
            "Rate limit exceeded",
            "Internal server error",
            "Bad request"
          ]) : undefined,
        });
      });
    }
  }

  return metrics;
}

// Generate Contract Pricing
export function generateContractPricing(companies: Company[]): ContractPricing[] {
  const pricing: ContractPricing[] = [];

  companies.forEach(company => {
    // Each company has pricing for 2-4 products across 1-3 channels
    const numProducts = randomInt(2, 4);
    const selectedProducts = PRODUCTS.slice(0, numProducts);

    selectedProducts.forEach(product => {
      const numChannels = randomInt(1, 3);
      const selectedChannels = CHANNELS.slice(0, numChannels);

      selectedChannels.forEach(channel => {
        pricing.push({
          companyId: company.id,
          product,
          channel,
          unitFee: randomFloat(1000, 15000, 0), // 1K-15K VND per txn
          variableRate: Math.random() < 0.3 ? randomFloat(0.05, 0.15, 3) : undefined,
          opsCost: randomFloat(500, 8000, 0), // 500-8K VND per txn
          commission: Math.random() < 0.4 ? randomFloat(200, 3000, 0) : undefined,
        });
      });
    });
  });

  return pricing;
}

// Generate Feedback
export function generateFeedbacks(companies: Company[]): Feedback[] {
  const feedbacks: Feedback[] = [];
  const endDate = dayjs();
  const startDate = endDate.subtract(90, 'day');

  const comments = [
    "Dịch vụ nhanh chóng và tiện lợi",
    "Cần cải thiện tốc độ xử lý",
    "Giao diện thân thiện, dễ sử dụng",
    "Thỉnh thoảng gặp lỗi timeout",
    "Hỗ trợ khách hàng tốt",
    "Phí dịch vụ hợp lý",
    "API documentation cần chi tiết hơn",
    "Tính năng đầy đủ cho doanh nghiệp",
    "Cần thêm báo cáo phân tích",
    "Rất hài lòng với dịch vụ",
  ];

  // Generate 200-300 feedback entries
  const numFeedbacks = randomInt(200, 300);

  for (let i = 0; i < numFeedbacks; i++) {
    const daysAgo = randomInt(0, 90);
    const ts = startDate.add(daysAgo, 'day').toISOString();

    // NPS distribution: slightly right-skewed (more promoters)
    let nps: number;
    const rand = Math.random();
    if (rand < 0.5) {
      nps = randomInt(9, 10); // Promoters: 50%
    } else if (rand < 0.75) {
      nps = randomInt(7, 8); // Passives: 25%
    } else {
      nps = randomInt(0, 6); // Detractors: 25%
    }

    feedbacks.push({
      id: `FB${String(i + 1).padStart(6, '0')}`,
      ts,
      companyId: randomChoice(companies).id,
      nps,
      comment: Math.random() < 0.6 ? randomChoice(comments) : undefined,
      channel: Math.random() < 0.7 ? randomChoice(CHANNELS) : undefined,
      product: Math.random() < 0.6 ? randomChoice(PRODUCTS) : undefined,
    });
  }

  return feedbacks.sort((a, b) => b.ts.localeCompare(a.ts)); // Most recent first
}

// Generate all mock data
export function generateAllMockData() {
  console.log('Generating mock data...');

  const companies = generateCompanies();
  console.log(`✓ Generated ${companies.length} companies`);

  const transactions = generateTransactions(companies, 80000);
  console.log(`✓ Generated ${transactions.length} transactions`);

  const kpiTargets = generateKpiTargets();
  console.log(`✓ Generated ${kpiTargets.length} KPI targets`);

  const apiMetrics = generateApiMetrics();
  console.log(`✓ Generated ${apiMetrics.length} API metrics`);

  const contractPricing = generateContractPricing(companies);
  console.log(`✓ Generated ${contractPricing.length} contract pricing records`);

  const feedbacks = generateFeedbacks(companies);
  console.log(`✓ Generated ${feedbacks.length} feedbacks`);

  return {
    companies,
    transactions,
    kpiTargets,
    apiMetrics,
    contractPricing,
    feedbacks,
  };
}
