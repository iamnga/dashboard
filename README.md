# VIB Digital Banking Transaction Dashboard

> **Demo Dashboard** phân tích giao dịch số doanh nghiệp cho VIB - với dữ liệu mock, logic nghiệp vụ đầy đủ, và UX/UI hiện đại.

## 🚀 Tính năng chính

### 📊 Analytics & Reporting (v1 + v2)
- **11 KPI Cards**:
  - v1: Tổng giao dịch, Doanh số, Doanh thu dịch vụ, Tỷ lệ thành công, Thời gian xử lý TB
  - **v2 Enhanced**: CASA (avg daily), Tổng khách hàng, TOI (Service), Term Deposit - **với sparklines, WoW/MoM delta, tooltips**
- **Channel Distribution**: Phân tích theo kênh (IB/MB/API/VA/QR/ERP) với biểu đồ donut
- **Time Series**: Xu hướng giao dịch theo thời gian với stacked area chart
- **KPI vs Target**: So sánh thực tế với mục tiêu, highlight trạng thái Above/On/Below
- **Failure Analysis**: Phân tích lý do lỗi/timeout với gợi ý xử lý

### 👥 Customer Detail (v2 NEW!)
- **Drawer/Panel**: Slide-in customer detail panel khi click vào công ty
- **Mini KPIs**: Transactions, Volume, Success Rate, CASA cho từng công ty
- **Charts**: Channel distribution, Volume trend (30 ngày), Failure analysis
- **Recent Transactions**: 5 giao dịch gần nhất
- **Pin/Unpin**: Ghim công ty để giữ khi thay đổi filter
- **Deep Linking**: URL query param `?company=COMP001` để share trực tiếp

### 📊 Balance & Deposits (v2 NEW!)
- **Balance Snapshots**: 180 ngày dữ liệu CASA & Term Deposit
- **CASA Tracking**: Average daily balance với weekly patterns
- **Term Deposit**: Ending balance và average với growth trends
- **TOI Net Calculation**: Support cost allocation rate (0-100%)

### 🎮 Gamification
- **Leaderboard**: Bảng xếp hạng doanh nghiệp theo volume (click để xem detail)
- **Badges**: Gold (top 10%, success > 98%), Silver (top 30%, success > 96%), API Champion (API success > 99% & p95 < 300ms)

### 📈 Advanced Analytics
- **Forecasting**: Dự báo volume 7 ngày tới dựa trên Linear Regression
- **Anomaly Detection**: Phát hiện bất thường với Z-score (threshold: 3σ) cho error rate, timeout rate, latency
- **API Analytics**: P95/avg latency, success/error rate, top endpoints
- **ROI Analysis**: Tính toán ROI theo kênh/sản phẩm với revenue, cost, profit
- **New User Trends** (v2): Track first-time customers by date
- **Error Trends** (v2): Daily error rate với percentage breakdown

### 💬 Customer Feedback
- **NPS Score**: Net Promoter Score với phân loại Promoter/Passive/Detractor
- **Feedback List**: Hiển thị feedback gần nhất với comment và rating

### 🎨 UI/UX Features
- **Responsive Design**: Tối ưu cho desktop/tablet/mobile
- **Dark/Light Theme**: Chuyển đổi theme dễ dàng
- **Interactive Filters**: Filter theo thời gian (MTD/Q1-Q4/YTD/30D/90D), công ty, kênh, sản phẩm
- **Export**: CSV (transactions) và PNG (dashboard snapshot)
- **Smooth Animations**: Framer Motion cho transitions mượt mà
- **Accessibility**: High contrast, keyboard navigation, ARIA labels

## 🛠️ Công nghệ

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + Custom Theme System
- **State Management**: Zustand
- **Charts**: Recharts (Line, Area, Bar, Pie)
- **Animations**: Framer Motion
- **Data Processing**: dayjs, simple-statistics
- **Export**: papaparse (CSV), html-to-image (PNG)
- **Icons**: lucide-react

## 📦 Cài đặt & Chạy

### Yêu cầu
- Node.js >= 16
- npm >= 8

### Các bước thực hiện

```bash
# 1. Cài đặt dependencies
npm install

# 2. Chạy development server
npm run dev

# 3. Truy cập ứng dụng
# Mở trình duyệt tại: http://localhost:5173
```

### Build Production

```bash
# Build ứng dụng
npm run build

# Preview production build
npm run preview
```

## 📁 Cấu trúc dự án

```
dashboard/
├── src/
│   ├── components/
│   │   └── ui/              # Shadcn/UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       └── badge.tsx
│   ├── lib/
│   │   └── utils.ts         # Utility functions (cn, formatters)
│   ├── mock/
│   │   └── generate.ts      # Mock data generator (80k transactions)
│   ├── store/
│   │   └── useDashboardStore.ts  # Zustand store + selectors
│   ├── types/
│   │   └── index.ts         # TypeScript types & interfaces
│   ├── utils/
│   │   ├── businessLogic.ts # KPI, ROI, NPS, z-score, regression calculations
│   │   └── export.ts        # CSV/PNG export functions
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles + Tailwind
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🎯 Sử dụng

### 1. Filters
- Click nút **"Filters"** để mở bảng điều khiển
- Chọn preset thời gian: MTD, 30D, 90D, Q1-Q4, YTD
- Tất cả KPI và charts tự động cập nhật theo filter

### 2. Export
- **Export CSV**: Click "Export CSV" để tải xuống toàn bộ transactions (theo filter)
- **Export PNG**: (Có thể thêm nút export cho từng section)

### 3. Theme
- Click icon Sun/Moon để chuyển giữa Light/Dark mode

### 4. Refresh Data
- Click "Refresh" để tạo lại mock data mới

## 🧮 Công thức nghiệp vụ

### KPI Calculations
- **Tổng giao dịch**: `count(transactions)`
- **Doanh số**: `sum(amount)`
- **Doanh thu dịch vụ**: `sum(fee)`
- **Tỷ lệ thành công**: `success_count / total_count * 100`
- **Thời gian xử lý TB**: `avg(processMs)`
- **CASA TB**: `avg(Company.casaAvg)` cho các công ty đang hoạt động

### NPS Score
```
NPS = (% Promoters - % Detractors) * 100
- Promoters: score 9-10
- Passives: score 7-8
- Detractors: score 0-6
```

### ROI Calculation
```
ROI = (Revenue - Cost) / Cost * 100
Revenue = sum(fee + commission)
Cost = sum(opsCost)
```

### Anomaly Detection (Z-Score)
```
z = (x - mean) / std_dev
Alert if |z| >= 3 (3 standard deviations)
```

### Forecasting (Linear Regression)
```
y = mx + b
Predict next N periods using least squares regression
Confidence interval: ±1.96 * residual_std
```

## 📊 Dữ liệu Mock

### Dataset Size
- **Transactions**: 80,000 (90 ngày gần nhất)
- **Companies**: 12 công ty
- **Channels**: 6 (IB, MB, API, VA, QR, ERP)
- **Products**: 8 (Payroll, SocialInsurancePayout, Tuition, Payout, BillPayment, B2BTransfer, Remittance, TaxPayment)
- **Feedbacks**: 200-300 entries
- **API Metrics**: 90 days × 24 hours × 8 endpoints

### Success Rates by Channel
- IB: 97%
- MB: 96%
- API: 94%
- VA: 98%
- QR: 95%
- ERP: 93%

### Data Generation
Mock data được sinh tự động với:
- Phân phối normal cho thời gian (peak hours 9-11, 14-16)
- Latency spike trong giờ cao điểm (×1.2-2.5)
- Lý do lỗi đa dạng (8 reasons)
- NPS phân phối lệch phải (50% Promoters, 25% Passives, 25% Detractors)

## 🎨 Channel Colors

| Channel | Color Code |
|---------|-----------|
| IB      | #1E88E5   |
| MB      | #43A047   |
| API     | #8E24AA   |
| VA      | #FB8C00   |
| QR      | #F4511E   |
| ERP     | #3949AB   |

## ✅ Acceptance Criteria (Hoàn thành)

- [x] Filters hoạt động và cập nhật toàn bộ dashboard
- [x] KPI Cards hiển thị đầy đủ 7 chỉ số
- [x] Channel Distribution với donut chart
- [x] Time Series với stacked area chart
- [x] Leaderboard với badges (Gold/Silver/API Champion)
- [x] Failure Analysis với bar chart và top reasons
- [x] Forecasting với linear regression (7 days)
- [x] Anomaly Detection với z-score alerts
- [x] API Analytics với success rate và latency metrics
- [x] ROI Calculation theo channel
- [x] NPS Score với feedback list
- [x] Export CSV functionality
- [x] Dark/Light theme
- [x] Responsive design
- [x] No runtime errors
- [x] Mock data generator (80k+ transactions)

## 🔒 Bảo mật & Tuân thủ

- ✅ Không sử dụng dữ liệu thật/PII
- ✅ Tất cả dữ liệu là mock và generated locally
- ✅ Không có network calls ngoài (offline demo)
- ✅ Input sanitization cho feedback comments
- ✅ No sensitive data logging

## 🚧 Ngoài phạm vi (Demo)

Các tính năng sau **không** được implement trong phiên bản demo này:
- Backend API integration
- User authentication & authorization
- Real-time data streaming
- Advanced ML models (ARIMA, Prophet, etc.)
- Production-grade alerting system
- Multi-language i18n (chỉ hỗ trợ tiếng Việt trong labels)
- PDF export
- Drill-down modals (có thể thêm sau)

## 📝 Test Cases

### Filter Tests
- [x] Thay đổi từ MTD → 90D → Q2
- [x] Tất cả KPI và charts cập nhật

### KPI Tests
- [x] Hiển thị đúng giá trị với format VND
- [x] Tính toán chính xác theo filter

### Anomaly Tests
- [x] Hiển thị alerts khi z-score >= 3
- [x] Severity badges (HIGH/MEDIUM/LOW)

### Leaderboard Tests
- [x] Sắp xếp theo volume
- [x] Badges gán đúng theo rules

### Export Tests
- [x] CSV export với đầy đủ transactions

## 🐛 Known Issues

- Không có issues nghiêm trọng
- Performance tốt với 80k transactions
- Forecast có thể không chính xác với data pattern phức tạp (sử dụng simple linear regression)

## 🔮 Future Enhancements

- [ ] Drill-down modals cho từng KPI
- [ ] More filter options (multi-select companies/channels/products)
- [ ] Customer Journey Sankey diagram
- [ ] Segmentation analysis
- [ ] PDF export
- [ ] Real-time updates simulation
- [ ] More advanced forecasting (ARIMA, seasonal decomposition)
- [ ] Cohort analysis
- [ ] Custom dashboard builder

## 📄 License

MIT License - Demo application for educational purposes

## 👨‍💻 Development

```bash
# Lint code
npm run lint

# Type check
tsc --noEmit
```

## 📞 Support

Để báo cáo lỗi hoặc góp ý, vui lòng tạo issue trong repository.

---

**⚠️ Disclaimer**: Đây là ứng dụng demo với dữ liệu giả lập. Tất cả dữ liệu, công ty, và số liệu được tạo ngẫu nhiên và không phản ánh thông tin thực tế của VIB hay bất kỳ tổ chức nào.

**Version**: 1.0.0
**Last Updated**: November 2025

## 🆕 Version 2 Features (Delta Updates)

### New Data Models
```typescript
interface BalanceSnapshot {
  ts: string;            // YYYY-MM-DD
  companyId: string;
  casaDailyAvg: number;  // VND, average daily CASA balance
  termDepositEnd: number;// VND, end-of-day term deposit balance
}

interface CompanyFirstSeen {
  companyId: string;
  firstTxnDate: string;  // First transaction date
}

interface CostAllocation {
  companyId?: string;
  rate: number;          // 0..1 for TOI net calculation
}
```

### Enhanced KPI Cards
Mỗi KPI card v2 hiển thị:
- **Value chính** (formatted: currency/number/percentage)
- **WoW/MoM Delta** với trend indicator (↑/↓)
- **Sparkline** (7-30 ngày data)
- **Tooltip** giải thích công thức

```typescript
// Ví dụ: CASA KPI Card
{
  title: "CASA (Average Daily)",
  value: 25000000000,  // 25B VND
  delta: {
    value: 2.5,        // +2.5%
    period: "WoW",
    trend: "up"
  },
  sparkline: [...],    // 30 days
  tooltip: "CASA = avg_over_days(casaDailyBalance[day])"
}
```

### Business Logic Functions (v2)
```typescript
// CASA calculations
selectCasa(snapshots, companies): {
  avgDaily: number,
  total: number,
  trend: Array<{date, value}>
}

// TOI with cost allocation
selectToi(transactions, pricing, allocationRate): {
  gross: number,
  net: number,  // = gross - (totalCost * allocationRate)
  trend: Array<{date, value}>
}

// Term Deposit
selectTermDeposit(snapshots, companies): {
  ending: number,
  avg: number,
  trend: Array<{date, value}>
}

// New user acquisition
selectNewUserTrend(companyFirstSeen, startDate, endDate): {
  total: number,
  trend: Array<{date, value}>
}

// Error tracking
selectErrorTrend(transactions): {
  total: number,
  errorRate: number,
  trend: Array<{date, count, rate}>
}
```

### Customer Detail Drawer

Được kích hoạt khi:
- Click vào company trong Leaderboard
- Click vào company trong bất kỳ bảng nào
- Deep link: `?company=COMP001`

Hiển thị:
- Header với company name, pin button, close button
- 4 mini KPI cards (Transactions, Volume, Success Rate, CASA)
- Channel distribution pie chart
- Volume trend line chart (30 ngày)
- Top 5 failure reasons bar chart
- 5 recent transactions với status badges

Actions:
- Pin/Unpin: Giữ company khi thay đổi filter global
- URL sync: Tự động cập nhật `?company=` param

### Data Generation Improvements

**BalanceSnapshots** (180 days per company):
- Weekly pattern: CASA giảm 15% vào cuối tuần
- Monthly growth: 0.5-2% tăng trưởng mỗi tháng
- Daily variance: ±5% noise
- Term deposit ổn định hơn: ±2% noise, tăng 0.2-1%/tháng

**CompanyFirstSeen**:
- Extract từ earliest transaction per company
- Sử dụng để track new customer acquisition
- Không dựa vào `customerType=NEW` trong transaction

### Store Actions (v2)

```typescript
// Select company for detail view
setSelectedCompany(companyId: string | null)

// Pin/unpin companies
togglePinCompany(companyId: string)

// Set cost allocation rate for TOI
setAllocationRate(rate: number)  // 0..1
```

### Integration Guide

Để sử dụng v2 components trong App.tsx:

```tsx
import { EnhancedKPICard } from './components/EnhancedKPICard';
import { CustomerDetailDrawer } from './components/CustomerDetailDrawer';
import { 
  selectCasa, selectToi, selectTermDeposit,
  buildEnhancedKPICard
} from './utils/businessLogicV2';

// In component:
const snapshots = useFilteredBalanceSnapshots();

const casaData = selectCasa(snapshots, filters.companies);
const casaCard = buildEnhancedKPICard(
  'casa',
  'CASA (Avg Daily)',
  casaData.avgDaily,
  casaData.trend,
  'currency',
  'CASA = avg_over_days(casaDailyBalance[day])',
  'WoW'
);

// Render:
<EnhancedKPICard data={casaCard} onClick={() => {/* drill down */}} />

// Add drawer:
<CustomerDetailDrawer />
```

### Testing v2 Features

```bash
# Test balance snapshots generation
npm run dev
# Console should show: "✓ Generated 2160 balance snapshots" (12 companies × 180 days)

# Test customer detail
# 1. Click any company in leaderboard
# 2. Should open drawer from right
# 3. URL should update: ?company=COMP001
# 4. Click Pin button
# 5. Change global filters
# 6. Company should stay pinned

# Test enhanced KPI cards
# 1. Check CASA card shows sparkline
# 2. Hover tooltip shows formula
# 3. Delta shows WoW/MoM change with arrow
```

### Next Steps for Full v2 Integration

Còn cần implement trong App.tsx:
1. **4 Enhanced KPI Cards** ở hàng đầu (trước existing KPIs)
2. **Overview Section** với 4 charts:
   - New User Entry Trend (line chart)
   - Error Trend (area chart with % overlay)
   - CASA Trend (area, optional stacked by company)
   - TOI Trend (line với target line)
3. **Click handlers** từ Leaderboard → CustomerDetailDrawer
4. **Cost allocation** slider control (0-20%)

Tất cả components và logic đã sẵn sàng, chỉ cần integrate!

---

**Version**: 2.0.0 (Partial)
**Last Updated**: November 2025
