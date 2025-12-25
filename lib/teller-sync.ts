import { tellerApiRequest } from './teller'
import { prisma } from './prisma'

/**
 * Map Teller transaction type to our transaction type
 */
function mapTellerTransactionType(tellerType: string, amount: string): 'EXPENSE' | 'INCOME' | 'TRANSFER' {
  const amountNum = parseFloat(amount)
  const isNegative = amountNum < 0

  if (tellerType === 'transfer') {
    return 'TRANSFER'
  }

  if (!isNegative && tellerType !== 'transfer') {
    return 'INCOME'
  }

  return 'EXPENSE'
}

/**
 * Map Teller category to our category
 */
function mapTellerCategory(tellerCategory: string | null | undefined): string | null {
  if (!tellerCategory) return null

  const categoryMap: Record<string, string> = {
    dining: 'Food & Dining',
    groceries: 'Food & Dining',
    bar: 'Food & Dining',
    clothing: 'Shopping',
    shopping: 'Shopping',
    electronics: 'Shopping',
    transport: 'Transportation',
    transportation: 'Transportation',
    fuel: 'Transportation',
    utilities: 'Bills & Utilities',
    phone: 'Bills & Utilities',
    insurance: 'Bills & Utilities',
    entertainment: 'Entertainment',
    sport: 'Entertainment',
    health: 'Health',
    home: 'Home',
    income: 'Salary',
    general: 'Other',
    service: 'Other',
    office: 'Other',
    software: 'Other',
    tax: 'Other',
    charity: 'Other',
    accommodation: 'Other',
    advertising: 'Other',
    education: 'Other',
    investment: 'Other',
    loan: 'Other',
  }

  return categoryMap[tellerCategory.toLowerCase()] || null
}

/**
 * Sync transactions from Teller API for a specific account
 * This is the core sync logic that can be called from multiple places
 */
export async function syncTellerTransactions(
  accountId: string,
  options: {
    startDate?: string
    endDate?: string
    userId: string // Now required - must be passed from API route
  }
) {
  const userId = options.userId
  const { startDate, endDate } = options

  // Get account from database
  const account = await prisma.account.findUnique({
    where: { id: accountId, userId },
  })

  if (!account) {
    throw new Error('Account not found')
  }

  if (!account.apiKey) {
    throw new Error('Account does not have Teller access token')
  }

  // Get Teller account ID from metadata
  const metadata = account.metadata ? JSON.parse(account.metadata) : {}
  const tellerAccountId = metadata.teller_account_id

  if (!tellerAccountId) {
    throw new Error('Account does not have Teller account ID')
  }

  // Build transactions endpoint URL
  const transactionsUrl = `/accounts/${tellerAccountId}/transactions`
  const queryParams: string[] = []
  if (startDate) {
    queryParams.push(`start_date=${startDate}`)
  }
  if (endDate) {
    queryParams.push(`end_date=${endDate}`)
  }

  const endpoint = queryParams.length > 0 
    ? `${transactionsUrl}?${queryParams.join('&')}`
    : transactionsUrl

  console.log('Syncing transactions from Teller API...', { 
    accountId, 
    tellerAccountId, 
    endpoint,
  })

  // Fetch transactions from Teller API
  const tellerTransactions = await tellerApiRequest(endpoint, account.apiKey, 'GET')
  
  if (!Array.isArray(tellerTransactions)) {
    throw new Error('Invalid response from Teller API')
  }

  console.log(`Received ${tellerTransactions.length} transactions from Teller`)

  // Process and store transactions
  const syncedTransactions = []
  const errors = []

  for (const tellerTx of tellerTransactions) {
    try {
      const tellerId = tellerTx.id
      const tellerTag = tellerId ? `teller:${tellerId}` : null

      // Check if transaction already exists (deduplication)
      let existingTx = null
      if (tellerTag) {
        existingTx = await prisma.transaction.findFirst({
          where: {
            userId,
            accountId,
            tags: {
              contains: tellerTag,
            },
          },
        })
      }

      const description =
        tellerTx.description ||
        tellerTx.details?.description ||
        tellerTx.details?.counterparty?.name ||
        'Teller transaction'

      if (!existingTx) {
        existingTx = await prisma.transaction.findFirst({
          where: {
            userId,
            accountId,
            description,
            date: new Date(tellerTx.date),
            amount: Math.abs(parseFloat(tellerTx.amount)),
          },
        })
      }

      if (existingTx) {
        continue // Skip duplicate
      }

      // Map Teller transaction to our format
      const amount = parseFloat(tellerTx.amount)
      const transactionType = mapTellerTransactionType(tellerTx.type || 'general', tellerTx.amount)
      
      // Get or create category
      let categoryId: string | null = null
      const tellerCategory = tellerTx.details?.category
      const categoryName = mapTellerCategory(tellerCategory)
      
      if (categoryName) {
        let category = await prisma.category.findFirst({
          where: {
            userId,
            name: categoryName,
          },
        })

        if (!category) {
          const categoryType = transactionType === 'INCOME' ? 'INCOME' : 'EXPENSE'
          category = await prisma.category.create({
            data: {
              userId,
              name: categoryName,
              type: categoryType,
              color: '#3b82f6',
            },
          })
        }

        categoryId = category.id
      }

      // Extract merchant from counterparty or description
      const merchant =
        tellerTx.details?.counterparty?.name ||
        (description.length > 50 ? description.substring(0, 50) : description) ||
        null

      const isLikelyRecurring =
        tellerTx.details?.recurring === true ||
        tellerTx.details?.counterparty?.type === 'ach' ||
        tellerTx.description.toLowerCase().includes('subscription') ||
        tellerTx.description.toLowerCase().includes('rent')

      // Create transaction
      const baseTags = tellerTx.status === 'pending' ? ['pending', 'teller'] : ['teller']
      const tags = tellerTag ? [...baseTags, tellerTag] : baseTags

      const transaction = await prisma.transaction.create({
        data: {
          userId,
          accountId,
          categoryId,
          amount: Math.abs(amount),
          type: transactionType,
          description,
          date: new Date(tellerTx.date),
          merchant,
          isRecurring: isLikelyRecurring,
          notes: tellerTx.status === 'pending' ? 'Pending transaction from Teller' : null,
          tags: JSON.stringify(tags),
        },
      })

      syncedTransactions.push({
        id: transaction.id,
        tellerId: tellerTx.id,
      })
    } catch (error: any) {
      console.error('Error processing transaction:', tellerTx.id, error.message)
      errors.push({
        tellerId: tellerTx.id,
        error: error.message,
      })
    }
  }

  return {
    success: true,
    synced: syncedTransactions.length,
    total: tellerTransactions.length,
    skipped: tellerTransactions.length - syncedTransactions.length - errors.length,
    errorCount: errors.length,
    transactions: syncedTransactions,
    errorDetails: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Sync transactions for all Teller-linked accounts
 */
export async function syncAllTellerAccounts(userId: string) {
  const actualUserId = userId

  // Get all Teller-linked accounts
  const accounts = await prisma.account.findMany({
    where: {
      userId: actualUserId,
      isActive: true,
      apiKey: { not: null }, // Has Teller access token
    },
  })

  const results = []
  for (const account of accounts) {
    try {
      const result = await syncTellerTransactions(account.id, {
        userId: actualUserId,
        // Sync last 30 days for background sync
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
      results.push({
        accountId: account.id,
        accountName: account.name,
        ...result,
      })
    } catch (error: any) {
      results.push({
        accountId: account.id,
        accountName: account.name,
        success: false,
        error: error.message,
      })
    }
  }

  return results
}

