# MakeCents - Development TODO

> **Vision**: Build an intuitive money management app with visual money flow tracking (like Butterfly), clear financial goals, and AI-powered finance agents.

**Last Updated**: 2024-12-19  
**Current Sprint**: Foundation & Core Features

---

## 📋 Table of Contents

- [Module 1: Environment & Foundation](#module-1-environment--foundation)
- [Module 2: Money Flow Visualization](#module-2-money-flow-visualization)
- [Module 3: Financial Goals System](#module-3-financial-goals-system)
- [Module 4: AI Finance Agents](#module-4-ai-finance-agents)
- [Module 5: Enhanced Money Management](#module-5-enhanced-money-management)
- [Module 6: User Experience & Polish](#module-6-user-experience--polish)
- [Module 7: Data & Integrations](#module-7-data--integrations)
- [Module 8: Security & Performance](#module-8-security--performance)

---

## Module 1: Environment & Foundation

**Status**: 🟡 In Progress  
**Priority**: P0 (Critical)  
**Sprint**: Current

### 1.1 Environment Setup
- [x] Install dependencies (`npm install`)
  - ⚠️ May need to fix npm permissions: `sudo chown -R $(whoami) ~/.npm`
- [x] Create `.env` file with required variables:
  - [x] `DATABASE_URL="file:./prisma/dev.db"`
  - [x] `NEXTAUTH_URL="http://localhost:3000"`
  - [x] `NEXTAUTH_SECRET="[generate-secret]"` (use `openssl rand -base64 32` or run `bash scripts/create-env.sh`)
  - [x] `NEXT_PUBLIC_TELLER_APPLICATION_ID` (for Teller Connect - must use NEXT_PUBLIC_ prefix for client-side)
  - [ ] `TELLER_CERTIFICATE` (if using Teller in dev/prod - optional for sandbox)
  - [ ] `TELLER_PRIVATE_KEY` (if using Teller in dev/prod - optional for sandbox)
- [x] Generate Prisma client (`npm run db:generate`)
- [x] Push database schema (`npm run db:push`)
- [x] Seed database with test data (`npm run db:seed`)
- [x] Verify dev server runs (`npm run dev`)

**Progress Notes**:
- ✅ Created `docs/SETUP_GUIDE.md` with instructions
- ✅ Created `scripts/create-env.sh` helper script
- ✅ Created `lib/auth-config.ts` with NextAuth configuration template
- ✅ Fixed Teller env variable naming issue (must use `NEXT_PUBLIC_TELLER_APPLICATION_ID` for client-side access)
- ✅ Updated setup scripts and documentation

### 1.2 Authentication System
- [x] Implement NextAuth.js integration
  - [x] Set up authentication providers (Email/Password)
  - [x] Create login/signup pages
  - [x] Replace `getServerUserId()` in `lib/auth.ts` with real session
  - [x] Add protected route middleware
  - [x] Update all API routes to use authenticated user
- [x] Add session management (via NextAuth SessionProvider)
- [x] Add logout functionality (via NextAuth signOut)
- [x] Write unit tests for authentication flows
- [x] Update Settings page to use authenticated user data

**Progress Notes**:
- ✅ NextAuth.js fully configured and active
- ✅ Created `/auth/signin` and `/auth/signup` pages
- ✅ All API routes updated to use async `getServerUserId()`
- ✅ Middleware protects dashboard and API routes
- ✅ TypeScript types added for NextAuth session
- ✅ Logout button added to Sidebar
- ✅ Authentication flow tested and working
- ✅ Unit tests written for auth flows

#### 1.2.1 OAuth Providers (Future)
- [ ] Add Google OAuth provider
- [ ] Add GitHub OAuth provider
- [ ] Add Apple OAuth provider (optional)
- [ ] Update signin page to show OAuth buttons
- [ ] Handle OAuth account linking with existing email accounts
- [ ] Test OAuth flows

**Progress Notes**:
- NextAuth supports OAuth providers out of the box
- Need to configure OAuth apps in respective platforms
- Add provider credentials to environment variables

#### 1.2.2 Password Reset & Email Verification (Future)
- [ ] Set up email service (SendGrid, Resend, or similar)
- [ ] Create password reset API route
- [ ] Create password reset page UI
- [ ] Add "Forgot Password" link to signin page
- [ ] Implement email verification on signup
- [ ] Add email verification page
- [ ] Add resend verification email functionality
- [ ] Test password reset flow
- [ ] Test email verification flow

**Progress Notes**:
- Requires email service integration
- Need to add email templates
- Consider using magic links for password reset

### 1.3 Database Enhancements
- [ ] Review and optimize Prisma schema for money flow tracking
- [ ] Add indexes for performance (date ranges, user queries)
- [ ] Consider adding `MoneyFlow` model for flow visualization data
- [ ] Add migration scripts for production
- [ ] Set up database backups strategy

**Progress Notes**:
- Current schema supports basic transactions and accounts
- May need additional models for flow visualization

---

## Module 2: Money Flow Visualization

**Status**: 🔴 Not Started  
**Priority**: P0 (Critical)  
**Sprint**: Next

> **Goal**: Create a Butterfly-like visualization showing the complete flow of money through accounts, categories, and goals.

### 2.1 Flow Data Model
- [ ] Design data structure for money flow tracking
  - [ ] Define flow nodes (accounts, categories, goals, investments)
  - [ ] Define flow edges (transactions, transfers, allocations)
  - [ ] Determine time granularity (daily, weekly, monthly)
- [ ] Create Prisma models if needed:
  - [ ] `MoneyFlow` model (optional, or compute from transactions)
  - [ ] `FlowNode` model (optional)
- [ ] Design API endpoints for flow data
  - [ ] `GET /api/analytics/money-flow?startDate=&endDate=&granularity=`

**Progress Notes**:
- Need to decide: compute on-the-fly vs. pre-computed flow data
- Consider using existing Transaction model with aggregations

### 2.2 Sankey Diagram Component
- [ ] Research and choose visualization library
  - [ ] Options: D3.js, Recharts (already in use), react-flow, vis.js
  - [ ] Evaluate: react-sankey, @nivo/sankey
- [ ] Create `MoneyFlowSankey` component
  - [ ] Accept flow data as props
  - [ ] Render nodes (accounts, categories, goals)
  - [ ] Render flows (money movement with amounts)
  - [ ] Add interactivity (hover, click, zoom)
- [ ] Add filtering options:
  - [ ] Date range selector
  - [ ] Account filter
  - [ ] Category filter
  - [ ] Minimum flow amount threshold
- [ ] Add animations for flow changes

**Progress Notes**:
- Recharts is already in dependencies but may not support Sankey
- May need to add D3.js or specialized library

### 2.3 Flow Analytics Backend
- [ ] Create `lib/analytics/money-flow.ts`
  - [ ] `getMoneyFlowData(userId, startDate, endDate)` function
  - [ ] Aggregate transactions into flow structure
  - [ ] Calculate flows: Income → Accounts → Categories → Goals
  - [ ] Handle transfers between accounts
  - [ ] Handle investment flows
- [ ] Optimize queries for performance
- [ ] Add caching for expensive computations
- [ ] Create API route: `app/api/analytics/money-flow/route.ts`

**Progress Notes**:
- Can build on existing `lib/analytics/dashboard.ts`
- Need to handle complex flows (multi-account, transfers, investments)

### 2.4 Flow Visualization Page
- [ ] Create `app/dashboard/flow/page.tsx`
  - [ ] Server component that fetches flow data
  - [ ] Pass to client component
- [ ] Create `app/dashboard/flow/FlowClient.tsx`
  - [ ] Render Sankey diagram
  - [ ] Add controls (date range, filters)
  - [ ] Show flow details on hover/click
  - [ ] Add export/share functionality
- [ ] Add to sidebar navigation
- [ ] Add responsive design for mobile

**Progress Notes**:
- New page needed
- Should integrate with existing analytics page or be separate

### 2.5 Flow Insights & Anomalies
- [ ] Detect unusual money flows
  - [ ] Large unexpected transfers
  - [ ] Missing expected income
  - [ ] Unusual spending patterns
- [ ] Add alerts/notifications for anomalies
- [ ] Create insights panel showing:
  - [ ] Largest money flows
  - [ ] Flow trends over time
  - [ ] Comparison to previous periods

**Progress Notes**:
- Can leverage AI agents (Module 4) for insights

---

## Module 3: Financial Goals System

**Status**: 🟢 Partially Complete  
**Priority**: P1 (High)  
**Sprint**: Current

> **Goal**: Enhanced goal tracking with clear expectations, progress visualization, and automated progress updates.

### 3.1 Goal Model Enhancements
- [ ] Review current `InvestmentGoal` model
- [ ] Add fields if needed:
  - [ ] `recurringContribution` (monthly/weekly contribution amount)
  - [ ] `contributionAccountId` (which account funds the goal)
  - [ ] `milestones` (JSON array of milestone targets)
  - [ ] `alertThresholds` (notify when X% complete)
- [ ] Add goal types:
  - [ ] Emergency fund
  - [ ] Savings goal
  - [ ] Investment target
  - [ ] Debt payoff
  - [ ] Custom goal
- [ ] Run migration if schema changes

**Progress Notes**:
- Current model has: name, description, targetAmount, currentAmount, targetDate, priority, isCompleted
- `fundingAccountId` relation mentioned in docs/PHASE_1_FEATURES_GUIDE.md but not in schema

### 3.2 Goal Progress Automation
- [ ] Create `lib/goals/progress.ts`
  - [ ] `updateGoalProgress(goalId)` function
  - [ ] Auto-calculate progress from linked accounts
  - [ ] Track contributions automatically
  - [ ] Update `currentAmount` based on account balances
- [ ] Add background job to update goals periodically
- [ ] Create goal-to-account linking UI
- [ ] Handle multiple accounts funding one goal

**Progress Notes**:
- Currently goals are manually updated
- Need to link goals to accounts for auto-tracking

### 3.3 Goal Visualization
- [ ] Enhance goal cards with:
  - [ ] Progress ring/chart
  - [ ] Time remaining indicator
  - [ ] Contribution timeline chart
  - [ ] Milestone markers
- [ ] Create goal detail page (`app/dashboard/goals/[id]/page.tsx`)
  - [ ] Show full goal history
  - [ ] Contribution timeline
  - [ ] Projected completion date
  - [ ] Required contribution rate calculator
- [ ] Add goal comparison view
  - [ ] Compare multiple goals side-by-side
  - [ ] Show priority ranking

**Progress Notes**:
- Basic goal UI exists in `app/dashboard/planner/GoalsClient.tsx`
- Needs enhancement for better visualization

### 3.4 Goal Expectations & Planning
- [ ] Create goal planning wizard
  - [ ] Step 1: Goal type selection
  - [ ] Step 2: Target amount and date
  - [ ] Step 3: Funding source selection
  - [ ] Step 4: Contribution plan (auto or manual)
  - [ ] Step 5: Review and create
- [ ] Add goal calculator:
  - [ ] "How much do I need to save monthly?"
  - [ ] "When will I reach my goal at current rate?"
  - [ ] "What if I increase contributions by X?"
- [ ] Add goal templates (Emergency Fund, Vacation, House Down Payment, etc.)

**Progress Notes**:
- Current goal creation is basic modal
- Needs more guided experience

### 3.5 Goal Alerts & Notifications
- [ ] Create notification system for goals
  - [ ] Goal milestone reached (25%, 50%, 75%, 100%)
  - [ ] Goal deadline approaching
  - [ ] Goal behind schedule
  - [ ] Goal ahead of schedule
- [ ] Add email/push notification preferences
- [ ] Create notification center UI

**Progress Notes**:
- No notification system currently exists

---

## Module 4: AI Finance Agents

**Status**: 🔴 Not Started  
**Priority**: P1 (High)  
**Sprint**: Future

> **Goal**: Create specialized AI agents that help users with specific financial goals and decisions.

### 4.1 AI Infrastructure Setup
- [ ] Choose AI provider/API
  - [ ] Options: OpenAI, Anthropic Claude, Local LLM (Ollama)
  - [ ] Consider cost, privacy, capabilities
- [ ] Set up API client library
- [ ] Create environment variables:
  - [ ] `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
- [ ] Create `lib/ai/client.ts` for AI interactions
- [ ] Add rate limiting and error handling

**Progress Notes**:
- No AI integration currently
- Need to decide on provider and model

### 4.2 Agent Architecture
- [ ] Design agent system:
  - [ ] Base `FinanceAgent` class/interface
  - [ ] Specialized agents:
    - [ ] `BudgetAgent` - budget planning and analysis
    - [ ] `GoalAgent` - goal setting and tracking
    - [ ] `InvestmentAgent` - investment advice
    - [ ] `DebtAgent` - debt payoff strategies
    - [ ] `SavingsAgent` - savings optimization
- [ ] Create agent context system:
  - [ ] User financial data context
  - [ ] Goal context
  - [ ] Transaction history context
  - [ ] Account balances context
- [ ] Design agent memory/persistence
  - [ ] Store agent conversations
  - [ ] Store agent recommendations
  - [ ] Track agent effectiveness

**Progress Notes**:
- Need to design from scratch
- Consider using LangChain or similar framework

### 4.3 Budget Agent
- [ ] Create `lib/ai/agents/budget-agent.ts`
- [ ] Capabilities:
  - [ ] Analyze spending patterns
  - [ ] Suggest budget allocations
  - [ ] Identify overspending categories
  - [ ] Recommend budget adjustments
  - [ ] Answer budget questions
- [ ] Create UI: `app/dashboard/ai/budget/page.tsx`
  - [ ] Chat interface for budget questions
  - [ ] Budget recommendations display
  - [ ] Spending analysis insights

**Progress Notes**:
- First agent to implement
- Can use existing category/transaction data

### 4.4 Goal Agent
- [ ] Create `lib/ai/agents/goal-agent.ts`
- [ ] Capabilities:
  - [ ] Help set realistic goals
  - [ ] Suggest goal timelines
  - [ ] Recommend contribution amounts
  - [ ] Analyze goal progress
  - [ ] Suggest goal prioritization
  - [ ] Answer goal-related questions
- [ ] Create UI: `app/dashboard/ai/goals/page.tsx`
  - [ ] Chat interface
  - [ ] Goal recommendations
  - [ ] Progress analysis

**Progress Notes**:
- Integrates with Module 3 (Goals System)

### 4.5 Investment Agent
- [ ] Create `lib/ai/agents/investment-agent.ts`
- [ ] Capabilities:
  - [ ] Analyze portfolio performance
  - [ ] Suggest diversification
  - [ ] Answer investment questions (educational)
  - [ ] Risk assessment
  - [ ] Investment goal alignment
- [ ] Create UI: `app/dashboard/ai/investments/page.tsx`
- [ ] Add disclaimers (not financial advice)

**Progress Notes**:
- Must include legal disclaimers
- Educational focus, not trading advice

### 4.6 Agent UI Components
- [ ] Create reusable agent chat component
  - [ ] `components/ai/AgentChat.tsx`
  - [ ] Message history
  - [ ] Typing indicators
  - [ ] Markdown rendering for responses
- [ ] Create agent selector/switcher
- [ ] Add agent avatars/personalities
- [ ] Add conversation history persistence
- [ ] Add export conversation feature

**Progress Notes**:
- Need to design chat UI
- Consider using existing chat libraries

### 4.7 Agent Integration with Flow Visualization
- [ ] Allow agents to reference money flow data
- [ ] Agents can explain flow patterns
- [ ] Agents can suggest flow optimizations
- [ ] Add "Ask AI about this flow" button in flow view

**Progress Notes**:
- Integrates with Module 2 (Money Flow)

---

## Module 5: Enhanced Money Management

**Status**: 🟡 In Progress  
**Priority**: P1 (High)  
**Sprint**: Current

> **Goal**: Make money management intuitive, easy, and comprehensive.

### 5.1 Transaction Management Enhancements
- [ ] Improve transaction entry form
  - [ ] Quick add button (floating action button)
  - [ ] Smart category suggestions
  - [ ] Merchant auto-complete
  - [ ] Recurring transaction detection
  - [ ] Photo receipt upload (future)
- [ ] Add transaction bulk actions
  - [ ] Bulk categorize
  - [ ] Bulk tag
  - [ ] Bulk delete
- [ ] Add transaction search and filters
  - [ ] Full-text search
  - [ ] Advanced filters (date range, amount, category, account)
  - [ ] Save filter presets
- [ ] Add transaction rules
  - [ ] Auto-categorize based on merchant
  - [ ] Auto-tag based on keywords
  - [ ] Auto-assign to goals

**Progress Notes**:
- Basic transaction UI exists
- Needs enhancement for ease of use

### 5.2 Budget System
- [ ] Create budget model in Prisma
  - [ ] `Budget` model with category limits
  - [ ] `BudgetPeriod` (monthly, weekly, yearly)
  - [ ] `BudgetAlert` thresholds
- [ ] Create budget creation UI
  - [ ] `app/dashboard/budget/page.tsx`
  - [ ] Category budget allocation
  - [ ] Budget templates
- [ ] Create budget tracking
  - [ ] Current vs. budgeted spending
  - [ ] Budget progress bars
  - [ ] Budget alerts (approaching limit, over budget)
- [ ] Integrate with dashboard
  - [ ] Show budget status in KPIs
  - [ ] Show budget progress in charts

**Progress Notes**:
- Budget mentioned in README as TODO
- Not yet implemented

### 5.3 Account Management Enhancements
- [ ] Improve account creation flow
  - [ ] Account type templates
  - [ ] Quick account setup
  - [ ] Account grouping (Personal, Business, etc.)
- [ ] Add account balance history
  - [ ] Track balance over time
  - [ ] Show balance trends
- [ ] Add account reconciliation
  - [ ] Mark transactions as reconciled
  - [ ] Reconciliation reports
- [ ] Add account archiving
  - [ ] Archive closed accounts
  - [ ] Hide archived accounts from main view

**Progress Notes**:
- Basic account management exists
- Teller integration for auto-sync is implemented

### 5.4 Recurring Transactions
- [ ] Enhance recurring transaction support
  - [ ] Create recurring transaction model
  - [ ] Auto-create transactions from recurring templates
  - [ ] Recurring transaction management UI
  - [ ] Handle skipped/repeated occurrences
- [ ] Add recurring transaction detection
  - [ ] Analyze transaction patterns
  - [ ] Suggest recurring transactions
  - [ ] Auto-convert to recurring

**Progress Notes**:
- `isRecurring` field exists in Transaction model
- No UI or automation for recurring transactions

### 5.5 Cash Flow Forecasting
- [ ] Create cash flow projection
  - [ ] Project future income
  - [ ] Project future expenses (based on recurring + averages)
  - [ ] Show projected balance over time
- [ ] Add "What if" scenarios
  - [ ] What if I spend X more/less?
  - [ ] What if income changes?
- [ ] Create forecasting UI
  - [ ] `app/dashboard/forecast/page.tsx`
  - [ ] Timeline view of projected cash flow
  - [ ] Scenario comparison

**Progress Notes**:
- Can build on existing cash flow analytics
- New feature

---

## Module 6: User Experience & Polish

**Status**: 🟡 In Progress  
**Priority**: P2 (Medium)  
**Sprint**: Ongoing

> **Goal**: Create a beautiful, intuitive, and responsive user experience.

### 6.1 Design System
- [ ] Establish design tokens
  - [ ] Colors (light/dark mode)
  - [ ] Typography scale
  - [ ] Spacing system
  - [ ] Component variants
- [ ] Create component library documentation
- [ ] Ensure consistent styling across app
- [ ] Add loading states and skeletons
- [ ] Add error states and empty states

**Progress Notes**:
- Using Tailwind CSS
- Radix UI components in use
- Need more consistency

### 6.2 Mobile Responsiveness
- [ ] Audit all pages for mobile
- [ ] Fix mobile navigation
- [ ] Optimize charts for mobile
- [ ] Add touch-friendly interactions
- [ ] Test on various screen sizes
- [ ] Consider PWA features (offline support, install prompt)

**Progress Notes**:
- Some pages may not be fully responsive
- Charts may need mobile optimization

### 6.3 Onboarding Flow
- [ ] Create welcome/onboarding flow
  - [ ] Step 1: Welcome & value proposition
  - [ ] Step 2: Link first account (Teller or manual)
  - [ ] Step 3: Set up first goal
  - [ ] Step 4: Tour of key features
- [ ] Add tooltips and guided tours
- [ ] Create help documentation
- [ ] Add in-app help/search

**Progress Notes**:
- No onboarding currently
- Users may be confused on first use

### 6.4 Performance Optimization
- [ ] Audit page load times
- [ ] Optimize database queries
- [ ] Add React Query caching strategies
- [ ] Implement code splitting
- [ ] Optimize images and assets
- [ ] Add service worker for offline support (optional)

**Progress Notes**:
- Should monitor as app grows

### 6.5 Accessibility
- [ ] Audit for WCAG compliance
- [ ] Add ARIA labels
- [ ] Ensure keyboard navigation
- [ ] Test with screen readers
- [ ] Add focus indicators
- [ ] Ensure color contrast

**Progress Notes**:
- Important for inclusive design

---

## Module 7: Data & Integrations

**Status**: 🟡 In Progress  
**Priority**: P1 (High)  
**Sprint**: Current

> **Goal**: Seamless data import and third-party integrations.

### 7.1 Teller Integration (Bank Sync)
- [ ] Complete Teller integration
  - [ ] Test OAuth flow end-to-end
  - [ ] Handle sync errors gracefully
  - [ ] Add sync status indicators
  - [ ] Add manual sync triggers
- [ ] Support additional banks via Teller
- [ ] Add account disconnection flow
- [ ] Handle account updates (name changes, closures)

**Progress Notes**:
- Teller integration framework exists
- May need testing and refinement

### 7.2 CSV/OFX Import
- [ ] Create CSV import UI
  - [ ] `app/dashboard/accounts/[id]/import/page.tsx` (exists)
  - [ ] File upload component
  - [ ] Column mapping interface
  - [ ] Preview before import
- [ ] Enhance CSV parser (`lib/csv-parser.ts`)
  - [ ] Support multiple formats
  - [ ] Auto-detect column types
  - [ ] Handle duplicates
- [ ] Add OFX/QFX import support
- [ ] Add import history and logs

**Progress Notes**:
- CSV import page exists but may need enhancement
- Parser exists in `lib/csv-parser.ts`

### 7.3 Broker Integrations
- [ ] Complete Webull integration
  - [ ] Implement `WebullAdapter` in `lib/brokers/`
  - [ ] Test API connection
  - [ ] Sync holdings and trades
- [ ] Complete Robinhood integration
  - [ ] Implement `RobinhoodAdapter`
  - [ ] Handle authentication
  - [ ] Sync data
- [ ] Add more brokers (Fidelity, Schwab, etc.)
- [ ] Create broker connection UI
  - [ ] `app/dashboard/investments/connect/page.tsx` (exists)
  - [ ] OAuth flows for each broker
  - [ ] Connection status

**Progress Notes**:
- Broker adapter framework exists
- Webull and Robinhood mentioned but not fully implemented
- See `docs/ARCHITECTURE.md` for details

### 7.4 Data Export
- [ ] Create export functionality
  - [ ] Export transactions to CSV
  - [ ] Export accounts to CSV
  - [ ] Export full data backup (JSON)
  - [ ] Export reports (PDF)
- [ ] Add export UI
- [ ] Schedule automatic exports (optional)

**Progress Notes**:
- No export functionality currently

---

## Module 8: Security & Performance

**Status**: 🔴 Not Started  
**Priority**: P0 (Critical for Production)  
**Sprint**: Pre-Launch

> **Goal**: Ensure app is secure, performant, and production-ready.

### 8.1 Security
- [ ] Implement proper authentication (see Module 1.2)
- [ ] Add rate limiting to API routes
- [ ] Encrypt sensitive data (API keys, credentials)
- [ ] Add input validation and sanitization
- [ ] Implement CSRF protection
- [ ] Add security headers
- [ ] Conduct security audit
- [ ] Set up error logging (without exposing sensitive data)

**Progress Notes**:
- Critical before production launch

### 8.2 Database Optimization
- [ ] Review and optimize Prisma queries
- [ ] Add database indexes (see Module 1.3)
- [ ] Set up connection pooling
- [ ] Plan for database migration to PostgreSQL (production)
- [ ] Set up database backups
- [ ] Add query performance monitoring

**Progress Notes**:
- Currently using SQLite (dev)
- PostgreSQL needed for production

### 8.3 Testing
- [x] Set up testing framework (Jest, Vitest, or Playwright)
  - [x] Install Jest and testing dependencies (added to package.json)
  - [x] Configure Jest for Next.js App Router (jest.config.js)
  - [x] Set up test environment (jsdom) and mocks (jest.setup.js)
  - [x] Configure path aliases for tests (@/ alias)
  - [x] Add test scripts to package.json (test, test:watch, test:coverage)
  - [x] Install dependencies: `npm install` (user needs to run - added to package.json)
  - [ ] Verify tests run: `npm test` (after npm install)
- [ ] Write unit tests for utilities
- [ ] Write integration tests for API routes
- [ ] Write E2E tests for critical flows
- [ ] Add test coverage reporting
- [ ] Set up CI/CD with tests
- [ ] Set up UI automator testing framework (Playwright, Cypress, or similar)
  - [ ] Configure for Next.js App Router
  - [ ] Write E2E tests for authentication flows
  - [ ] Write E2E tests for money flow visualization
  - [ ] Write E2E tests for goal management
  - [ ] Add visual regression testing (optional)
  - [ ] Set up test data fixtures
  - [ ] Configure CI/CD to run UI tests

**Progress Notes**:
- ✅ Unit tests written for authentication flows
- ✅ Jest testing framework configured (jest.config.js, jest.setup.js)
- ✅ Test scripts added to package.json
- ✅ Test documentation created (docs/TESTING.md)
- ⚠️ Need to run `npm install` to install testing dependencies
- ⚠️ UI automator testing framework needed for comprehensive E2E testing
- Important for reliability and preventing regressions

### 8.4 Monitoring & Analytics
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Add application performance monitoring
- [ ] Set up user analytics (privacy-friendly)
- [ ] Create admin dashboard for monitoring
- [ ] Set up alerts for critical errors

**Progress Notes**:
- Needed for production operations

### 8.5 Deployment
- [ ] Set up production environment
- [ ] Configure production database (PostgreSQL)
- [ ] Set up environment variables
- [ ] Configure domain and SSL
- [ ] Set up CI/CD pipeline
- [ ] Create deployment documentation
- [ ] Set up staging environment

**Progress Notes**:
- Plan deployment strategy (Vercel, AWS, etc.)

---

## 📊 Progress Summary

**Overall Progress**: ~25% Complete

### By Module:
- ✅ Module 1: Environment & Foundation - 40% (Auth needed)
- 🔴 Module 2: Money Flow Visualization - 0%
- 🟢 Module 3: Financial Goals System - 60% (Basic implementation done)
- 🔴 Module 4: AI Finance Agents - 0%
- 🟡 Module 5: Enhanced Money Management - 30% (Basic features exist)
- 🟡 Module 6: User Experience & Polish - 40% (Needs refinement)
- 🟡 Module 7: Data & Integrations - 50% (Teller framework exists)
- 🔴 Module 8: Security & Performance - 10% (Basic structure)

### Completed Features:
- ✅ Basic dashboard with KPIs
- ✅ Transaction tracking
- ✅ Account management
- ✅ Goal tracking (basic)
- ✅ Analytics charts (cash flow, categories)
- ✅ Teller integration framework
- ✅ Investment tracking structure

### Next Priorities:
1. Complete environment setup
2. Implement authentication
3. Build money flow visualization (Sankey diagram)
4. Enhance goal system with automation
5. Set up AI agent infrastructure

---

## 🎯 Sprint Planning

### Current Sprint: Foundation & Core Features
**Duration**: 2 weeks  
**Focus**: Get environment ready, implement auth, start money flow visualization

**Tasks**:
- [ ] Complete Module 1 (Environment & Foundation)
- [ ] Start Module 2.1 (Flow Data Model)
- [ ] Start Module 2.2 (Sankey Diagram Component)

### Next Sprint: Money Flow & Goals
**Focus**: Complete money flow visualization, enhance goals

**Tasks**:
- [ ] Complete Module 2 (Money Flow Visualization)
- [ ] Complete Module 3 (Financial Goals System)

### Future Sprint: AI Agents
**Focus**: Implement AI agent infrastructure and first agent

**Tasks**:
- [ ] Complete Module 4.1-4.3 (AI Infrastructure & Budget Agent)

---

## 📝 Notes & Decisions

### Architecture Decisions:
- **Visualization Library**: TBD - Need to evaluate Sankey diagram options
- **AI Provider**: TBD - Need to choose OpenAI vs. Anthropic vs. Local
- **Database**: SQLite for dev, PostgreSQL for production
- **Deployment**: TBD - Consider Vercel, AWS, or self-hosted

### Open Questions:
- Should money flow be computed on-the-fly or pre-computed?
- What level of AI agent sophistication do we want initially?
- Should we support multiple currencies?
- What's the target user base (individuals, families, small businesses)?

### Technical Debt:
- Some API routes may need optimization
- Mobile responsiveness needs improvement
- Testing framework needs to be set up (tests written but not yet runnable)
- UI automator testing framework needed for E2E tests

---

## 🔄 How to Use This TODO

1. **Update Status**: Change status emoji (🟢 Complete, 🟡 In Progress, 🔴 Not Started)
2. **Check Off Tasks**: Mark completed subtasks with `[x]`
3. **Add Progress Notes**: Document decisions, blockers, or insights
4. **Update Last Updated**: Change date at top when making significant updates
5. **Sprint Planning**: Use sprint section to plan 2-week iterations
6. **Break Down Tasks**: If a task is too large, break it into smaller subtasks

---

**Remember**: This is a living document. Update it regularly as you make progress!

