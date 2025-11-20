import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { AccountCard } from '@/components/accounts/AccountCard'
import { Plus, Wallet, CreditCard, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { calculateAccountsPerformance, calculateTotalPerformance, type AccountPerformance } from '@/lib/account-performance'
import type { Account } from '@prisma/client'

// Account type groupings
const BANKING_TYPES = ['CHECKING', 'SAVINGS']
const CREDIT_TYPES = ['CREDIT_CARD']
const INVESTMENT_TYPES = ['BROKERAGE', 'RETIREMENT_401K', 'RETIREMENT_IRA', 'RETIREMENT_ROTH_IRA', 'INVESTMENT', 'OTHER']

// This is a Server Component (no 'use client' directive)
// It can directly access the database using Prisma
export default async function AccountsPage() {
  // Fetch accounts directly from database
  const accounts = await prisma.account.findMany({
    where: { 
      userId: 'user-1', // TODO: Get from session/auth
      isActive: true 
    },
    orderBy: { createdAt: 'desc' },
  })

  // Group accounts by type
  const bankingAccounts = accounts.filter(acc => BANKING_TYPES.includes(acc.type))
  const creditAccounts = accounts.filter(acc => CREDIT_TYPES.includes(acc.type))
  const investmentAccounts = accounts.filter(acc => INVESTMENT_TYPES.includes(acc.type))

  // Calculate performance for all accounts
  const accountPerformanceMap = await calculateAccountsPerformance(accounts)

  // Calculate totals and performance for each category
  const bankingTotal = bankingAccounts.reduce((sum, acc) => sum + acc.balance, 0)
  const creditTotal = creditAccounts.reduce((sum, acc) => sum + Math.abs(acc.balance), 0)
  const investmentTotal = investmentAccounts.reduce((sum, acc) => sum + acc.balance, 0)

  // Calculate category-level performance
  const bankingPerformance = calculateTotalPerformance(
    bankingAccounts.map(acc => accountPerformanceMap.get(acc.id) || {
      currentBalance: acc.balance,
      previousBalance: acc.balance,
      change: 0,
      changePercent: 0,
    })
  )

  const creditPerformance = calculateTotalPerformance(
    creditAccounts.map(acc => {
      const perf = accountPerformanceMap.get(acc.id) || {
        currentBalance: Math.abs(acc.balance),
        previousBalance: Math.abs(acc.balance),
        change: 0,
        changePercent: 0,
      }
      // For credit, we want to show debt change (inverse)
      return {
        ...perf,
        currentBalance: Math.abs(perf.currentBalance),
        previousBalance: Math.abs(perf.previousBalance),
        change: -perf.change, // Invert change for credit (less debt = positive)
      }
    })
  )

  const investmentPerformance = calculateTotalPerformance(
    investmentAccounts.map(acc => accountPerformanceMap.get(acc.id) || {
      currentBalance: acc.balance,
      previousBalance: acc.balance,
      change: 0,
      changePercent: 0,
    })
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Accounts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all your financial accounts in one place
          </p>
        </div>
        <Link href="/dashboard/accounts/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </Link>
      </div>

      {/* Three Swim Lanes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Banking Accounts */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <Wallet className="w-5 h-5 mr-2 text-blue-600" />
                Banking
              </h2>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(bankingTotal)}
              </span>
            </div>
            <PerformanceIndicator performance={bankingPerformance} />
          </div>
          <div className="space-y-3">
            {bankingAccounts.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
                <div className="text-center py-8">
                  <Wallet className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No banking accounts</p>
                  <Link href="/dashboard/accounts/new?type=BANKING">
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Banking Account
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : (
              bankingAccounts.map((account) => {
                const performance = accountPerformanceMap.get(account.id)
                const source = getAccountSource(account)
                return (
                  <AccountCard 
                    key={account.id} 
                    account={toCardAccount(account)} 
                    performance={performance}
                    analyticsHref={`/dashboard/analytics?accountId=${account.id}`}
                    expensesHref={`/dashboard/expenses?account=${account.id}`}
                    importHref={`/dashboard/accounts/${account.id}/import`}
                    showImportOption={source === 'MANUAL'}
                    source={source}
                  />
                )
              })
            )}
          </div>
        </div>

        {/* Credit Accounts */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-red-600" />
                Credit
              </h2>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(creditTotal)}
              </span>
            </div>
            <PerformanceIndicator performance={creditPerformance} />
          </div>
          <div className="space-y-3">
            {creditAccounts.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
                <div className="text-center py-8">
                  <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No credit accounts</p>
                  <Link href="/dashboard/accounts/new?type=CREDIT">
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Credit Card
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : (
              creditAccounts.map((account) => {
                const perf = accountPerformanceMap.get(account.id)
                const performance = perf ? {
                  ...perf,
                  currentBalance: Math.abs(perf.currentBalance),
                  previousBalance: Math.abs(perf.previousBalance),
                  change: -perf.change, // Invert for credit
                } : undefined
                const source = getAccountSource(account)
                return (
                  <AccountCard 
                    key={account.id} 
                    account={toCardAccount(account)} 
                    performance={performance}
                    analyticsHref={`/dashboard/analytics?accountId=${account.id}`}
                    expensesHref={`/dashboard/expenses?account=${account.id}`}
                    importHref={`/dashboard/accounts/${account.id}/import`}
                    showImportOption={source === 'MANUAL'}
                    source={source}
                  />
                )
              })
            )}
          </div>
        </div>

        {/* Investment Accounts */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
                Investment
              </h2>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(investmentTotal)}
              </span>
            </div>
            <PerformanceIndicator performance={investmentPerformance} />
          </div>
          <div className="space-y-3">
            {investmentAccounts.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
                <div className="text-center py-8">
                  <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No investment accounts</p>
                  <Link href="/dashboard/accounts/new?type=INVESTMENT">
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Investment Account
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : (
              investmentAccounts.map((account) => {
                const performance = accountPerformanceMap.get(account.id)
                const source = getAccountSource(account)
                return (
                  <AccountCard 
                    key={account.id} 
                    account={toCardAccount(account)} 
                    performance={performance}
                    analyticsHref={`/dashboard/analytics?accountId=${account.id}`}
                    expensesHref={`/dashboard/expenses?account=${account.id}`}
                    importHref={`/dashboard/accounts/${account.id}/import`}
                    showImportOption={source === 'MANUAL'}
                    source={source}
                  />
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Performance Indicator Component
function PerformanceIndicator({ performance }: { performance: AccountPerformance }) {
  const isPositive = performance.change >= 0
  const isNegative = performance.change < 0
  const hasChange = performance.change !== 0

  if (!hasChange) {
    return (
      <p className="text-xs text-gray-500 dark:text-gray-400">
        No change this month
      </p>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {isPositive ? (
        <ArrowUp className="w-3 h-3 text-green-600" />
      ) : (
        <ArrowDown className="w-3 h-3 text-red-600" />
      )}
      <span className={`text-xs font-medium ${
        isPositive ? 'text-green-600' : 'text-red-600'
      }`}>
        {isPositive ? '+' : ''}{formatCurrency(Math.abs(performance.change))}
      </span>
      <span className={`text-xs ${
        isPositive ? 'text-green-600' : 'text-red-600'
      }`}>
        ({isPositive ? '+' : ''}{performance.changePercent.toFixed(1)}%)
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
        this month
      </span>
    </div>
  )
}

type AccountSource = 'MANUAL' | 'TELLER'

function parseAccountMetadata(metadata?: string | null) {
  if (!metadata) return null
  try {
    return JSON.parse(metadata)
  } catch {
    return null
  }
}

function getAccountSource(account: Account): AccountSource {
  const metadata = parseAccountMetadata(account.metadata)
  const source = metadata?.source
  if (source === 'TELLER' || source === 'MANUAL') {
    return source
  }
  return account.apiKey ? 'TELLER' : 'MANUAL'
}

function toCardAccount(account: Account) {
  return {
    id: account.id,
    name: account.name,
    type: account.type,
    accountNumber: account.accountNumber,
    provider: account.provider,
    balance: account.balance,
    currency: account.currency,
  }
}
