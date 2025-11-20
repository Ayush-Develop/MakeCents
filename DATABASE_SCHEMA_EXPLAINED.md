# Database Schema Explained

## 📊 Overview

The MakeCents database has **7 main models** that work together to track your complete financial picture:
1. **User** - The person using the app
2. **Account** - Financial accounts (checking, savings, credit cards, brokerages, etc.)
3. **Transaction** - Individual income/expense transactions
4. **Category** - Organization system for transactions
5. **Investment** - Current holdings (stocks, crypto, etc.)
6. **Trade** - Individual buy/sell transactions
7. **InvestmentGoal** - Financial goals and targets

---

## 👤 Model 1: User

**Purpose**: Represents a user account in the system.

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  accounts      Account[]
  transactions  Transaction[]
  categories    Category[]
  investments   Investment[]
  trades        Trade[]
  goals         InvestmentGoal[]
}
```

### Fields Explained

- **`id`**: Unique identifier (auto-generated with `cuid()`)
- **`email`**: User's email (must be unique)
- **`name`**: Optional display name
- **`password`**: Hashed password (never store plain text!)
- **`createdAt`**: When account was created (auto-set)
- **`updatedAt`**: Last update time (auto-updated)

### Relationships

The User has **one-to-many** relationships with:
- Accounts (one user has many accounts)
- Transactions (one user has many transactions)
- Categories (one user has many categories)
- Investments (one user has many investments)
- Trades (one user has many trades)
- Goals (one user has many goals)

**Key Point**: Everything in the system belongs to a User. This enables multi-user support!

---

## 💳 Model 2: Account

**Purpose**: Represents any financial account (checking, savings, credit card, brokerage, 401k, etc.)

```prisma
model Account {
  id            String      @id @default(cuid())
  userId        String
  name          String
  type          String      // CHECKING, SAVINGS, CREDIT_CARD, etc.
  provider      String?     // "chase", "robinhood", "webull", etc.
  accountNumber String?     // Last 4 digits
  balance       Float       @default(0)
  currency      String      @default("USD")
  isActive      Boolean     @default(true)
  apiKey        String?     // For broker integrations
  apiSecret     String?     // For broker integrations
  metadata      String?     // JSON for extra data
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  user          User        @relation(...)
  transactions  Transaction[]
  investments   Investment[]
  trades        Trade[]
  
  @@index([userId])
}
```

### Fields Explained

- **`id`**: Unique identifier
- **`userId`**: Which user owns this account (foreign key)
- **`name`**: Display name (e.g., "Chase Checking")
- **`type`**: Account type (CHECKING, SAVINGS, CREDIT_CARD, BROKERAGE, RETIREMENT_401K, etc.)
- **`provider`**: Bank/broker name (e.g., "Chase", "Robinhood")
- **`accountNumber`**: Last 4 digits or identifier
- **`balance`**: Current balance (can be negative for credit cards)
- **`currency`**: Currency code (USD, EUR, etc.)
- **`isActive`**: Whether account is still active
- **`apiKey`/`apiSecret`**: For connecting to broker APIs (should be encrypted!)
- **`metadata`**: JSON string for additional data

### Account Types

- **CHECKING**: Regular checking account
- **SAVINGS**: Savings account
- **CREDIT_CARD**: Credit card (balance is typically negative)
- **BROKERAGE**: Investment brokerage (Robinhood, Webull, etc.)
- **RETIREMENT_401K**: 401(k) retirement account
- **RETIREMENT_IRA**: Traditional IRA
- **RETIREMENT_ROTH_IRA**: Roth IRA
- **INVESTMENT**: Other investment accounts
- **OTHER**: Any other type

### Relationships

- **Belongs to**: One User
- **Has many**: Transactions, Investments, Trades

### Index

- **`@@index([userId])`**: Makes queries by userId faster

**Example**:
```typescript
// Find all accounts for a user
const accounts = await prisma.account.findMany({
  where: { userId: 'user-1' }
})
```

---

## 💰 Model 3: Transaction

**Purpose**: Individual income and expense transactions (money in/out)

```prisma
model Transaction {
  id            String      @id @default(cuid())
  userId        String
  accountId     String
  categoryId    String?
  amount        Float
  type          String      // EXPENSE, INCOME, TRANSFER
  description   String
  date          DateTime
  merchant      String?
  tags          String?     // JSON array
  notes         String?
  isRecurring   Boolean     @default(false)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  user          User        @relation(...)
  account       Account     @relation(...)
  category      Category?   @relation(...)
  
  @@index([userId])
  @@index([accountId])
  @@index([date])
  @@index([categoryId])
}
```

### Fields Explained

- **`id`**: Unique identifier
- **`userId`**: Which user owns this transaction
- **`accountId`**: Which account this transaction belongs to
- **`categoryId`**: Optional category (Food, Shopping, etc.)
- **`amount`**: Transaction amount (always positive)
- **`type`**: EXPENSE (money out), INCOME (money in), or TRANSFER (between accounts)
- **`description`**: What the transaction was for
- **`date`**: When the transaction occurred
- **`merchant`**: Where you spent/received money
- **`tags`**: JSON array of tags (e.g., ["groceries", "essential"])
- **`notes`**: Additional notes
- **`isRecurring`**: Whether this is a recurring transaction

### Transaction Types

- **EXPENSE**: Money going out (purchases, bills)
- **INCOME**: Money coming in (salary, freelance)
- **TRANSFER**: Moving money between accounts

### Relationships

- **Belongs to**: One User, One Account
- **Optionally belongs to**: One Category

### Indexes

Multiple indexes for fast queries:
- By userId (get all user's transactions)
- By accountId (get all transactions for an account)
- By date (filter by date range)
- By categoryId (get all transactions in a category)

**Example**:
```typescript
// Get all expenses this month
const expenses = await prisma.transaction.findMany({
  where: {
    userId: 'user-1',
    type: 'EXPENSE',
    date: {
      gte: new Date('2024-01-01'),
      lte: new Date('2024-01-31')
    }
  }
})
```

---

## 📁 Model 4: Category

**Purpose**: Organize transactions into categories (Food, Shopping, etc.)

```prisma
model Category {
  id            String      @id @default(cuid())
  userId        String
  name          String
  type          String      // EXPENSE, INCOME, TRANSFER
  color         String?     // Hex color for UI
  icon          String?     // Icon identifier
  parentId      String?     // For subcategories
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  user          User        @relation(...)
  transactions  Transaction[]
  parent        Category?   @relation("CategoryHierarchy", ...)
  children      Category[]  @relation("CategoryHierarchy")
  
  @@unique([userId, name])
  @@index([userId])
}
```

### Fields Explained

- **`id`**: Unique identifier
- **`userId`**: Which user owns this category
- **`name`**: Category name (e.g., "Food & Dining")
- **`type`**: EXPENSE, INCOME, or TRANSFER
- **`color`**: Hex color for UI (e.g., "#3b82f6")
- **`icon`**: Icon identifier (e.g., "utensils")
- **`parentId`**: For hierarchical categories (subcategories)

### Hierarchical Categories

Categories can have parent/child relationships:

```
Food & Dining (parent)
  ├── Groceries (child)
  ├── Restaurants (child)
  └── Fast Food (child)
```

**How it works**:
- A category with `parentId = null` is a top-level category
- A category with `parentId = "some-id"` is a subcategory

### Relationships

- **Belongs to**: One User
- **Has many**: Transactions
- **Self-referential**: Can have a parent category and child categories

### Constraints

- **`@@unique([userId, name])`**: A user can't have two categories with the same name

**Example**:
```typescript
// Get all categories with their subcategories
const categories = await prisma.category.findMany({
  where: { userId: 'user-1', parentId: null },
  include: { children: true }
})
```

---

## 📈 Model 5: Investment

**Purpose**: Current investment holdings (stocks, crypto, etc.)

```prisma
model Investment {
  id            String      @id @default(cuid())
  userId        String
  accountId     String
  symbol        String
  name          String?
  type          String      // STOCK, ETF, CRYPTO, etc.
  quantity      Float
  averageCost   Float       // Average purchase price
  currentPrice  Float?      // Latest market price
  totalValue    Float       // quantity * currentPrice
  totalCost     Float       // quantity * averageCost
  unrealizedGain Float      @default(0) // totalValue - totalCost
  lastUpdated   DateTime    @default(now())
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  user          User        @relation(...)
  account       Account     @relation(...)
  trades        Trade[]
  
  @@unique([userId, accountId, symbol])
  @@index([userId])
  @@index([accountId])
}
```

### Fields Explained

- **`id`**: Unique identifier
- **`userId`**: Which user owns this investment
- **`accountId`**: Which account this investment is in
- **`symbol`**: Stock/crypto symbol (e.g., "AAPL", "BTC")
- **`name`**: Full name (e.g., "Apple Inc.")
- **`type`**: STOCK, ETF, CRYPTO, OPTION, BOND, MUTUAL_FUND, OTHER
- **`quantity`**: How many shares/coins you own
- **`averageCost`**: Average price you paid per share
- **`currentPrice`**: Current market price (updated from API)
- **`totalValue`**: Current value (quantity × currentPrice)
- **`totalCost`**: What you paid (quantity × averageCost)
- **`unrealizedGain`**: Profit/loss (totalValue - totalCost)
- **`lastUpdated`**: When price was last updated

### Investment Types

- **STOCK**: Individual stocks
- **ETF**: Exchange-traded funds
- **CRYPTO**: Cryptocurrency
- **OPTION**: Stock options
- **BOND**: Bonds
- **MUTUAL_FUND**: Mutual funds
- **OTHER**: Other investment types

### Relationships

- **Belongs to**: One User, One Account
- **Has many**: Trades (buy/sell transactions)

### Constraints

- **`@@unique([userId, accountId, symbol])`**: Can't have duplicate investments in the same account

**Example**:
```typescript
// Get all investments for a user
const investments = await prisma.investment.findMany({
  where: { userId: 'user-1' },
  include: { account: true }
})
```

---

## 📝 Model 6: Trade

**Purpose**: Individual buy/sell transactions (for trading journal)

```prisma
model Trade {
  id            String      @id @default(cuid())
  userId        String
  accountId     String
  investmentId  String?
  symbol        String
  type          String      // BUY, SELL
  quantity      Float
  price         Float
  fees          Float       @default(0)
  totalAmount   Float       // quantity * price + fees
  date          DateTime
  notes         String?
  strategy      String?     // Trading strategy
  outcome       String?     // PROFIT, LOSS, BREAK_EVEN, PENDING
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  user          User        @relation(...)
  account       Account     @relation(...)
  investment    Investment? @relation(...)
  
  @@index([userId])
  @@index([accountId])
  @@index([date])
  @@index([symbol])
}
```

### Fields Explained

- **`id`**: Unique identifier
- **`userId`**: Which user made this trade
- **`accountId`**: Which account the trade was in
- **`investmentId`**: Optional link to Investment record
- **`symbol`**: Stock/crypto symbol (e.g., "AAPL")
- **`type`**: BUY or SELL
- **`quantity`**: Number of shares/coins
- **`price`**: Price per share/coin
- **`fees`**: Trading fees
- **`totalAmount`**: Total cost (quantity × price + fees)
- **`date`**: When the trade occurred
- **`notes`**: Additional notes
- **`strategy`**: Trading strategy used
- **`outcome`**: PROFIT, LOSS, BREAK_EVEN, or PENDING

### Trade Types

- **BUY**: Purchasing shares/coins
- **SELL**: Selling shares/coins

### Outcomes

- **PROFIT**: Trade made money
- **LOSS**: Trade lost money
- **BREAK_EVEN**: Trade broke even
- **PENDING**: Outcome not yet determined

### Relationships

- **Belongs to**: One User, One Account
- **Optionally belongs to**: One Investment

### Indexes

- By userId, accountId, date, and symbol for fast queries

**Example**:
```typescript
// Get all profitable trades
const profitableTrades = await prisma.trade.findMany({
  where: {
    userId: 'user-1',
    outcome: 'PROFIT'
  },
  orderBy: { date: 'desc' }
})
```

---

## 🎯 Model 7: InvestmentGoal

**Purpose**: Financial goals and targets (e.g., "Save $10,000 for emergency fund")

```prisma
model InvestmentGoal {
  id            String      @id @default(cuid())
  userId        String
  name          String
  description   String?
  targetAmount  Float
  currentAmount Float       @default(0)
  targetDate    DateTime?
  priority      Int         @default(0)
  isCompleted   Boolean     @default(false)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  user          User        @relation(...)
  
  @@index([userId])
}
```

### Fields Explained

- **`id`**: Unique identifier
- **`userId`**: Which user owns this goal
- **`name`**: Goal name (e.g., "Emergency Fund")
- **`description`**: More details
- **`targetAmount`**: How much you want to save
- **`currentAmount`**: How much you have saved so far
- **`targetDate`**: Optional deadline
- **`priority`**: Priority level (0-10, higher = more important)
- **`isCompleted`**: Whether goal is completed

### Progress Calculation

```typescript
const progress = (currentAmount / targetAmount) * 100
```

### Relationships

- **Belongs to**: One User

**Example**:
```typescript
// Get all active goals
const activeGoals = await prisma.investmentGoal.findMany({
  where: {
    userId: 'user-1',
    isCompleted: false
  },
  orderBy: { priority: 'desc' }
})
```

---

## 🔗 Relationships Summary

### One-to-Many Relationships

```
User (1) ──→ (Many) Accounts
User (1) ──→ (Many) Transactions
User (1) ──→ (Many) Categories
User (1) ──→ (Many) Investments
User (1) ──→ (Many) Trades
User (1) ──→ (Many) InvestmentGoals

Account (1) ──→ (Many) Transactions
Account (1) ──→ (Many) Investments
Account (1) ──→ (Many) Trades

Category (1) ──→ (Many) Transactions
Investment (1) ──→ (Many) Trades
```

### Many-to-One Relationships

```
Transaction (Many) ──→ (1) User
Transaction (Many) ──→ (1) Account
Transaction (Many) ──→ (1) Category (optional)

Investment (Many) ──→ (1) User
Investment (Many) ──→ (1) Account

Trade (Many) ──→ (1) User
Trade (Many) ──→ (1) Account
Trade (Many) ──→ (1) Investment (optional)
```

### Self-Referential

```
Category (1) ──→ (Many) Category (children)
Category (Many) ──→ (1) Category (parent)
```

---

## 🔐 Cascade Deletes

When a parent record is deleted, related records are handled:

- **`onDelete: Cascade`**: Delete related records
  - Delete User → Delete all their Accounts, Transactions, etc.
  - Delete Account → Delete all Transactions, Investments, Trades

- **`onDelete: SetNull`**: Set foreign key to null
  - Delete Category → Transactions keep categoryId as null
  - Delete Investment → Trades keep investmentId as null

---

## 📊 Indexes Explained

Indexes make queries faster by creating lookup tables:

- **`@@index([userId])`**: Fast queries by user
- **`@@index([accountId])`**: Fast queries by account
- **`@@index([date])`**: Fast date range queries
- **`@@index([categoryId])`**: Fast category filtering
- **`@@index([symbol])`**: Fast symbol lookups

**Example**: Without index, finding all transactions for a user might scan every row. With index, it's instant!

---

## 🎯 Design Decisions

### Why String instead of Enum?

SQLite doesn't support enums, so we use strings with comments indicating valid values. In production with PostgreSQL, you could use actual enums.

### Why JSON for tags/metadata?

Flexible storage for variable data. Tags are stored as JSON array string: `'["groceries", "essential"]'`

### Why separate Investment and Trade?

- **Investment**: Current holdings (what you own now)
- **Trade**: Historical transactions (what you bought/sold)

This allows:
- Track current portfolio (Investments)
- Analyze trading history (Trades)
- Calculate performance over time

---

## 💡 Common Queries

### Get all accounts with their balances
```typescript
const accounts = await prisma.account.findMany({
  where: { userId: 'user-1' },
  select: { name: true, balance: true, type: true }
})
```

### Get monthly expenses
```typescript
const expenses = await prisma.transaction.findMany({
  where: {
    userId: 'user-1',
    type: 'EXPENSE',
    date: {
      gte: new Date('2024-01-01'),
      lte: new Date('2024-01-31')
    }
  },
  include: { category: true }
})
```

### Get portfolio value
```typescript
const investments = await prisma.investment.findMany({
  where: { userId: 'user-1' }
})
const totalValue = investments.reduce((sum, inv) => sum + inv.totalValue, 0)
```

---

## 🚀 Next Steps

Now that you understand the schema, you can:
1. Write custom queries
2. Add new fields
3. Create relationships
4. Optimize with indexes

Want to learn how to query this data? Let's build some features!

