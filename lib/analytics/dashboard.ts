import { prisma } from '@/lib/prisma'
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns'

type DashboardStats = {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlySurplus: number
  savingsRate: number
  investmentValue: number
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const now = new Date()
  const startOfCurrentMonth = startOfMonth(now)

  const [accountAgg, incomeAgg, expenseAgg, investmentAgg] = await Promise.all([
    prisma.account.aggregate({
      _sum: { balance: true },
      where: { userId, isActive: true },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        type: 'INCOME',
        date: {
          gte: startOfCurrentMonth,
        },
      },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        type: 'EXPENSE',
        date: {
          gte: startOfCurrentMonth,
        },
      },
    }),
    prisma.investment.aggregate({
      _sum: { totalValue: true },
      where: { userId },
    }),
  ])

  const monthlyIncome = incomeAgg._sum.amount || 0
  const monthlyExpenses = expenseAgg._sum.amount || 0
  const monthlySurplus = monthlyIncome - monthlyExpenses
  const savingsRate = monthlyIncome === 0 ? 0 : (monthlySurplus / monthlyIncome) * 100

  return {
    totalBalance: accountAgg._sum.balance || 0,
    monthlyIncome,
    monthlyExpenses,
    monthlySurplus,
    savingsRate,
    investmentValue: investmentAgg._sum.totalValue || 0,
  }
}

export async function getCashFlowSeries(userId: string, months = 6) {
  const now = new Date()
  const monthWindows = Array.from({ length: months }).map((_, index) => {
    const target = subMonths(startOfMonth(now), months - 1 - index)
    return {
      month: format(target, 'MMM yyyy'),
      start: target,
      end: endOfMonth(target),
    }
  })

  const rangeStart = monthWindows[0]?.start || startOfMonth(now)
  const rangeEnd = monthWindows[monthWindows.length - 1]?.end || endOfMonth(now)

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: rangeStart,
        lte: rangeEnd,
      },
    },
    select: {
      amount: true,
      type: true,
      date: true,
    },
  })

  return monthWindows.map((window) => {
    const monthIncome = transactions
      .filter(
        (t) =>
          t.type === 'INCOME' &&
          t.date >= window.start &&
          t.date <= window.end
      )
      .reduce((sum, t) => sum + t.amount, 0)

    const monthExpenses = transactions
      .filter(
        (t) =>
          t.type === 'EXPENSE' &&
          t.date >= window.start &&
          t.date <= window.end
      )
      .reduce((sum, t) => sum + t.amount, 0)

    const surplus = monthIncome - monthExpenses
    const rate = monthIncome === 0 ? 0 : (surplus / monthIncome) * 100

    return {
      month: window.month,
      income: monthIncome,
      expenses: monthExpenses,
      savingsRate: rate,
      surplus,
    }
  })
}

export async function getCategoryBreakdown(
  userId: string,
  startDate?: Date,
  endDate?: Date
) {
  const whereClause: any = {
    userId,
    type: 'EXPENSE',
  }

  if (startDate || endDate) {
    whereClause.date = {}
    if (startDate) whereClause.date.gte = startDate
    if (endDate) whereClause.date.lte = endDate
  }

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    include: {
      category: true,
    },
  })

  const totals: Record<
    string,
    { value: number; color?: string; name: string }
  > = {}

  transactions.forEach((transaction) => {
    const key = transaction.category?.id || 'uncategorized'
    const displayName = transaction.category?.name || 'Uncategorized'

    if (!totals[key]) {
      totals[key] = {
        value: 0,
        color: transaction.category?.color || '#6b7280',
        name: displayName,
      }
    }

    totals[key].value += transaction.amount
  })

  return Object.entries(totals)
    .map(([id, data]) => ({
      id,
      ...data,
    }))
    .sort((a, b) => b.value - a.value)
}

export async function getRecentTransactions(userId: string, limit = 5) {
  return prisma.transaction.findMany({
    where: { userId },
    include: {
      account: true,
      category: true,
    },
    orderBy: { date: 'desc' },
    take: limit,
  })
}

export async function getTopCategories(userId: string, limit = 5) {
  const breakdown = await getCategoryBreakdown(userId)
  return breakdown.slice(0, limit)
}


