'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/Button'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle2, Loader2 } from 'lucide-react'

export type GoalWizardUpdate = {
  targetAmount?: number
  monthlyTarget?: number | null
  fundingAccountId?: string | null
  currentAmount?: number
}

type GoalWizardCardProps = {
  goal: {
    id: string
    name: string
    description: string | null
    targetAmount: number
    currentAmount: number
    monthlyTarget: number | null
    fundingAccountId: string | null
  }
  accounts: { id: string; name: string; type: string }[]
  quickOptions?: { label: string; value: number }[]
  suggestedMonthly?: number
  onSave: (goalId: string, update: GoalWizardUpdate) => Promise<void> | void
  isSaving: boolean
}

export function GoalWizardCard({
  goal,
  accounts,
  quickOptions,
  suggestedMonthly,
  onSave,
  isSaving,
}: GoalWizardCardProps) {
  const [targetAmount, setTargetAmount] = useState(goal.targetAmount)
  const [monthlyTarget, setMonthlyTarget] = useState<string>(
    goal.monthlyTarget !== null && goal.monthlyTarget !== undefined
      ? String(goal.monthlyTarget)
      : ''
  )
  const [fundingAccountId, setFundingAccountId] = useState(goal.fundingAccountId ?? '')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setTargetAmount(goal.targetAmount)
    setMonthlyTarget(
      goal.monthlyTarget !== null && goal.monthlyTarget !== undefined
        ? String(goal.monthlyTarget)
        : ''
    )
    setFundingAccountId(goal.fundingAccountId ?? '')
  }, [goal])

  const handleSave = async () => {
    await onSave(goal.id, {
      targetAmount,
      monthlyTarget: monthlyTarget === '' ? null : Number(monthlyTarget),
      fundingAccountId: fundingAccountId || null,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500">{goal.name}</p>
          {goal.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{goal.description}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Current</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatCurrency(goal.currentAmount)}
          </p>
        </div>
      </div>
      {quickOptions && (
        <div className="flex flex-wrap gap-2">
          {quickOptions.map((option) => (
            <Button key={option.label} size="sm" variant="outline" onClick={() => setTargetAmount(option.value)}>
              {option.label}
            </Button>
          ))}
        </div>
      )}
      <div className="grid gap-3">
        <label className="text-xs text-gray-500">Target amount</label>
        <input
          type="number"
          className="rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
          value={targetAmount}
          onChange={(event) => setTargetAmount(Number(event.target.value))}
        />
      </div>
      <div className="grid gap-3">
        <label className="text-xs text-gray-500">Monthly contribution target</label>
        <input
          type="number"
          className="rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
          value={monthlyTarget}
          onChange={(event) => setMonthlyTarget(event.target.value)}
          placeholder={
            suggestedMonthly ? `Suggested ${formatCurrency(suggestedMonthly)}` : 'Optional'
          }
        />
      </div>
      <div className="grid gap-2">
        <label className="text-xs text-gray-500">Funding account</label>
        <select
          className="rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
          value={fundingAccountId}
          onChange={(event) => setFundingAccountId(event.target.value)}
        >
          <option value="">Select an account</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} · {account.type}
            </option>
          ))}
        </select>
      </div>
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving
          </>
        ) : saved ? (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
            Saved
          </>
        ) : (
          'Save goal'
        )}
      </Button>
    </div>
  )
}


