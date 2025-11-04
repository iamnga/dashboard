import { create } from 'zustand';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import type { DashboardState, Filters } from '../types';
import { generateAllMockData } from '../mock/generate';

dayjs.extend(isBetween);

// Initialize with default filters
const getDefaultFilters = (): Filters => {
  const endDate = dayjs();
  const startDate = endDate.subtract(30, 'day');

  return {
    dateRange: {
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
    },
    companies: [],
    channels: [],
    products: [],
    preset: '30D',
  };
};

// Generate mock data once
const mockData = generateAllMockData();

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Data
  transactions: mockData.transactions,
  companies: mockData.companies,
  kpiTargets: mockData.kpiTargets,
  apiMetrics: mockData.apiMetrics,
  contractPricing: mockData.contractPricing,
  feedbacks: mockData.feedbacks,

  // Filters
  filters: getDefaultFilters(),

  // UI State
  isLoading: false,
  theme: 'light',

  // Actions
  setFilters: (newFilters: Partial<Filters>) => {
    set((state) => ({
      filters: {
        ...state.filters,
        ...newFilters,
      },
    }));
  },

  resetFilters: () => {
    set({ filters: getDefaultFilters() });
  },

  setTheme: (theme: 'light' | 'dark') => {
    set({ theme });
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  toggleTheme: () => {
    const currentTheme = get().theme;
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    get().setTheme(newTheme);
  },

  refreshData: () => {
    set({ isLoading: true });
    // Simulate data refresh
    setTimeout(() => {
      const newData = generateAllMockData();
      set({
        transactions: newData.transactions,
        companies: newData.companies,
        kpiTargets: newData.kpiTargets,
        apiMetrics: newData.apiMetrics,
        contractPricing: newData.contractPricing,
        feedbacks: newData.feedbacks,
        isLoading: false,
      });
    }, 1000);
  },
}));

// Selectors
export const useFilteredTransactions = () => {
  const { transactions, filters } = useDashboardStore();

  return transactions.filter((txn) => {
    const txnDate = dayjs(txn.ts);
    const { startDate, endDate } = filters.dateRange;

    // Date filter
    if (!txnDate.isBetween(startDate, endDate, 'day', '[]')) {
      return false;
    }

    // Company filter
    if (filters.companies.length > 0 && !filters.companies.includes(txn.companyId)) {
      return false;
    }

    // Channel filter
    if (filters.channels.length > 0 && !filters.channels.includes(txn.channel)) {
      return false;
    }

    // Product filter
    if (filters.products.length > 0 && !filters.products.includes(txn.product)) {
      return false;
    }

    return true;
  });
};

export const useFilteredFeedbacks = () => {
  const { feedbacks, filters } = useDashboardStore();

  return feedbacks.filter((feedback) => {
    const feedbackDate = dayjs(feedback.ts);
    const { startDate, endDate } = filters.dateRange;

    // Date filter
    if (!feedbackDate.isBetween(startDate, endDate, 'day', '[]')) {
      return false;
    }

    // Company filter
    if (filters.companies.length > 0 && !filters.companies.includes(feedback.companyId)) {
      return false;
    }

    // Channel filter
    if (feedback.channel && filters.channels.length > 0 && !filters.channels.includes(feedback.channel)) {
      return false;
    }

    // Product filter
    if (feedback.product && filters.products.length > 0 && !filters.products.includes(feedback.product)) {
      return false;
    }

    return true;
  });
};

export const useFilteredApiMetrics = () => {
  const { apiMetrics, filters } = useDashboardStore();

  return apiMetrics.filter((metric) => {
    const metricDate = dayjs(metric.ts);
    const { startDate, endDate } = filters.dateRange;

    return metricDate.isBetween(startDate, endDate, 'day', '[]');
  });
};
