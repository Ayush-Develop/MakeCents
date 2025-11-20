import { prisma } from './prisma'

export interface AccountPerformance {
  currentBalance: number
  previousBalance: number
  change: number
  changePercent: number
}

/**
 * Calculate account performance over the last month
 * For accounts with transactions, we calculate balance 1 month ago
 * For accounts without transactions, we use the account creation date
 */
export async function calculateAccountPerformance(
  accountId: string,
  currentBalance: number
): Promise<AccountPerformance> {
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  // Get account creation date
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { createdAt: true },
  })

  if (!account) {
    return {
      currentBalance,
      previousBalance: currentBalance,
      change: 0,
      changePercent: 0,
    }
  }

  // Get all transactions in the last month
  const transactions = await prisma.transaction.findMany({
    where: {
      accountId,
      date: {
        gte: oneMonthAgo,
      },
    },
  })

  // Calculate balance 1 month ago
  // Start with current balance and subtract transactions from last month
  let previousBalance = currentBalance
  for (const transaction of transactions) {
    if (transaction.type === 'INCOME') {
      previousBalance -= transaction.amount // Subtract income to get previous balance
    } else if (transaction.type === 'EXPENSE') {
      previousBalance += transaction.amount // Add expense back to get previous balance
    }
    // TRANSFER doesn't change total net worth, so we ignore it
  }

  // If account was created less than 1 month ago, use creation balance (0 or initial balance)
  if (account.createdAt > oneMonthAgo) {
    // Account is newer than 1 month, so previous balance is 0 (or we could use initial balance if tracked)
    previousBalance = 0
  }

  const change = currentBalance - previousBalance
  const changePercent = previousBalance !== 0 
    ? (change / Math.abs(previousBalance)) * 100 
    : currentBalance !== 0 ? 100 : 0

  return {
    currentBalance,
    previousBalance,
    change,
    changePercent,
  }
}

/**
 * Calculate performance for multiple accounts
 */
export async function calculateAccountsPerformance(
  accounts: Array<{ id: string; balance: number }>
): Promise<Map<string, AccountPerformance>> {
  const performanceMap = new Map<string, AccountPerformance>()

  await Promise.all(
    accounts.map(async (account) => {
      const performance = await calculateAccountPerformance(account.id, account.balance)
      performanceMap.set(account.id, performance)
    })
  )

  return performanceMap
}

/**
 * Calculate total performance for a group of accounts
 */
export function calculateTotalPerformance(
  performances: AccountPerformance[]
): AccountPerformance {
  const currentTotal = performances.reduce((sum, p) => sum + p.currentBalance, 0)
  const previousTotal = performances.reduce((sum, p) => sum + p.previousBalance, 0)
  const change = currentTotal - previousTotal
  const changePercent = previousTotal !== 0 
    ? (change / Math.abs(previousTotal)) * 100 
    : currentTotal !== 0 ? 100 : 0

  return {
    currentBalance: currentTotal,
    previousBalance: previousTotal,
    change,
    changePercent,
  }
}

