# Teller API Reference Guide

Based on official Teller API documentation: https://teller.io/docs/api

## Overview

Teller API uses:
- **Basic Authentication**: `Authorization: Basic base64(accessToken:)`
- **mTLS (Mutual TLS)**: Requires client certificates for development/production
- **RESTful endpoints**: Standard HTTP methods (GET, POST, DELETE)

## Accounts API

### Account Object Structure

According to [Teller Accounts API](https://teller.io/docs/api/accounts):

```json
{
  "id": "acc_oiin624kqjrg2mp2ea000",
  "enrollment_id": "enr_oiin624rqaojse22oe000",
  "name": "Platinum Card",
  "type": "depository" | "credit",
  "subtype": "checking" | "savings" | "credit_card" | "money_market" | "certificate_of_deposit" | "treasury" | "sweep",
  "currency": "USD",
  "last_four": "7857",
  "status": "open" | "closed",
  "institution": {
    "id": "security_cu",
    "name": "Security Credit Union"
  },
  "links": {
    "self": "https://api.teller.io/accounts/acc_oiin624kqjrg2mp2ea000",
    "details": "https://api.teller.io/accounts/acc_oiin624kqjrg2mp2ea000/details",
    "balances": "https://api.teller.io/accounts/acc_oiin624kqjrg2mp2ea000/balances",
    "transactions": "https://api.teller.io/accounts/acc_oiin624kqjrg2mp2ea000/transactions"
  }
}
```

### Key Points

1. **Institution is included**: The account object already contains `institution.name` and `institution.id` - no need to fetch separately!

2. **Balance is NOT in account**: Balance must be fetched from `/accounts/{id}/balances` endpoint

3. **Currency is in account**: The `currency` field is in the account object (ISO 4217 code)

4. **Account types**:
   - `depository`: Checking, Savings, Money Market, etc.
   - `credit`: Credit cards

5. **Status**: Accounts can be `open` or `closed`. Closed accounts return 410 errors.

### Endpoints

#### GET /accounts
List all accounts for the access token.

**Response**: Array of account objects

#### GET /accounts/:account_id
Get a specific account by ID.

**Response**: Single account object

#### GET /accounts/:account_id/balances
Get account balances. **This is required to get balance data!**

**Response**:
```json
{
  "account_id": "acc_oiin624iajrg2mp2ea000",
  "ledger": "28575.02",  // Total funds (string, nullable)
  "available": "28575.02",  // Available balance (string, nullable)
  "links": {
    "self": "https://api.teller.io/accounts/acc_oiin624iajrg2mp2ea000/balances",
    "account": "https://api.teller.io/accounts/acc_oiin624iajrg2mp2ea000"
  }
}
```

**Important**: 
- Balances are returned as **strings**, not numbers
- At least one of `ledger` or `available` is always provided
- Prefer `available` for checking accounts (shows pending transactions)
- Use `ledger` as fallback

#### DELETE /accounts/:account_id
Delete application's authorization to access the account.

#### DELETE /accounts
Delete all accounts in the enrollment (effectively deletes the enrollment).

## Authentication

### Basic Auth Format

Teller uses Basic authentication, not Bearer:

```typescript
const basicAuth = Buffer.from(`${accessToken.trim()}:`).toString('base64')
headers: {
  Authorization: `Basic ${basicAuth}`
}
```

### mTLS Certificates

Required for development and production environments:
- `TELLER_CERTIFICATE`: PEM format certificate
- `TELLER_PRIVATE_KEY`: PEM format private key
- `TELLER_ENV`: `sandbox` | `development` | `production`

In sandbox, certificates are optional but recommended.

## Error Handling

### Account Status Errors

If an account is `closed`, Teller returns:
- **Status**: 410 Gone
- **Error Code**: `account.closed`
- **Error Format**: Dot-separated string (e.g., `account.closed.insufficient_access`)

### Common Error Codes

- `not_found`: Resource doesn't exist
- `account.closed`: Account is closed
- `unauthorized`: Invalid access token
- `forbidden`: Insufficient permissions

## Implementation Notes

### Our Implementation

1. **Account Creation Flow**:
   ```
   Teller Connect → accessToken → GET /accounts → GET /accounts/{id} → GET /accounts/{id}/balances → Create in DB
   ```

2. **Data Mapping**:
   - `accountData.institution.name` → `provider` field
   - `accountData.last_four` → `accountNumber` field
   - `balanceData.available` or `balanceData.ledger` → `balance` field
   - `accountData.currency` → `currency` field
   - `accountData.type` + `accountData.subtype` → our `type` enum

3. **Credit Card Handling**:
   - Credit cards have `type: "credit"`
   - Balance should be negative (debt)
   - Convert positive balance to negative: `balance = -Math.abs(balance)`

4. **Institution Name**:
   - **DO NOT** fetch from `/institutions/{id}` endpoint
   - Use `accountData.institution.name` directly
   - This avoids 404 errors and is more efficient

## Best Practices

1. **Always fetch balance separately**: Account object doesn't include balance
2. **Use links object**: Prefer `accountData.links.balances` over constructing URLs
3. **Handle string balances**: Convert string to number: `parseFloat(balanceData.available)`
4. **Check account status**: Handle `closed` accounts gracefully
5. **Store enrollment_id**: Useful for future operations
6. **Log full responses**: Helps with debugging API changes

## Transactions API

### Transaction Object Structure

According to [Teller Transactions API](https://teller.io/docs/api/account/transactions):

```json
{
  "id": "txn_oiluj93igokseo0i3a000",
  "account_id": "acc_oiin624kqjrg2mp2ea000",
  "amount": "86.46",  // Signed amount as string
  "date": "2023-07-15",  // ISO 8601 date
  "description": "Transfer to Checking",
  "status": "posted" | "pending",
  "type": "card_payment" | "transfer" | "atm" | etc.,
  "running_balance": "28575.02",  // Only for posted transactions
  "details": {
    "processing_status": "complete" | "pending",
    "category": "general" | "dining" | "groceries" | etc.,  // nullable
    "counterparty": {
      "name": "YOURSELF",  // nullable
      "type": "person" | "organization"  // nullable
    }
  },
  "links": {
    "self": "https://api.teller.io/accounts/.../transactions/...",
    "account": "https://api.teller.io/accounts/..."
  }
}
```

### Key Points

1. **Amount is signed**: Negative = expense, Positive = income
2. **Amount is string**: Must parse with `parseFloat()`
3. **Date is ISO 8601**: Format `YYYY-MM-DD`
4. **Status**: `posted` (cleared) or `pending` (not yet cleared)
5. **Category enrichment**: Teller provides categories via `details.category`
6. **Counterparty**: Merchant/recipient info in `details.counterparty`

### Teller Categories

Teller uses these categories:
- `accommodation`, `advertising`, `bar`, `charity`, `clothing`, `dining`
- `education`, `electronics`, `entertainment`, `fuel`, `general`
- `groceries`, `health`, `home`, `income`, `insurance`, `investment`
- `loan`, `office`, `phone`, `service`, `shopping`, `software`
- `sport`, `tax`, `transport`, `transportation`, `utilities`

### Endpoints

#### GET /accounts/:account_id/transactions

List all transactions for an account.

**Query Parameters**:
- `count`: Max number of transactions (pagination)
- `from_id`: Start from transaction ID (pagination)
- `start_date`: Filter from date (ISO 8601, inclusive)
- `end_date`: Filter to date (ISO 8601, exclusive)

**Response**: Array of transaction objects

**Note**: Initial call can timeout for accounts with many transactions. Wait and retry if needed.

#### GET /accounts/:account_id/transactions/:transaction_id

Get a specific transaction by ID.

**Response**: Single transaction object

## Institutions API

### Institution Object

According to [Teller Institutions API](https://teller.io/docs/api/institutions):

```json
{
  "id": "chase",
  "name": "Chase",
  "products": ["verify", "balance", "transactions", "identity"]
}
```

### Endpoints

#### GET /institutions

List all institutions supported by Teller.

**Note**: Does NOT require authentication (no access token needed)

**Response**: Array of institution objects

**Use Case**: Populate institution dropdown in UI

## Related Endpoints

- **Account Details**: `/accounts/{id}/details` - Account number, routing numbers
- **Transactions**: `/accounts/{id}/transactions` - Transaction history
- **Enrollments**: `/enrollments/{id}` - Enrollment information (if needed)

## Implementation: Transaction Sync

### Our Sync Flow

1. **Fetch transactions** from `/accounts/{id}/transactions`
2. **Map Teller data** to our Transaction model:
   - `amount` (string) → `amount` (number, absolute value)
   - `type` + sign → `type` (EXPENSE/INCOME/TRANSFER)
   - `details.category` → Find/create Category
   - `details.counterparty.name` → `merchant`
   - `date` (ISO string) → `date` (DateTime)
3. **Deduplicate**: Check if transaction already exists
4. **Store**: Create transactions in database

### Category Mapping

We map Teller categories to our categories:
- `dining`, `groceries`, `bar` → "Food & Dining"
- `clothing`, `shopping`, `electronics` → "Shopping"
- `transport`, `transportation`, `fuel` → "Transportation"
- `utilities`, `phone`, `insurance` → "Bills & Utilities"
- `entertainment`, `sport` → "Entertainment"
- `income` → "Salary"
- Others → "Other" or create new category

## References

- [Teller Accounts API](https://teller.io/docs/api/accounts)
- [Teller Account Balances API](https://teller.io/docs/api/account/balances)
- [Teller Transactions API](https://teller.io/docs/api/account/transactions)
- [Teller Institutions API](https://teller.io/docs/api/institutions)
- [Teller Authentication](https://teller.io/docs/api/authentication)

