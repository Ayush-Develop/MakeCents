'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CheckCircle2, Target, Plus, Loader2, Trash2 } from 'lucide-react'

type Goal = {
  id: string
  name: string
  description: string | null
  targetAmount: number
  currentAmount: number
  targetDate: string | null
  priority: number
  isCompleted: boolean
}

const initialFormState = {
  name: '',
  description: '',
  targetAmount: 0,
  currentAmount: 0,
  targetDate: '',
  priority: 5,
}

export function GoalsClient({ initialGoals }: { initialGoals: Goal[] }) {
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formState, setFormState] = useState(initialFormState)
  const [error, setError] = useState<string | null>(null)

  const activeGoals = useMemo(
    () => goals.filter((goal) => !goal.isCompleted),
    [goals]
  )
  const completedGoals = useMemo(
    () => goals.filter((goal) => goal.isCompleted),
    [goals]
  )

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target
    setFormState((prev) => ({
      ...prev,
      [name]:
        name === 'targetAmount' || name === 'currentAmount' || name === 'priority'
          ? Number(value)
          : value,
    }))
  }

  const handleCreateGoal = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      })

      if (!response.ok) {
        const body = await response.json()
        throw new Error(body.error || 'Failed to create goal')
      }

      const newGoal = await response.json()
      setGoals((prev) => [...prev, newGoal])
      setFormState(initialFormState)
      setIsDialogOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleComplete = async (goal: Goal) => {
    try {
      const response = await fetch(`/api/goals/${goal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: !goal.isCompleted }),
      })

      if (!response.ok) {
        throw new Error('Failed to update goal status')
      }

      const updated = await response.json()
      setGoals((prev) => prev.map((g) => (g.id === goal.id ? updated : g)))
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    const confirmed = confirm('Delete this goal? This cannot be undone.')
    if (!confirmed) return

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete goal')
      }

      setGoals((prev) => prev.filter((goal) => goal.id !== goalId))
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  const renderGoalCard = (goal: Goal) => {
    const progress = Math.min(
      (goal.currentAmount / goal.targetAmount) * 100,
      100
    )
    const isCompleted = goal.isCompleted || progress >= 100

    return (
      <Card key={goal.id} className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {isCompleted ? (
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            ) : (
              <Target className="w-8 h-8 text-indigo-600" />
            )}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {goal.name}
              </h3>
              {goal.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {goal.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="text-xs px-2 py-1"
              onClick={() => handleToggleComplete(goal)}
            >
              {isCompleted ? 'Mark active' : 'Mark done'}
            </Button>
            <Button
              variant="ghost"
              className="text-xs px-2 py-1"
              onClick={() => handleDeleteGoal(goal.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {progress.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                isCompleted ? 'bg-green-600' : 'bg-indigo-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Current</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(goal.currentAmount)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Target</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(goal.targetAmount)}
            </p>
          </div>
        </div>

        {goal.targetDate && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Target date: {formatDate(goal.targetDate)}
          </p>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Investment Planner
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Set, prioritize, and monitor the goals that drive your financial plan.
          </p>
        </div>
        <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Dialog.Trigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Goal
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50" />
            <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Create goal
              </Dialog.Title>
              <form className="space-y-4" onSubmit={handleCreateGoal}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    name="name"
                    value={formState.name}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formState.description}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Target amount
                    </label>
                    <input
                      name="targetAmount"
                      type="number"
                      min={0}
                      value={formState.targetAmount}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current amount
                    </label>
                    <input
                      name="currentAmount"
                      type="number"
                      min={0}
                      value={formState.currentAmount}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Target date
                    </label>
                    <input
                      type="date"
                      name="targetDate"
                      value={formState.targetDate}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority (0-10)
                    </label>
                    <input
                      type="number"
                      name="priority"
                      min={0}
                      max={10}
                      value={formState.priority}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
                <div className="flex justify-end gap-3 pt-2">
                  <Dialog.Close asChild>
                    <Button variant="ghost" type="button">
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Goal'
                    )}
                  </Button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {goals.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No goals yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first target to turn the financial plan into action.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create goal
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeGoals.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Active goals
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeGoals.map(renderGoalCard)}
              </div>
            </div>
          )}
          {completedGoals.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Completed
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80">
                {completedGoals.map(renderGoalCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


