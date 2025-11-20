import { prisma } from '@/lib/prisma'
import { AnalyticsClient } from './AnalyticsClient'

type AnalyticsPageProps = {
  searchParams?: {
    accountId?: string
    account?: string
  }
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const userId = 'user-1' // TODO: replace with authenticated user
  const now = new Date()
  const startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1)

  const [transactions, accounts] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 2000,
    }),
    prisma.account.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        type: true,
      },
    }),
  ])

  const serializedTransactions = transactions.map((tx) => ({
    id: tx.id,
    amount: tx.amount,
    type: tx.type as 'EXPENSE' | 'INCOME' | 'TRANSFER',
    date: tx.date.toISOString(),
    description: tx.description,
    merchant: tx.merchant,
    isRecurring: tx.isRecurring,
    accountId: tx.accountId,
    account: tx.account,
    category: tx.category,
  }))

  return (
    <div className="p-6 md:p-8 space-y-6">
      <AnalyticsClient
        transactions={serializedTransactions}
        accounts={accounts}
        defaultAccountId={searchParams?.accountId || searchParams?.account}
      />
    </div>
  )
}


