import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function TradingJournalPage() {
  // TODO: Fetch real trades from API
  const trades: any[] = []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Trading Journal
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Log and analyze your trades to improve your strategy
          </p>
        </div>
        <Link href="/dashboard/journal/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Trade
          </Button>
        </Link>
      </div>

      {trades.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No trades logged yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start logging your trades to track performance and improve your strategy
            </p>
            <Link href="/dashboard/journal/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Log Your First Trade
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {trades.map((trade) => (
            <Card key={trade.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {trade.outcome === 'PROFIT' ? (
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  ) : trade.outcome === 'LOSS' ? (
                    <TrendingDown className="w-8 h-8 text-red-600" />
                  ) : (
                    <TrendingUp className="w-8 h-8 text-gray-400" />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {trade.symbol} - {trade.type}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(trade.date)} • {trade.quantity} @ {formatCurrency(trade.price)}
                    </p>
                    {trade.strategy && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        Strategy: {trade.strategy}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(trade.totalAmount)}
                  </p>
                  {trade.outcome && (
                    <p
                      className={`text-sm ${
                        trade.outcome === 'PROFIT'
                          ? 'text-green-600'
                          : trade.outcome === 'LOSS'
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {trade.outcome.replace('_', ' ')}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}


