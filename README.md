# MakeCents - Financial Dashboard

A comprehensive financial dashboard application for managing expenses, tracking investments, and planning your financial future.

## Features

- 💳 **Expense Management**: Track debit and credit card expenses with category management
- 📊 **Data Visualizations**: Interactive charts for cash flow and spending analysis
- 📈 **Investment Tracking**: Connect with brokers (Robinhood, Webull) and track portfolio performance
- 📝 **Trading Journal**: Log and analyze your trades
- 🎯 **Investment Planner**: Plan and track your investment goals
- 🏦 **Multi-Account Support**: Manage personal broker, 401k, and other investment accounts

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma ORM (SQLite for development, PostgreSQL for production)
- **Authentication**: NextAuth.js
- **Charts**: Recharts
- **State Management**: TanStack Query
- **Testing**: Jest with React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- (Optional) PostgreSQL for production

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
```

3. Set up the database:
```bash
npm run db:generate
npm run db:push
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Database Management

- View database: `npm run db:studio`
- Generate Prisma client: `npm run db:generate`
- Push schema changes: `npm run db:push`

### Testing

- Run tests: `npm test`
- Watch mode: `npm run test:watch`
- Coverage: `npm run test:coverage`

See `docs/TESTING.md` for detailed testing guide.

## Project Structure

```
├── app/              # Next.js app router pages
├── components/       # React components
├── lib/             # Utility functions and configurations
├── prisma/          # Database schema
├── public/          # Static assets
└── types/           # TypeScript type definitions
```

## Features

### ✅ Implemented

- Expense tracking with categories
- Account management (checking, savings, credit cards, brokerages, 401k, etc.)
- Data visualizations (cash flow, category breakdowns)
- Investment tracking framework
- Trading journal UI
- Investment planner UI
- Broker integration framework (Webull, Robinhood)

### 🚧 In Progress / TODO

- User authentication (NextAuth.js)
- Broker API integrations (Webull, Robinhood)
- Form components for adding accounts/transactions
- Real-time data fetching with React Query
- CSV/OFX file import
- Budget management
- Mobile responsive optimizations

## API Integrations

- **Webull**: Official OpenAPI available - Framework ready, implementation pending
- **Robinhood**: Crypto API official, stock trading via unofficial libraries - Framework ready, implementation pending

See `docs/ARCHITECTURE.md` for detailed broker integration information.

## License

MIT

