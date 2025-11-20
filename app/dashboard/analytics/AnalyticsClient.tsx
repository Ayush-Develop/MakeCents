'use client'

import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { Card } from '@/components/Card'
import { CashFlowChart } from '@/components/charts/CashFlowChart'
import { CategoryChart } from '@/components/charts/CategoryChart'
import { cn, formatCurrency, formatDateShort } from '@/lib/utils'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarRange,
  CreditCard,
  Repeat,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER'

type AnalyticsTransaction = {
  id: string
  amount: number
  type: TransactionType
  date: string
  description: string
  merchant: string | null
  isRecurring: boolean
  accountId: string
  account: {
    id: string
    name: string
    type: string
  }
  category: {
    id: string
    name: string
    color: string | null
  } | null
}

type AnalyticsAccount = {
  id: string
  name: string
  type: string
}

type DateRangeKey = '90d' | '180d' | '365d'

const DATE_RANGE_PRESETS: Record<DateRangeKey, { label: string; shortLabel: string; days: number }> = {
  '90d': { label: 'Last 90 days', shortLabel: '90d', days: 90 },
  '180d': { label: 'Last 6 months', shortLabel: '6m', days: 180 },
  '365d': { label: 'Last 12 months', shortLabel: '12m', days: 365 },
}

const MS_IN_DAY = 1000 * 60 * 60 * 24

type RecurringCharge = {
  label: string
  total: number
  avgAmount: number
  cadence: string
  occurrences: number
  category?: string
  nextCharge?: string
}

type MerchantStat = {
  label: string
  total: number
  count: number
}

type CategoryStat = {
  label: string
  total: number
  color?: string | null
}

type AnalyticsSummary = {
  totals: { income: number; expenses: number }
  netCashFlow: number
  avgDailySpend: number
  recurringCharges: RecurringCharge[]
  recurringShare: number
  topMerchants: MerchantStat[]
  topCategories: CategoryStat[]
  cashFlowSeries: Array<{ month: string; income: number; expenses: number; key: string }>
  categoryChartData: Array<{ name: string; value: number; color?: string | null }>
  rangeStart: Date
  rangeEnd: Date
  spendDeltaPct: number | null
  incomeDeltaPct: number | null
}

interface AnalyticsClientProps {
  transactions: AnalyticsTransaction[]
  accounts: AnalyticsAccount[]
  defaultAccountId?: string
}

export function AnalyticsClient({ transactions, accounts, defaultAccountId }: AnalyticsClientProps) {
  const initialAccount = useMemo(() => {
    if (defaultAccountId && accounts.some(acc => acc.id === defaultAccountId)) {
      return defaultAccountId
    }
    return 'all'
  }, [accounts, defaultAccountId])

  const [selectedAccount, setSelectedAccount] = useState<string>(initialAccount)
  const [dateRange, setDateRange] = useState<DateRangeKey>('90d')

  useEffect(() => {
    setSelectedAccount(initialAccount)
  }, [initialAccount])

  const preset = DATE_RANGE_PRESETS[dateRange]

  const {
    filteredTransactions,
    rangeStart: rangeStartDate,
    rangeEnd: rangeEndDate,
    rangeStartMs,
    rangeEndMs,
  } = useMemo(() => {
    const rangeEndDate = endOfDay(new Date())
    const rangeStartDate = startOfDay(new Date(rangeEndDate))
    rangeStartDate.setDate(rangeStartDate.getDate() - (preset.days - 1))

    const startMs = rangeStartDate.getTime()
    const endMs = rangeEndDate.getTime()

    const filtered = transactions.filter((tx) => {
      const txTime = new Date(tx.date).getTime()
      if (txTime < startMs || txTime > endMs) {
        return false
      }
      if (selectedAccount !== 'all' && tx.accountId !== selectedAccount) {
        return false
      }
      return true
    })

    return {
      filteredTransactions: filtered,
      rangeStart: rangeStartDate,
      rangeEnd: rangeEndDate,
      rangeStartMs: startMs,
      rangeEndMs: endMs,
    }
  }, [transactions, selectedAccount, dateRange, preset.days])

  const analytics = useMemo<AnalyticsSummary>(() => {
    const totals = filteredTransactions.reduce(
      (acc, tx) => {
        if (tx.type === 'EXPENSE') {
          acc.expenses += tx.amount
        } else if (tx.type === 'INCOME') {
          acc.income += tx.amount
        }
        return acc
      },
      { income: 0, expenses: 0 }
    )

    const netCashFlow = totals.income - totals.expenses
    const spanDays = Math.max(1, Math.round((rangeEndMs - rangeStartMs) / MS_IN_DAY))
    const avgDailySpend = spanDays ? totals.expenses / spanDays : 0

    const { cashFlowSeries, spendDeltaPct, incomeDeltaPct } = buildCashFlowSeries(filteredTransactions, rangeStartDate, rangeEndDate)
    const categoryChartData = buildCategoryData(filteredTransactions)
    const recurringCharges = buildRecurringCharges(filteredTransactions)
    const recurringTotal = recurringCharges.reduce((sum, item) => sum + item.total, 0)
    const recurringShare = totals.expenses > 0 ? (recurringTotal / totals.expenses) * 100 : 0
    const topMerchants = buildMerchantStats(filteredTransactions)
    const topCategories = categoryChartData.slice(0, 4).map(item => ({
      label: item.name,
      total: item.value,
      color: item.color,
    }))

    return {
      totals,
      netCashFlow,
      avgDailySpend,
      recurringCharges,
      recurringShare,
      topMerchants,
      topCategories,
      cashFlowSeries,
      categoryChartData,
      rangeStart: rangeStartDate,
      rangeEnd: rangeEndDate,
      spendDeltaPct,
      incomeDeltaPct,
    }
  }, [filteredTransactions, rangeStartMs, rangeEndMs, rangeStartDate, rangeEndDate])

  const {
    totals,
    netCashFlow,
    avgDailySpend,
    recurringCharges,
    recurringShare,
    topMerchants,
    topCategories,
    cashFlowSeries,
    categoryChartData,
    rangeStart,
    rangeEnd,
    spendDeltaPct,
    incomeDeltaPct,
  } = analytics

  const presetLabel = preset.label
  const rangeWindowLabel = `${formatDateShort(rangeStart)} · ${formatDateShort(rangeEnd)}`
  const topMerchant = topMerchants[0]
  const topCategory = topCategories[0]

  const insights = buildInsights({
    recurringShare,
    recurringCharges,
    spendDeltaPct,
    incomeDeltaPct,
    netCashFlow,
    avgDailySpend,
    topMerchant,
    topCategory,
  })

  const trendHighlights = buildTrendHighlights({
    spendDeltaPct,
    incomeDeltaPct,
    netCashFlow,
    totals,
    topCategory,
  })

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>{presetLabel}</span>
            <span>•</span>
            <span>{rangeWindowLabel}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Deep dive into recurring spend, trends, and account-level performance.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 shadow-sm">
            <CreditCard className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <select
              value={selectedAccount}
              onChange={(event) => setSelectedAccount(event.target.value)}
              className="bg-transparent text-sm font-medium text-gray-900 dark:text-white focus:outline-none"
            >
              <option value="all">All cards</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-gray-500 dark:text-gray-400 hidden md:block" />
            <div className="flex items-center gap-2 rounded-full bg-gray-100/60 dark:bg-gray-900/60 p-1">
              {(Object.keys(DATE_RANGE_PRESETS) as DateRangeKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDateRange(key)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold rounded-full transition border border-transparent',
                    dateRange === key
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  {DATE_RANGE_PRESETS[key].shortLabel}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {filteredTransactions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
          <AlertTriangle className="w-10 h-10 text-gray-400 mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No transactions yet</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl">
            Connect an account or import transactions to unlock analytics for recurring charges, categories, and spending trends.
          </p>
        </Card>
      ) : (
        <>
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              title="Net cash flow"
              value={formatCurrency(netCashFlow)}
              delta={netCashFlow >= 0 ? 'Surplus' : 'Deficit'}
              icon={netCashFlow >= 0 ? ArrowUpRight : ArrowDownRight}
              tone={netCashFlow >= 0 ? 'positive' : 'negative'}
            />
            <KpiCard
              title="Total income"
              value={formatCurrency(totals.income)}
              delta={`${DATE_RANGE_PRESETS[dateRange].shortLabel} window`}
              icon={TrendingUp}
              tone="neutral"
            />
            <KpiCard
              title="Avg daily spend"
              value={formatCurrency(avgDailySpend)}
              delta="Smoothed by range"
              icon={TrendingDown}
              tone="neutral"
            />
            <KpiCard
              title="Recurring share"
              value={`${recurringShare.toFixed(1)}%`}
              delta={recurringCharges.length ? `${recurringCharges.length} active` : 'No recurring spend'}
              icon={Repeat}
              tone={recurringShare >= 40 ? 'warning' : 'neutral'}
            />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            <Card className="xl:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Cash flow</h2>
                <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Income vs spend
                </span>
              </div>
              <CashFlowChart data={cashFlowSeries} height={340} />
            </Card>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Category mix</h2>
                <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Top 6 categories
                </span>
              </div>
              <CategoryChart data={categoryChartData} height={340} />
            </Card>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recurring charges</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Subscriptions and repeat merchants we detected automatically.
                  </p>
                </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">{recurringCharges.length} tracked</span>
              </div>
              {recurringCharges.length === 0 ? (
                <EmptyState message="No recurring payments detected in this range." />
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recurringCharges.map((charge, index) => (
                    <div key={`${charge.label}-${index}`} className="py-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {charge.label}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium">
                            {charge.cadence}
                          </span>
                          {charge.category && <span>{charge.category}</span>}
                          {charge.nextCharge && (
                            <>
                              <span>•</span>
                              <span>Next {charge.nextCharge}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(charge.avgAmount)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {charge.occurrences} charges · {formatCurrency(charge.total)} total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Common charges</h2>
                <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Frequent spend
                </span>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">Top merchants</p>
                  <div className="space-y-3">
                    {topMerchants.slice(0, 4).map((merchant, index) => (
                      <StatBar
                        key={merchant.label}
                        label={merchant.label}
                        value={formatCurrency(merchant.total)}
                        supporting={`${merchant.count} charges`}
                        percent={topMerchants[0] ? (merchant.total / topMerchants[0].total) * 100 : 0}
                        accentIndex={index}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">Top categories</p>
                  <div className="space-y-3">
                    {topCategories.map((category, index) => (
                      <StatBar
                        key={category.label}
                        label={category.label}
                        value={formatCurrency(category.total)}
                        supporting={index === 0 ? 'Primary driver' : 'Supporting'}
                        percent={topCategories[0] ? (category.total / topCategories[0].total) * 100 : 0}
                        accentColor={category.color || undefined}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Trends & alerts</h2>
                <Sparkles className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="space-y-4">
                {trendHighlights.map((trend) => (
                  <div
                    key={trend.title}
                    className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 dark:border-gray-800 p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {trend.icon}
                        {trend.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {trend.description}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        trend.tone === 'positive'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : trend.tone === 'negative'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-gray-900 dark:text-white'
                      )}
                    >
                      {trend.value}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Insights</h2>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/60">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{insight}</p>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </>
      )}
    </div>
  )
}

function buildCashFlowSeries(transactions: AnalyticsTransaction[], start: Date, end: Date) {
  const months: string[] = []
  const labels: Record<string, string> = {}
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)

  while (cursor <= endMonth) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
    months.push(key)
    labels[key] = cursor.toLocaleString('en-US', { month: 'short' })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  const bucket: Record<string, { income: number; expenses: number }> = months.reduce(
    (acc, month) => {
      acc[month] = { income: 0, expenses: 0 }
      return acc
    },
    {} as Record<string, { income: number; expenses: number }>
  )

  transactions.forEach((tx) => {
    const date = new Date(tx.date)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!bucket[key]) return
    if (tx.type === 'INCOME') {
      bucket[key].income += tx.amount
    } else if (tx.type === 'EXPENSE') {
      bucket[key].expenses += tx.amount
    }
  })

  const cashFlowSeries = months.map((month) => ({
    month: labels[month],
    income: Number(bucket[month].income.toFixed(2)),
    expenses: Number(bucket[month].expenses.toFixed(2)),
    key: month,
  }))

  const last = months[months.length - 1]
  const previous = months[months.length - 2]

  const spendDeltaPct =
    previous && bucket[previous].expenses > 0
      ? ((bucket[last].expenses - bucket[previous].expenses) / bucket[previous].expenses) * 100
      : null

  const incomeDeltaPct =
    previous && bucket[previous].income > 0
      ? ((bucket[last].income - bucket[previous].income) / bucket[previous].income) * 100
      : null

  return { cashFlowSeries, spendDeltaPct, incomeDeltaPct }
}

function startOfDay(date: Date) {
  const cloned = new Date(date)
  cloned.setHours(0, 0, 0, 0)
  return cloned
}

function endOfDay(date: Date) {
  const cloned = new Date(date)
  cloned.setHours(23, 59, 59, 999)
  return cloned
}

function buildCategoryData(transactions: AnalyticsTransaction[]) {
  const categoryMap = new Map<string, { value: number; color?: string | null }>()

  transactions
    .filter((tx) => tx.type === 'EXPENSE')
    .forEach((tx) => {
      const key = tx.category?.name || tx.merchant || tx.description
      if (!key) return
      const current = categoryMap.get(key) || { value: 0, color: tx.category?.color }
      current.value += tx.amount
      if (!current.color && tx.category?.color) {
        current.color = tx.category.color
      }
      categoryMap.set(key, current)
    })

  return Array.from(categoryMap.entries())
    .map(([name, data]) => ({
      name,
      value: Number(data.value.toFixed(2)),
      color: data.color,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
}

function buildRecurringCharges(transactions: AnalyticsTransaction[]): RecurringCharge[] {
  const expenses = transactions.filter((tx) => tx.type === 'EXPENSE')
  type InterimCharge = RecurringCharge & { flagged: boolean }
  const groups = new Map<
    string,
    {
      label: string
      total: number
      occurrences: number
      dates: number[]
      category?: string
      flagged: boolean
    }
  >()

  expenses.forEach((tx) => {
    const key = (tx.merchant || tx.description || '').toLowerCase().trim()
    if (!key) return
    const existing = groups.get(key) || {
      label: tx.merchant?.trim() || tx.description,
      total: 0,
      occurrences: 0,
      dates: [],
      category: tx.category?.name || undefined,
      flagged: tx.isRecurring,
    }
    existing.total += tx.amount
    existing.occurrences += 1
    existing.dates.push(new Date(tx.date).getTime())
    existing.flagged = existing.flagged || tx.isRecurring
    if (!existing.category && tx.category?.name) {
      existing.category = tx.category.name
    }
    groups.set(key, existing)
  })

  const summarized: InterimCharge[] = Array.from(groups.values())
    .map((group): InterimCharge => {
      const avgAmount = group.total / group.occurrences
      const cadenceDays = averageInterval(group.dates)
      const cadence = describeCadence(cadenceDays)
      const nextCharge = cadenceDays
        ? formatDateShort(new Date(Math.max(...group.dates) + cadenceDays * MS_IN_DAY))
        : undefined
      return {
        label: group.label,
        total: group.total,
        avgAmount,
        cadence,
        occurrences: group.occurrences,
        category: group.category,
        nextCharge,
        flagged: group.flagged,
      }
    })

  return summarized
    .filter((charge) => charge.occurrences >= 3 || charge.flagged)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)
    .map(({ flagged, ...rest }) => rest)
}

function buildMerchantStats(transactions: AnalyticsTransaction[]): MerchantStat[] {
  const expenses = transactions.filter((tx) => tx.type === 'EXPENSE')
  const map = new Map<string, { total: number; count: number }>()

  expenses.forEach((tx) => {
    const key = tx.merchant?.trim() || tx.description
    if (!key) return
    const current = map.get(key) || { total: 0, count: 0 }
    current.total += tx.amount
    current.count += 1
    map.set(key, current)
  })

  return Array.from(map.entries())
    .map(([label, data]) => ({ label, total: data.total, count: data.count }))
    .sort((a, b) => b.total - a.total)
}

function averageInterval(dates: number[]) {
  if (dates.length < 2) return null
  const sorted = [...dates].sort((a, b) => a - b)
  const deltas: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    deltas.push((sorted[i] - sorted[i - 1]) / MS_IN_DAY)
  }
  return deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length
}

function describeCadence(interval: number | null) {
  if (!interval) return 'Irregular'
  if (interval < 8) return 'Weekly'
  if (interval < 16) return 'Bi-weekly'
  if (interval < 40) return 'Monthly'
  if (interval < 80) return 'Every other month'
  if (interval < 120) return 'Quarterly'
  return 'Occasional'
}

function buildInsights({
  recurringShare,
  recurringCharges,
  spendDeltaPct,
  incomeDeltaPct,
  netCashFlow,
  avgDailySpend,
  topMerchant,
  topCategory,
}: {
  recurringShare: number
  recurringCharges: RecurringCharge[]
  spendDeltaPct: number | null
  incomeDeltaPct: number | null
  netCashFlow: number
  avgDailySpend: number
  topMerchant?: MerchantStat
  topCategory?: CategoryStat
}) {
  const insights: string[] = []

  if (recurringShare > 0) {
    insights.push(`Recurring charges represent ${recurringShare.toFixed(1)}% of your spending window.`)
  }

  if (recurringCharges[0]) {
    insights.push(
      `${recurringCharges[0].label} averages ${formatCurrency(recurringCharges[0].avgAmount)} per charge with a ${recurringCharges[0].cadence.toLowerCase()} cadence.`
    )
  }

  if (typeof spendDeltaPct === 'number') {
    insights.push(
      `Spending is ${spendDeltaPct >= 0 ? 'up' : 'down'} ${Math.abs(spendDeltaPct).toFixed(1)}% versus last month.`
    )
  }

  if (typeof incomeDeltaPct === 'number') {
    insights.push(
      `Income is ${incomeDeltaPct >= 0 ? 'up' : 'down'} ${Math.abs(incomeDeltaPct).toFixed(1)}% month-over-month.`
    )
  }

  if (topMerchant) {
    insights.push(
      `${topMerchant.label} is your most expensive merchant with ${topMerchant.count} charges in this range.`
    )
  }

  if (topCategory) {
    insights.push(`${topCategory.label} remains the leading category for discretionary spend.`)
  }

  insights.push(
    `Average daily spend is ${formatCurrency(avgDailySpend)}${avgDailySpend > 0 ? ' per day' : ''}, leading to a ${
      netCashFlow >= 0 ? 'positive' : 'negative'
    } cash flow of ${formatCurrency(Math.abs(netCashFlow))}.`
  )

  return insights.slice(0, 6)
}

function buildTrendHighlights({
  spendDeltaPct,
  incomeDeltaPct,
  netCashFlow,
  totals,
  topCategory,
}: {
  spendDeltaPct: number | null
  incomeDeltaPct: number | null
  netCashFlow: number
  totals: { income: number; expenses: number }
  topCategory?: CategoryStat
}) {
  return [
    {
      title: 'Spending trend',
      description: `Current spend ${formatCurrency(totals.expenses)}`,
      value: typeof spendDeltaPct === 'number' ? `${spendDeltaPct >= 0 ? '+' : '-'}${Math.abs(spendDeltaPct).toFixed(1)}%` : '—',
      tone: spendDeltaPct !== null && spendDeltaPct <= 0 ? 'positive' : spendDeltaPct ? 'negative' : 'neutral',
      icon: <TrendingDown className="w-4 h-4 text-indigo-500" />,
    },
    {
      title: 'Income trend',
      description: `Current income ${formatCurrency(totals.income)}`,
      value: typeof incomeDeltaPct === 'number' ? `${incomeDeltaPct >= 0 ? '+' : '-'}${Math.abs(incomeDeltaPct).toFixed(1)}%` : '—',
      tone: incomeDeltaPct !== null && incomeDeltaPct >= 0 ? 'positive' : incomeDeltaPct ? 'negative' : 'neutral',
      icon: <TrendingUp className="w-4 h-4 text-emerald-500" />,
    },
    {
      title: 'Net position',
      description: netCashFlow >= 0 ? 'You are cash-flow positive' : 'Cash outflow exceeds income',
      value: formatCurrency(netCashFlow),
      tone: netCashFlow >= 0 ? 'positive' : 'negative',
      icon: netCashFlow >= 0 ? (
        <ArrowUpRight className="w-4 h-4 text-emerald-500" />
      ) : (
        <ArrowDownRight className="w-4 h-4 text-rose-500" />
      ),
    },
    {
      title: 'Top category',
      description: topCategory ? `${topCategory.label} leads this period` : 'Track categories as data arrives',
      value: topCategory ? formatCurrency(topCategory.total) : '—',
      tone: 'neutral',
      icon: <BarChart3 className="w-4 h-4 text-sky-500" />,
    },
  ]
}

function KpiCard({
  title,
  value,
  delta,
  icon: Icon,
  tone = 'neutral',
}: {
  title: string
  value: string
  delta: string
  icon: ComponentType<{ className?: string }>
  tone?: 'positive' | 'negative' | 'neutral' | 'warning'
}) {
  const toneClasses =
    tone === 'positive'
      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
      : tone === 'negative'
      ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300'
      : tone === 'warning'
      ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300'
      : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300'

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <span className={cn('p-2 rounded-full text-xs', toneClasses)}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{delta}</p>
    </Card>
  )
}

function StatBar({
  label,
  value,
  supporting,
  percent,
  accentIndex,
  accentColor,
}: {
  label: string
  value: string
  supporting: string
  percent: number
  accentIndex?: number
  accentColor?: string
}) {
  const palette = ['#6366f1', '#ec4899', '#0ea5e9', '#f97316', '#14b8a6']
  const color = accentColor || palette[accentIndex ?? 0]

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <div className="font-medium text-gray-900 dark:text-white truncate">{label}</div>
        <div className="text-gray-600 dark:text-gray-300">{value}</div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{supporting}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, percent)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  )
}

