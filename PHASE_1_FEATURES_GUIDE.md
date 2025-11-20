# Phase 1 Features - Code Locations & Live App Access

This guide maps every Phase 1 feature to its code location and how to access it in the running app.

---

## 🎯 Goal Tracker (Investment Planner)

### **Live App Access:**
- **URL:** `http://localhost:3000/dashboard/planner`
- **Navigation:** Click "Planner" in the left sidebar (Target icon)

### **Code Locations:**

#### Frontend (UI)
- **Page Component:** `app/dashboard/planner/page.tsx`
  - Server component that fetches goals from database
  - Passes data to client component
  
- **Client Component:** `app/dashboard/planner/GoalsClient.tsx`
  - Full React UI with create/edit/delete functionality
  - Progress bars, completion toggles, modal dialogs
  - Uses Radix UI for dialogs

#### Backend (API)
- **GET/POST Goals:** `app/api/goals/route.ts`
  - Lists all goals for user
  - Creates new goals with validation
  
- **PATCH/DELETE Goal:** `app/api/goals/[id]/route.ts`
  - Updates goal (e.g., mark complete, change amount)
  - Deletes goal with confirmation

#### Database
- **Schema:** `prisma/schema.prisma` → `InvestmentGoal` model
  - Fields: name, description, targetAmount, currentAmount, targetDate, priority, isCompleted
  
- **Seed Data:** `prisma/seed.ts` (lines 132-168)
  - Creates 3 default goals: Emergency Fund, Roth IRA Max, Travel Fund
  - Run `npm run db:seed` to populate

---

## 📊 Dashboard KPIs (Real Data)

### **Live App Access:**
- **URL:** `http://localhost:3000/dashboard`
- **Navigation:** Click "Dashboard" in sidebar (first item)

### **Code Locations:**

#### Frontend
- **Page:** `app/dashboard/page.tsx`
  - 4 KPI cards: Total Balance, Monthly Income, Monthly Expenses, Investments
  - Recent Transactions list (last 5)
  - Top Categories breakdown
  
#### Backend Analytics
- **Computation Layer:** `lib/analytics/dashboard.ts`
  - `getDashboardStats()` - calculates all KPIs
  - `getRecentTransactions()` - fetches latest transactions
  - `getTopCategories()` - category spending breakdown
  
#### API Endpoint
- **Analytics API:** `app/api/analytics/route.ts`
  - Query params: `?metric=cashflow&startDate=...&endDate=...`
  - Returns monthly cashflow, category breakdowns

---

## 📈 Charts (Cash Flow & Categories)

### **Live App Access:**
- **URL:** `http://localhost:3000/dashboard/analytics`
- **Navigation:** Click "Analytics" in sidebar (PieChart icon)

### **Code Locations:**

#### Chart Components
- **Cash Flow Chart:** `components/charts/CashFlowChart.tsx`
  - Line chart showing income vs expenses over time
  - Accepts `data` prop (array of {month, income, expenses})
  - Uses Recharts library
  
- **Category Chart:** `components/charts/CategoryChart.tsx`
  - Pie chart with category breakdown
  - Shows percentages and legend
  - Accepts `data` prop (array of {name, value, color})

#### Analytics Page
- **Page:** `app/dashboard/analytics/page.tsx`
  - Renders both charts side-by-side
  - Currently uses sample data (needs API integration)

---

## 🔄 Teller Sync & Data Ingest

### **Live App Access:**
- **Link Account:** `http://localhost:3000/dashboard/accounts/new`
- **Sync Transactions:** Background sync runs every 15 minutes automatically
- **Manual Sync:** Use "Sync Transactions" button on accounts page

### **Code Locations:**

#### Teller Integration
- **API Client:** `lib/teller.ts`
  - `tellerApiRequest()` - makes authenticated requests to Teller API
  - `isTellerConfigured()` - checks if certificates/env vars are set
  - Handles mTLS certificates for production
  
- **Sync Logic:** `lib/teller-sync.ts`
  - `syncTellerTransactions()` - syncs transactions for one account
  - `syncAllTellerAccounts()` - syncs all Teller-linked accounts
  - Deduplication using Teller transaction IDs
  - Category mapping from Teller categories to your categories

#### API Routes
- **Exchange Token:** `app/api/teller/exchange-token/route.ts`
  - Called after Teller Connect flow
  - Creates account in database
  - Auto-syncs last 90 days of transactions
  
- **Sync Transactions:** `app/api/teller/sync-transactions/route.ts`
  - POST with `accountId` to sync specific account
  - POST with `syncAll: true` to sync all accounts
  - GET for background cron jobs

#### Background Sync
- **Component:** `components/BackgroundSync.tsx`
  - Runs in `app/dashboard/layout.tsx`
  - Syncs every 15 minutes automatically
  - Silent background operation

#### Frontend Connect
- **Teller Connect:** `components/TellerConnect.tsx`
  - Button that opens Teller Connect modal
  - Handles OAuth flow
  - Fetches accounts and creates them in your DB

---

## 🗄️ Database Schema Updates

### **New Models Added:**

1. **SyncLog** (`prisma/schema.prisma`)
   - Tracks sync operations for debugging
   - Fields: userId, accountId, syncedCount, errorCount, startDate, endDate

2. **InvestmentGoal** (already existed, enhanced)
   - Added `fundingAccountId` relation
   - Links goals to specific accounts

3. **SpendingCategoryConfig** (planned, not yet in schema)
   - Will store budget targets per category
   - Currently categories are in `Category` model

---

## 🔐 Authentication Helper

### **Code Location:**
- **Auth Helper:** `lib/auth.ts`
  - `getServerUserId()` - currently returns `'user-1'`
  - **TODO:** Replace with real session/auth (NextAuth/Clerk)
  - Used by all API routes to scope data to user

### **Usage:**
Every API route imports and uses:
```typescript
import { getServerUserId } from '@/lib/auth'
const userId = getServerUserId()
```

---

## 🚀 How to See Everything Working

### **Step 1: Seed the Database**
```bash
npm run db:seed
```
This creates:
- Test user (`user-1`)
- 5 sample accounts
- 4 categories
- **3 default goals** (Emergency Fund, Roth IRA, Travel)
- 4 sample transactions

### **Step 2: Start the Dev Server**
```bash
npm run dev
```

### **Step 3: Navigate to Features**

1. **Dashboard** → `http://localhost:3000/dashboard`
   - See real KPI cards (calculated from seeded data)
   - View recent transactions
   - See top spending categories

2. **Goal Tracker** → `http://localhost:3000/dashboard/planner`
   - See 3 seeded goals with progress bars
   - Click "New Goal" to create more
   - Toggle completion, delete goals

3. **Analytics** → `http://localhost:3000/dashboard/analytics`
   - View cash flow and category charts
   - (Currently shows sample data - needs API integration)

4. **Link Teller Account** → `http://localhost:3000/dashboard/accounts/new`
   - Click "Link Account with Teller"
   - Follow OAuth flow
   - Account and transactions auto-sync

---

## 🐛 Troubleshooting

### **Goals Not Showing?**
1. Check if database is seeded: `npm run db:seed`
2. Verify user ID matches: Should be `'user-1'` (see `lib/auth.ts`)
3. Check browser console for errors
4. Verify API route works: `GET http://localhost:3000/api/goals`

### **Dashboard Shows $0?**
- Database might be empty
- Run `npm run db:seed` to populate sample data
- Check that accounts have balances in database

### **Teller Sync Not Working?**
- Verify `.env` has `TELLER_CERTIFICATE` and `TELLER_PRIVATE_KEY`
- Check `lib/teller.ts` → `isTellerConfigured()` returns true
- Look at browser console for Teller Connect errors

---

## 📝 Next Steps (Phase 2)

Once Phase 1 is verified working:
- Wire charts to real API data (currently using fallback)
- Add savings rate calculation to dashboard
- Implement surplus predictor
- Add travel cost tracking
- Build emergency fund meter widget

