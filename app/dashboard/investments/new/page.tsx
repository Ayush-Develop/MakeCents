'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

interface Account {
  id: string
  name: string
  type: string
  provider: string | null
}

export default function NewTradePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    accountId: '',
    symbol: '',
    type: 'BUY' as 'BUY' | 'SELL',
    quantity: '',
    price: '',
    fees: '0',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    strategy: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch investment accounts
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['accounts', 'investment'],
    queryFn: async () => {
      const response = await fetch('/api/accounts')
      const data = await response.json()
      // Filter for investment-type accounts
      return data.filter((acc: Account) =>
        ['BROKERAGE', 'RETIREMENT_401K', 'RETIREMENT_IRA', 'RETIREMENT_ROTH_IRA', 'INVESTMENT'].includes(acc.type)
      )
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.accountId || !formData.symbol || !formData.quantity || !formData.price) {
        throw new Error('Please fill in all required fields')
      }

      // Prepare data
      const tradeData = {
        accountId: formData.accountId,
        symbol: formData.symbol.toUpperCase().trim(),
        type: formData.type,
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
        fees: parseFloat(formData.fees) || 0,
        date: formData.date,
        notes: formData.notes || undefined,
        strategy: formData.strategy || undefined,
      }

      // Submit to API
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tradeData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create trade')
      }

      // Success! Redirect back to investments page
      router.push('/dashboard/investments')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href="/dashboard/investments"
        className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Investments
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Add Trade
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Record a buy or sell trade to track your investments
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Selection */}
          <div>
            <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Investment Account <span className="text-red-500">*</span>
            </label>
            <select
              id="accountId"
              required
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select account...</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} {account.provider ? `(${account.provider})` : ''}
                </option>
              ))}
            </select>
            {accounts.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                No investment accounts found.{' '}
                <Link href="/dashboard/accounts/new" className="text-indigo-600 hover:underline">
                  Create one first
                </Link>
              </p>
            )}
          </div>

          {/* Trade Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trade Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['BUY', 'SELL'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type })}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    formData.type === type
                      ? type === 'BUY'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Symbol */}
          <div>
            <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Symbol <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="symbol"
              required
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
              placeholder="e.g., AAPL, TSLA, BTC"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Stock ticker symbol (e.g., AAPL for Apple)
            </p>
          </div>

          {/* Quantity and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="quantity"
                required
                step="0.0001"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price per Share <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="price"
                required
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Fees and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="fees" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fees
              </label>
              <input
                type="number"
                id="fees"
                step="0.01"
                min="0"
                value={formData.fees}
                onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Strategy */}
          <div>
            <label htmlFor="strategy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trading Strategy (Optional)
            </label>
            <input
              type="text"
              id="strategy"
              value={formData.strategy}
              onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
              placeholder="e.g., Long-term hold, Swing trade, Day trade"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes about this trade..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <Link href="/dashboard/investments" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting || accounts.length === 0} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Add Trade'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}



