import { Card } from '@/components/Card'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { Wallet, TrendingUp, ArrowDown, ArrowUp } from 'lucide-react'
import {
  getDashboardStats,
  getRecentTransactions,
  getTopCategories,
} from '@/lib/analytics/dashboard'
import { getServerUserId } from '@/lib/auth'

function formatPercentage(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

export default async function DashboardPage() {
  const userId = await getServerUserId()

  const [stats, recentTransactions, topCategories] = await Promise.all([
    getDashboardStats(userId),
    getRecentTransactions(userId, 5),
    getTopCategories(userId, 5),
  ])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of your financial health
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm mb-1">Total Balance</p>
              <p className="text-3xl font-bold">{formatCurrency(stats.totalBalance)}</p>
            </div>
            <Wallet className="w-12 h-12 text-indigo-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Monthly Income</p>
              <p className="text-3xl font-bold">{formatCurrency(stats.monthlyIncome)}</p>
            </div>
            <ArrowDown className="w-12 h-12 text-green-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm mb-1">Monthly Expenses</p>
              <p className="text-3xl font-bold">{formatCurrency(stats.monthlyExpenses)}</p>
            </div>
            <ArrowUp className="w-12 h-12 text-red-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">Investments</p>
              <p className="text-3xl font-bold">{formatCurrency(stats.investmentValue)}</p>
              <p className="text-purple-100 text-sm mt-1">
                {formatPercentage(stats.savingsRate)} savings rate
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-200" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Transactions
          </h2>
          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Link an account or add a transaction to populate this list.
              </p>
            ) : (
              recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 last:border-b-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {transaction.account.name} • {formatDateShort(transaction.date)}
                    </p>
                  </div>
                  <span
                    className={`font-semibold ${
                      transaction.type === 'INCOME'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {transaction.type === 'EXPENSE' ? '-' : '+'}
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Top Categories
          </h2>
          <div className="space-y-4">
            {topCategories.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Track expenses to see where your money goes.
              </p>
            ) : (
              topCategories.map((category) => (
                <div key={category.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {stats.monthlyExpenses === 0
                        ? '0% of monthly spend'
                        : `${formatPercentage(
                            (category.value / stats.monthlyExpenses) * 100
                          )} of monthly spend`}
                    </p>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(category.value)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}


