# Database Schema Visual Diagram

## 📊 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                           USER                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ id (PK)                                                  │   │
│  │ email (unique)                                            │   │
│  │ name                                                      │   │
│  │ password                                                  │   │
│  │ createdAt, updatedAt                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (1 to Many)
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   ACCOUNT    │    │ TRANSACTION  │    │  CATEGORY    │
│              │    │              │    │              │
│ id (PK)      │    │ id (PK)      │    │ id (PK)      │
│ userId (FK)  │◄───┤ userId (FK)  │    │ userId (FK)  │
│ name         │    │ accountId(FK)├───►│ name         │
│ type         │    │ categoryId(FK)───►│ type         │
│ balance      │    │ amount       │    │ color        │
│ provider     │    │ type         │    │ parentId(FK)─┼──┐
│ ...          │    │ date         │    │ ...          │  │
└──────────────┘    └──────────────┘    └──────────────┘  │
        │                     │                            │
        │ (1 to Many)         │                            │
        │                     │                            │
        ▼                     ▼                            │
┌──────────────┐    ┌──────────────┐                      │
│ INVESTMENT   │    │    TRADE     │                      │
│              │    │              │                      │
│ id (PK)      │    │ id (PK)      │                      │
│ userId (FK)  │    │ userId (FK)  │                      │
│ accountId(FK)├───►│ accountId(FK)├───┐                  │
│ symbol       │    │ investmentId(FK)├─┘                  │
│ quantity     │    │ symbol       │                      │
│ ...          │    │ type (BUY/SELL)│                      │
└──────────────┘    └──────────────┘                      │
                                                           │
┌──────────────┐                                          │
│INVESTMENTGOAL│                                          │
│              │                                          │
│ id (PK)      │                                          │
│ userId (FK)  │                                          │
│ name         │                                          │
│ targetAmount │                                          │
│ ...          │                                          │
└──────────────┘                                          │
                                                           │
        ┌──────────────────────────────────────────────────┘
        │
        │ (Self-referential: parent/child categories)
        ▼
   CATEGORY
   └─── children: Category[]
```

## 🔄 Data Flow Examples

### Example 1: Adding a Transaction

```
User creates transaction
    ↓
Transaction record created
    ├──→ Links to User (userId)
    ├──→ Links to Account (accountId)
    └──→ Links to Category (categoryId, optional)
    ↓
Account balance updated automatically
    (balance = balance ± amount)
```

### Example 2: Investment Portfolio

```
User has Account (BROKERAGE)
    ↓
Account has Investments
    ├──→ AAPL: 10 shares @ $150 = $1,500
    ├──→ BTC: 0.5 coins @ $40,000 = $20,000
    └──→ ...
    ↓
Each Investment has Trades
    ├──→ Trade: BUY 10 AAPL @ $145
    ├──→ Trade: BUY 0.5 BTC @ $38,000
    └──→ ...
```

### Example 3: Category Hierarchy

```
Category: "Food & Dining" (parentId: null)
    ├──→ Category: "Groceries" (parentId: "food-id")
    ├──→ Category: "Restaurants" (parentId: "food-id")
    └──→ Category: "Fast Food" (parentId: "food-id")
```

## 📋 Field Types Reference

### Account Types
- `CHECKING` - Regular checking account
- `SAVINGS` - Savings account
- `CREDIT_CARD` - Credit card
- `BROKERAGE` - Investment brokerage
- `RETIREMENT_401K` - 401(k)
- `RETIREMENT_IRA` - Traditional IRA
- `RETIREMENT_ROTH_IRA` - Roth IRA
- `INVESTMENT` - Other investment
- `OTHER` - Other type

### Transaction Types
- `EXPENSE` - Money going out
- `INCOME` - Money coming in
- `TRANSFER` - Between accounts

### Category Types
- `EXPENSE` - For expenses
- `INCOME` - For income
- `TRANSFER` - For transfers

### Investment Types
- `STOCK` - Individual stocks
- `ETF` - Exchange-traded funds
- `CRYPTO` - Cryptocurrency
- `OPTION` - Stock options
- `BOND` - Bonds
- `MUTUAL_FUND` - Mutual funds
- `OTHER` - Other

### Trade Types
- `BUY` - Purchasing
- `SELL` - Selling

### Trade Outcomes
- `PROFIT` - Made money
- `LOSS` - Lost money
- `BREAK_EVEN` - Broke even
- `PENDING` - Not yet determined

## 🔍 Query Patterns

### Pattern 1: Get User's Financial Summary
```typescript
const user = await prisma.user.findUnique({
  where: { id: 'user-1' },
  include: {
    accounts: true,
    transactions: {
      where: { date: { gte: startOfMonth } }
    },
    investments: true
  }
})
```

### Pattern 2: Get Account with Transactions
```typescript
const account = await prisma.account.findUnique({
  where: { id: 'account-id' },
  include: {
    transactions: {
      include: { category: true },
      orderBy: { date: 'desc' }
    }
  }
})
```

### Pattern 3: Get Category with Subcategories
```typescript
const categories = await prisma.category.findMany({
  where: { 
    userId: 'user-1',
    parentId: null  // Top-level only
  },
  include: {
    children: true,  // Include subcategories
    transactions: {
      where: { date: { gte: startOfMonth } }
    }
  }
})
```

## 🎯 Key Design Principles

1. **User-Centric**: Everything belongs to a User
2. **Flexible**: Optional fields allow for gradual data entry
3. **Indexed**: Common queries are optimized
4. **Cascading**: Deleting a user cleans up all related data
5. **Extensible**: JSON fields allow for future features

## 💡 Tips

- Always filter by `userId` to ensure data isolation
- Use `include` to fetch related data in one query
- Use `select` to fetch only needed fields (faster)
- Indexes on foreign keys make joins faster
- `@@unique` constraints prevent duplicate data

