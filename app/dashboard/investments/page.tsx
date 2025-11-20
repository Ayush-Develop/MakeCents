'use client'

import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Plus, TrendingUp, ExternalLink, TrendingDown, Loader2, RefreshCw } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

interface Investment {
  id: string
  symbol: string
  name: string | null
  type: string
  quantity: number
  averageCost: number
  currentPrice: number | null
  totalValue: number
  totalCost: number
  unrealizedGain: number
  lastUpdated: string
  account: {
    id: string
    name: string
    provider: string | null
  }
}

interface PortfolioData {
  investments: Investment[]
  portfolio: {
    totalValue: number
    totalCost: number
    totalGain: number
    gainPercentage: number
  }
}

export default function InvestmentsPage() {
  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery<PortfolioData>({
    queryKey: ['investments'],
    queryFn: async () => {
      const response = await fetch('/api/investments')
      if (!response.ok) throw new Error('Failed to fetch investments')
      return response.json()
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  })

  const portfolio = data?.portfolio || {
    totalValue: 0,
    totalCost: 0,
    totalGain: 0,
    gainPercentage: 0,
  }
  const investments = data?.investments || []

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="p-6">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">
              Error loading investments. Please try again.
            </p>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Investments
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your portfolio and connect with brokers
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/dashboard/investments/connect">
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              Connect Broker
            </Button>
          </Link>
          <Link href="/dashboard/investments/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Trade
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">Total Portfolio Value</p>
              <p className="text-3xl font-bold">{formatCurrency(portfolio.totalValue)}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-200" />
          </div>
        </Card>

        <Card
          className={`bg-gradient-to-br text-white ${
            portfolio.totalGain >= 0
              ? 'from-green-500 to-green-600'
              : 'from-red-500 to-red-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">Total Gain/Loss</p>
              <p className="text-3xl font-bold">{formatCurrency(portfolio.totalGain)}</p>
            </div>
            {portfolio.totalGain >= 0 ? (
              <TrendingUp className="w-12 h-12 text-white/80" />
            ) : (
              <TrendingDown className="w-12 h-12 text-white/80" />
            )}
          </div>
        </Card>

        <Card
          className={`bg-gradient-to-br text-white ${
            portfolio.gainPercentage >= 0
              ? 'from-blue-500 to-blue-600'
              : 'from-orange-500 to-orange-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">Return %</p>
              <p className="text-3xl font-bold">
                {portfolio.gainPercentage > 0 ? '+' : ''}
                {portfolio.gainPercentage.toFixed(2)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Holdings
        </h2>
        {investments.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No investments yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Connect a broker or manually add trades to get started
            </p>
            <Link href="/dashboard/investments/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Trade
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Symbol
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Account
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Quantity
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Avg Cost
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Current Price
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Total Value
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Gain/Loss
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Return %
                  </th>
                </tr>
              </thead>
              <tbody>
                {investments.map((investment) => {
                  const returnPercent =
                    investment.totalCost > 0
                      ? (investment.unrealizedGain / investment.totalCost) * 100
                      : 0
                  return (
                    <tr
                      key={investment.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {investment.symbol}
                        </div>
                        {investment.name && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {investment.name}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {investment.account.name}
                        {investment.account.provider && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({investment.account.provider})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-900 dark:text-white">
                        {investment.quantity.toFixed(4)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-900 dark:text-white">
                        {formatCurrency(investment.averageCost)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-900 dark:text-white">
                        {investment.currentPrice
                          ? formatCurrency(investment.currentPrice)
                          : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(investment.totalValue)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right text-sm font-semibold ${
                          investment.unrealizedGain >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {investment.unrealizedGain >= 0 ? '+' : ''}
                        {formatCurrency(investment.unrealizedGain)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right text-sm font-semibold ${
                          returnPercent >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {returnPercent >= 0 ? '+' : ''}
                        {returnPercent.toFixed(2)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}


