# MakeCents Architecture

## Overview

MakeCents is a comprehensive financial dashboard application built with Next.js 14, TypeScript, and Prisma. It provides expense management, investment tracking, data visualizations, and financial planning tools.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (development) / PostgreSQL (production) via Prisma ORM
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State Management**: TanStack Query (React Query)
- **UI Components**: Radix UI primitives
- **Authentication**: NextAuth.js (to be implemented)

## Project Structure

```
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   │   ├── accounts/      # Account management endpoints
│   │   ├── transactions/  # Transaction CRUD endpoints
│   │   ├── categories/    # Category management
│   │   └── analytics/     # Analytics and reporting
│   ├── dashboard/         # Dashboard pages
│   │   ├── accounts/      # Account management UI
│   │   ├── expenses/      # Expense tracking UI
│   │   ├── investments/   # Investment tracking UI
│   │   ├── analytics/     # Data visualizations
│   │   ├── journal/       # Trading journal
│   │   ├── planner/       # Investment planner
│   │   └── settings/      # User settings
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── components/            # Reusable React components
│   ├── charts/           # Chart components
│   ├── Sidebar.tsx       # Navigation sidebar
│   ├── Card.tsx          # Card container component
│   └── Button.tsx        # Button component
├── lib/                  # Utility libraries
│   ├── prisma.ts         # Prisma client singleton
│   ├── utils.ts          # Utility functions
│   └── brokers/          # Broker integration adapters
├── prisma/               # Database schema
│   └── schema.prisma     # Prisma schema definition
└── types/                # TypeScript type definitions
```

## Database Schema

### Core Models

1. **User**: User accounts and authentication
2. **Account**: Financial accounts (checking, savings, credit cards, brokerages, 401k, etc.)
3. **Transaction**: Income and expense transactions
4. **Category**: Transaction categories with hierarchical support
5. **Investment**: Current holdings across accounts
6. **Trade**: Individual buy/sell trades
7. **InvestmentGoal**: Investment goals and targets

### Key Relationships

- User → Accounts (one-to-many)
- User → Transactions (one-to-many)
- Account → Transactions (one-to-many)
- Account → Investments (one-to-many)
- Category → Transactions (one-to-many)
- Investment → Trades (one-to-many)

## API Design

### RESTful Endpoints

- `GET /api/accounts` - List all accounts
- `POST /api/accounts` - Create new account
- `GET /api/transactions` - List transactions (with filters)
- `POST /api/transactions` - Create transaction
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `GET /api/analytics` - Get analytics data

### Authentication

Currently using placeholder user IDs. NextAuth.js integration needed for:
- User registration/login
- Session management
- Protected routes
- API route authentication

## Broker Integration

### Architecture

The broker integration uses an adapter pattern:

```typescript
interface IBrokerAdapter {
  connect(config: BrokerConfig): Promise<boolean>
  getAccounts(): Promise<BrokerAccount[]>
  getHoldings(accountId: string): Promise<BrokerHolding[]>
  getTrades(accountId: string): Promise<BrokerTrade[]>
}
```

### Supported Brokers

1. **Webull**: Official OpenAPI available
   - Status: Framework ready, implementation pending
   - API: https://developer.webull.com/api-doc/

2. **Robinhood**: 
   - Crypto: Official API available
   - Stocks: Unofficial libraries or manual entry
   - Status: Framework ready, implementation pending

### Security Considerations

- API keys stored encrypted in database
- OAuth flow for broker connections (recommended)
- Rate limiting for API calls
- Secure credential storage

## Features

### Expense Management
- Debit/credit card transaction tracking
- Category assignment and management
- Recurring transaction support
- Tag system for flexible organization

### Investment Tracking
- Multi-account support (brokerage, 401k, IRA, etc.)
- Holdings tracking with cost basis
- Trade logging and journaling
- Performance metrics (gains/losses, returns)

### Data Visualizations
- Cash flow charts (income vs expenses)
- Category spending breakdowns
- Monthly trends and comparisons
- Investment performance graphs

### Trading Journal
- Trade logging with entry/exit details
- Strategy tracking
- Outcome analysis (profit/loss)
- Performance review

### Investment Planner
- Goal setting with target amounts and dates
- Progress tracking
- Priority management
- Completion status

## Future Enhancements

1. **Authentication**: Full NextAuth.js integration
2. **Broker APIs**: Complete Webull and Robinhood integrations
3. **Data Import**: CSV/OFX file import for transactions
4. **Notifications**: Email/push notifications for account updates
5. **Mobile App**: React Native companion app
6. **Budgeting**: Budget creation and tracking
7. **Reports**: PDF export of financial reports
8. **Multi-currency**: Support for multiple currencies
9. **Recurring Transactions**: Automatic transaction creation
10. **AI Insights**: Spending pattern analysis and recommendations

## Development Workflow

1. **Database Changes**: 
   - Update `prisma/schema.prisma`
   - Run `npm run db:generate`
   - Run `npm run db:push`

2. **API Development**:
   - Create route handlers in `app/api/`
   - Use Prisma client from `lib/prisma.ts`
   - Add validation with Zod

3. **UI Development**:
   - Create pages in `app/dashboard/`
   - Build reusable components in `components/`
   - Use TanStack Query for data fetching

4. **Testing**:
   - Unit tests for utilities
   - Integration tests for API routes
   - E2E tests for critical flows

## Deployment

### Environment Variables

- `DATABASE_URL`: Database connection string
- `NEXTAUTH_URL`: Application URL
- `NEXTAUTH_SECRET`: Secret for session encryption
- Broker API keys (optional)

### Production Considerations

- Use PostgreSQL instead of SQLite
- Enable database connection pooling
- Set up proper error logging
- Implement rate limiting
- Use environment-specific configurations
- Set up CI/CD pipeline


