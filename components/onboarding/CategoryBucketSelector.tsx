'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/Button'
import { formatCurrency } from '@/lib/utils'

type CategoryBucketSelectorProps = {
  categories: {
    id: string
    name: string
    type: string
    budgetType: string
    budgetTarget: number | null
  }[]
  topCategories: { id: string; name: string; value: number }[]
  onUpdate: (id: string, update: { budgetType?: string; budgetTarget?: number | null }) => Promise<void> | void
  loadingId: string | null
}

const BUCKETS: { label: string; value: string }[] = [
  { label: 'Need', value: 'NEED' },
  { label: 'Want', value: 'WANT' },
  { label: 'Savings', value: 'SAVINGS' },
  { label: 'Debt', value: 'DEBT' },
]

const suggestions: Record<string, string> = {
  groceries: 'NEED',
  food: 'NEED',
  dining: 'NEED',
  transportation: 'NEED',
  rent: 'NEED',
  shopping: 'WANT',
  entertainment: 'WANT',
  travel: 'WANT',
  subscriptions: 'WANT',
  roth: 'SAVINGS',
  emergency: 'SAVINGS',
  loan: 'DEBT',
  credit: 'DEBT',
}

export function CategoryBucketSelector({
  categories,
  topCategories,
  onUpdate,
  loadingId,
}: CategoryBucketSelectorProps) {
  const [draftTargets, setDraftTargets] = useState<Record<string, string>>({})

  const expenseCategories = categories.filter((category) => category.type === 'EXPENSE')

  const prioritizedCategories = useMemo(() => {
    const matched: typeof expenseCategories = []
    topCategories.forEach((top) => {
      const found =
        expenseCategories.find((category) => category.id === top.id) ||
        expenseCategories.find(
          (category) => category.name.toLowerCase() === top.name.toLowerCase()
        )
      if (found && !matched.some((item) => item.id === found.id)) {
        matched.push(found)
      }
    })

    const remaining = expenseCategories.filter(
      (category) => !matched.some((item) => item.id === category.id)
    )

    return [...matched, ...remaining].slice(0, 8)
  }, [expenseCategories, topCategories])

  const handleBucketClick = (id: string, bucket: string) => {
    onUpdate(id, { budgetType: bucket })
  }

  const handleTargetBlur = (id: string) => {
    const value = draftTargets[id]
    if (value === undefined) return
    const parsed = value === '' ? null : Number(value)
    onUpdate(id, { budgetTarget: parsed })
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {prioritizedCategories.map((category) => {
        const suggestion =
          suggestions[
            Object.keys(suggestions).find((key) =>
              category.name.toLowerCase().includes(key)
            ) || ''
          ]
        const draftValue =
          draftTargets[category.id] !== undefined
            ? draftTargets[category.id]
            : category.budgetTarget !== null && category.budgetTarget !== undefined
            ? String(category.budgetTarget)
            : ''
        return (
          <div key={category.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{category.name}</p>
                {suggestion && (
                  <p className="text-xs text-gray-500">
                    Suggested: {suggestion}
                  </p>
                )}
              </div>
              <span className="text-xs uppercase tracking-wide text-gray-500">
                {category.budgetType}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {BUCKETS.map((bucket) => (
                <Button
                  key={bucket.value}
                  size="sm"
                  variant={category.budgetType === bucket.value ? 'default' : 'outline'}
                  onClick={() => handleBucketClick(category.id, bucket.value)}
                  disabled={loadingId === `category-${category.id}`}
                >
                  {bucket.label}
                </Button>
              ))}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Monthly target</label>
              <input
                type="number"
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
                value={draftValue}
                onChange={(event) =>
                  setDraftTargets((prev) => ({ ...prev, [category.id]: event.target.value }))
                }
                onBlur={() => handleTargetBlur(category.id)}
                placeholder="Optional"
              />
              {category.budgetTarget ? (
                <p className="text-xs text-gray-500">
                  Tracking {formatCurrency(category.budgetTarget)} per month
                </p>
              ) : (
                <p className="text-xs text-gray-400">Budgets load into the dashboard instantly.</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}


