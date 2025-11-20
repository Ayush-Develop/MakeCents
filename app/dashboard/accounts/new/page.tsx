'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { ArrowLeft, Loader2, Upload, Zap, Link2, FileText, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { BANKS } from '@/lib/banks'
import { TellerConnect } from '@/components/TellerConnect'

// Account type options grouped by category
const accountTypeGroups = {
  BANKING: [
    { value: 'CHECKING', label: 'Checking' },
    { value: 'SAVINGS', label: 'Savings' },
  ],
  CREDIT: [
    { value: 'CREDIT_CARD', label: 'Credit Card' },
  ],
  INVESTMENT: [
    { value: 'BROKERAGE', label: 'Brokerage' },
    { value: 'RETIREMENT_401K', label: '401(k)' },
    { value: 'RETIREMENT_IRA', label: 'Traditional IRA' },
    { value: 'RETIREMENT_ROTH_IRA', label: 'Roth IRA' },
    { value: 'INVESTMENT', label: 'Investment Account' },
    { value: 'OTHER', label: 'Other' },
  ],
}

export default function NewAccountPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('type') || 'BANKING'

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    provider: '',
    accountNumber: '',
    balance: '',
    currency: 'USD',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showManualForm, setShowManualForm] = useState(false)

  // Set initial type based on URL parameter
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const availableTypes = accountTypeGroups[selectedCategory as keyof typeof accountTypeGroups] || accountTypeGroups.BANKING

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.name || !formData.type) {
        throw new Error('Name and account type are required')
      }

      // Prepare data
      const accountData = {
        name: formData.name,
        type: formData.type,
        provider: formData.provider || undefined,
        accountNumber: formData.accountNumber || undefined,
        balance: formData.balance ? parseFloat(formData.balance) : 0,
        currency: formData.currency,
      }

      // Submit to API
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create account')
      }

      // Success! Redirect back to accounts page
      router.push('/dashboard/accounts')
      router.refresh() // Refresh to show new account
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsSubmitting(false)
    }
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setFormData({ ...formData, type: '' }) // Reset type when category changes
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/dashboard/accounts" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Accounts
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Add New Account
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Connect your account automatically or add it manually
        </p>
      </div>

      {/* Teller Connect - Primary Option */}
      <Card className="mb-6 border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
            <Link2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Link Account Automatically
              </h2>
              <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded">
                Recommended
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Securely connect your bank account with Teller. Automatically sync balances and transactions from 5,000+ banks.
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Zap className="w-4 h-4 text-indigo-600" />
                <span>Automatic balance and transaction syncing</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Zap className="w-4 h-4 text-indigo-600" />
                <span>100% free - no fees or subscriptions</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Zap className="w-4 h-4 text-indigo-600" />
                <span>Bank-level security and encryption</span>
              </div>
            </div>
            <TellerConnect 
              accountType={selectedCategory === 'BANKING' ? 'CHECKING' : selectedCategory === 'CREDIT' ? 'CREDIT_CARD' : undefined}
              onSuccess={() => {
                // TellerConnect will handle navigation
              }}
            />
          </div>
        </div>
      </Card>

      {/* Manual Entry - Secondary Option */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowManualForm(!showManualForm)}
          className="flex items-center justify-between w-full p-4 text-left border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
              <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Add Account Manually
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter account details manually if automatic linking isn't available
              </p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showManualForm ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showManualForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account Category
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['BANKING', 'CREDIT', 'INVESTMENT'] as const).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategoryChange(category)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    selectedCategory === category
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {category.charAt(0) + category.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Account Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account Type <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select account type...</option>
              {availableTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Account Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Chase Checking"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Provider */}
          <div>
            <label htmlFor="provider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bank/Institution
            </label>
            <select
              id="provider"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select or type below...</option>
              {BANKS.map((bank) => (
                <option key={bank.value} value={bank.label}>
                  {bank.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Or enter a custom bank name below
            </p>
            <input
              type="text"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              placeholder="Custom bank name"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mt-2"
            />
          </div>

          {/* Account Number */}
          <div>
            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account Number (Last 4 digits)
            </label>
            <input
              type="text"
              id="accountNumber"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              placeholder="e.g., 1234"
              maxLength={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Balance and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="balance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Balance
              </label>
              <input
                type="number"
                id="balance"
                step="0.01"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                For credit cards, enter as positive (we'll track as debt)
              </p>
            </div>
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency
              </label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD (C$)</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <Link href="/dashboard/accounts" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </div>
          </form>
        </Card>
      )}
    </div>
  )
}

