import { prisma } from '@/lib/prisma'
import { TransactionsClient } from './TransactionsClient'
import { getServerUserId } from '@/lib/auth'

// This is a Server Component that fetches data
export default async function ExpensesPage() {
  const userId = getServerUserId()

  // Fetch transactions with related data
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    include: {
      account: true,
      category: true,
    },
    orderBy: { date: 'desc' },
    take: 1000, // Limit to prevent performance issues
  })

  // Fetch categories
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  })

  // Fetch accounts
  const accounts = await prisma.account.findMany({
    where: { userId, isActive: true },
    orderBy: { name: 'asc' },
  })

  // Transform transactions for client component
  const transformedTransactions = transactions.map(tx => ({
    ...tx,
    date: tx.date.toISOString(),
  }))

  return (
    <TransactionsClient
      initialTransactions={transformedTransactions}
      initialCategories={categories}
      initialAccounts={accounts}
    />
  )
}
