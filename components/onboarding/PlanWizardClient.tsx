'use client'

import { ReactNode, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  PiggyBank,
  ShieldCheck,
  Target,
  Wallet,
  Zap,
} from 'lucide-react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { TellerConnect } from '@/components/TellerConnect'
import { formatCurrency } from '@/lib/utils'
import { AccountChecklist } from './AccountChecklist'
import { CategoryBucketSelector } from './CategoryBucketSelector'
import { GoalWizardCard, GoalWizardUpdate } from './GoalWizardCard'
import { RuleToggleCard, RuleToggleValue } from './RuleToggleCard'
import { OnboardingSummary } from './OnboardingSummary'

type AccountSummary = {
  id: string
  name: string
  type: string
  balance: number
}

type CategorySummary = {
  id: string
  name: string
  type: string
  budgetType: string
  budgetTarget: number | null
  latestValue?: number
}

type GoalSummary = {
  id: string
  name: string
  description: string | null
  targetAmount: number
  currentAmount: number
  monthlyTarget: number | null
  targetDate: string | null
  fundingAccountId: string | null
}

type PlanRule = {
  id: string
  ruleType: string
  isEnabled: boolean
  targetValue: number | null
  metadata: string | null
}

type TransactionSummary = {
  id: string
  description: string
  amount: number
  date: string
  tags: string | null
  account: {
    id: string
    name: string
    type: string
  }
}

type FinancialSnapshot = {
  buckets?: {
    needs: number
    wants: number
    savings: number
    debt: number
  }
  income?: number
}

type PlanWizardInitialData = {
  settings: {
    userId: string
    monthlyNetIncomeGoal?: number | null
    planVersion?: string | null
    stepsCompleted: string[]
    onboardingCompleted?: boolean | null
  }
  accounts: AccountSummary[]
  categories: CategorySummary[]
  goals: GoalSummary[]
  planRules: PlanRule[]
  payrollTransactions: TransactionSummary[]
  relocationTransaction: TransactionSummary | null
  topCategories: { id: string; name: string; value: number }[]
  financialHealth: FinancialSnapshot | null
  planMetadata: Record<string, any>
}

type StepId =
  | 'PLAN'
  | 'ACCOUNTS'
  | 'NET_PAY'
  | 'CATEGORIES'
  | 'GOALS'
  | 'RULES'
  | 'SUMMARY'

const STEP_CONFIG: { id: StepId; label: string; icon: ReactNode }[] = [
  { id: 'PLAN', label: 'Plan selection', icon: <ShieldCheck className="w-4 h-4" /> },
  { id: 'ACCOUNTS', label: 'Link accounts', icon: <Wallet className="w-4 h-4" /> },
  { id: 'NET_PAY', label: 'Net income', icon: <PiggyBank className="w-4 h-4" /> },
  { id: 'CATEGORIES', label: 'Buckets', icon: <Target className="w-4 h-4" /> },
  { id: 'GOALS', label: 'Goals', icon: <Zap className="w-4 h-4" /> },
  { id: 'RULES', label: 'Rules', icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: 'SUMMARY', label: 'Finish', icon: <ArrowRight className="w-4 h-4" /> },
]

const DEFAULT_NET_INCOME = 7400
const SAP_PLAN_VERSION = 'SAP_NEXT_TALENT_2025'

async function postJson(url: string, body: unknown, method: 'POST' | 'PATCH' = 'POST') {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.error || 'Request failed')
  }
  return response.json()
}

export function PlanWizardClient({ initialData }: { initialData: PlanWizardInitialData }) {
  const router = useRouter()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [settings, setSettings] = useState(initialData.settings)
  const [accounts, setAccounts] = useState(initialData.accounts)
  const [categories, setCategories] = useState(initialData.categories)
  const [goals, setGoals] = useState(initialData.goals)
  const [planRules, setPlanRules] = useState(initialData.planRules)
  const [stepsCompleted, setStepsCompleted] = useState<string[]>(initialData.settings.stepsCompleted || [])
  const [toast, setToast] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [netIncomeInput, setNetIncomeInput] = useState(
    initialData.settings.monthlyNetIncomeGoal || DEFAULT_NET_INCOME
  )
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(
    initialData.planMetadata?.payrollTransactionId?.transactionId || null
  )
  const [categoryTouched, setCategoryTouched] = useState(new Set<string>())
  const [goalSavingId, setGoalSavingId] = useState<string | null>(null)
  const [ruleSaving, setRuleSaving] = useState<string | null>(null)
  const [relocationApplied, setRelocationApplied] = useState(
    Boolean(initialData.planMetadata?.relocationApplied)
  )

  const currentStep = STEP_CONFIG[currentStepIndex]
  const monthlyNeeds = initialData.financialHealth?.buckets?.needs || 0
  const emergencyGoal = goals.find((goal) => goal.name.toLowerCase().includes('emergency'))

  const payrollOptions = initialData.payrollTransactions || []

  const planRulesMap = useMemo(() => {
    const map: Record<string, PlanRule> = {}
    planRules.forEach((rule) => {
      map[rule.ruleType] = rule
    })
    return map
  }, [planRules])

  const isStepComplete = (stepId: StepId) => stepsCompleted.includes(stepId)

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 4000)
  }

  const markProgress = async (stepId: StepId, markComplete = false) => {
    const payload = {
      step: stepId,
      status: 'COMPLETED',
      markComplete,
    }
    const result = await postJson('/api/plan/progress', payload, 'PATCH')
    setStepsCompleted(result.stepsCompleted)
  }

  const handleContinue = async () => {
    try {
      setLoadingAction('continue')
      const isFinalStep = currentStep.id === 'SUMMARY'
      await markProgress(currentStep.id, isFinalStep)
      if (isFinalStep) {
        showToast('Onboarding complete! Redirecting to dashboard...')
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
        return
      }
      setCurrentStepIndex((index) => Math.min(index + 1, STEP_CONFIG.length - 1))
    } finally {
      setLoadingAction(null)
    }
  }

  const handleGoBack = () => {
    setCurrentStepIndex((index) => Math.max(0, index - 1))
  }

  const handlePlanSelection = async () => {
    try {
      setLoadingAction('plan')
      const response = await postJson('/api/plan/income', {
        netIncome: DEFAULT_NET_INCOME,
        planVersion: SAP_PLAN_VERSION,
      })
      setSettings((prev) => ({
        ...prev,
        monthlyNetIncomeGoal: response.monthlyNetIncomeGoal,
        planVersion: response.planVersion,
      }))
      showToast('SAP Early Career defaults applied')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to apply plan')
    } finally {
      setLoadingAction(null)
    }
  }

  const handleDetectPayroll = async (transactionId?: string, netIncome?: number) => {
    if (!netIncome) return
    try {
      setLoadingAction('netIncome')
      const response = await postJson('/api/plan/income', {
        netIncome,
        payrollTransactionId: transactionId,
      })
      setSettings((prev) => ({
        ...prev,
        monthlyNetIncomeGoal: response.monthlyNetIncomeGoal,
      }))
      showToast('Net income baseline saved')
      setSelectedPayrollId(transactionId || null)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save income')
    } finally {
      setLoadingAction(null)
    }
  }

  const handleCategoryUpdate = async (
    categoryId: string,
    update: { budgetType?: string; budgetTarget?: number | null }
  ) => {
    try {
      setLoadingAction(`category-${categoryId}`)
      const response = await postJson(`/api/categories/${categoryId}`, update, 'PATCH')
      setCategories((prev) =>
        prev.map((cat) => (cat.id === categoryId ? { ...cat, ...response } : cat))
      )
      setCategoryTouched((prev) => {
        const next = new Set(prev)
        next.add(categoryId)
        return next
      })
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update category')
    } finally {
      setLoadingAction(null)
    }
  }

  const handleGoalSave = async (goalId: string, updates: GoalWizardUpdate) => {
    try {
      setGoalSavingId(goalId)
      const response = await postJson(`/api/goals/${goalId}`, updates, 'PATCH')
      setGoals((prev) => prev.map((goal) => (goal.id === goalId ? { ...goal, ...response } : goal)))
      const progress = Math.min(
        (response.currentAmount / Math.max(response.targetAmount, 1)) * 100,
        100
      )
      showToast(`${response.name} updated → ${progress.toFixed(0)}% funded`)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update goal')
    } finally {
      setGoalSavingId(null)
    }
  }

  const handleRuleChange = async (ruleType: string, update: RuleToggleValue) => {
    try {
      setRuleSaving(ruleType)
      const payload = [
        {
          ruleType,
          isEnabled: update.isEnabled,
          targetValue: update.targetValue ?? null,
          notes: update.notes,
          metadata: update.metadata,
        },
      ]
      const [result] = await postJson('/api/plan/rules', payload, 'POST')
      setPlanRules((prev) => {
        const exists = prev.find((rule) => rule.ruleType === ruleType)
        if (exists) {
          return prev.map((rule) => (rule.ruleType === ruleType ? result : rule))
        }
        return [...prev, result]
      })
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update rule')
    } finally {
      setRuleSaving(null)
    }
  }

  const handleApplyRelocation = async () => {
    if (!initialData.relocationTransaction || !emergencyGoal || relocationApplied) return
    try {
      setLoadingAction('relocation')
      const amount = initialData.relocationTransaction.amount
      await handleGoalSave(emergencyGoal.id, {
        currentAmount: emergencyGoal.currentAmount + amount,
      })
      await postJson('/api/plan/metadata', {
        key: 'relocationApplied',
        value: {
          goalId: emergencyGoal.id,
          transactionId: initialData.relocationTransaction.id,
          amount,
          appliedAt: new Date().toISOString(),
        },
      })
      setRelocationApplied(true)
    } finally {
      setLoadingAction(null)
    }
  }

  const topCategoryCount = initialData.topCategories?.length ?? 0

  const stepContinueDisabled = useMemo(() => {
    switch (currentStep.id) {
      case 'PLAN':
        return settings.planVersion !== SAP_PLAN_VERSION
      case 'ACCOUNTS':
        return accounts.length === 0
      case 'NET_PAY':
        return netIncomeInput <= 0
      case 'CATEGORIES':
        return categoryTouched.size < Math.min(topCategoryCount || 3, 3)
      case 'GOALS':
        return goals.length === 0
      case 'RULES':
        return Object.keys(planRulesMap).length === 0
      default:
        return false
    }
  }, [
    currentStep.id,
    settings.planVersion,
    accounts.length,
    netIncomeInput,
    categoryTouched.size,
    topCategoryCount,
    goals.length,
    planRulesMap,
  ])

  const renderPlanSelection = () => (
    <Card className="space-y-6 p-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-indigo-600 font-semibold">
          Step 1
        </p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
          Welcome, Ayush. Let’s activate the SAP Early Career plan.
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          We’ll preload the SAP Next Talent wealth waterfall so your dashboards stay in sync.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-900/20 p-5 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Use SAP Early Career Plan
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>• Sets monthly net income goal to {formatCurrency(DEFAULT_NET_INCOME)}</li>
            <li>• Flags plan version for analytics & insights</li>
            <li>• Unlocks Teller automations for SAP payroll</li>
          </ul>
          <Button
            onClick={handlePlanSelection}
            disabled={loadingAction === 'plan' || settings.planVersion === SAP_PLAN_VERSION}
            className="w-full"
          >
            {loadingAction === 'plan' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              'Apply plan defaults'
            )}
          </Button>
        </Card>
        <Card className="border border-dashed border-gray-300 dark:border-gray-700 p-5 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configure manually
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Customize every field. Coming soon—today we recommend the SAP template so your insights
            line up with the wealth waterfall.
          </p>
          <Button variant="outline" disabled className="w-full">
            Manual setup (soon)
          </Button>
        </Card>
      </div>
    </Card>
  )

  const renderLinkAccounts = () => (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-indigo-600 font-semibold">
            Step 2
          </p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            Link Checking, Credit, and Retirement
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Teller Connect keeps balances and transactions live. Once linked, we’ll auto-detect SAP
            payroll and insights.
          </p>
        </div>
        <TellerConnect
          accountType="CHECKING"
          redirectPath="/dashboard/onboarding"
          onSuccess={() => showToast('Accounts linked—refreshing wizard')}
        />
        <AccountChecklist accounts={accounts} />
      </Card>
      {initialData.relocationTransaction && emergencyGoal && !relocationApplied && (
        <Card className="p-6 space-y-3 border-2 border-amber-200 dark:border-amber-700">
          <div className="flex items-center gap-3">
            <PiggyBank className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Relocation stipend detected
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {initialData.relocationTransaction.description} ·{' '}
                {formatCurrency(initialData.relocationTransaction.amount)}
              </p>
            </div>
          </div>
          <Button
            onClick={handleApplyRelocation}
            disabled={loadingAction === 'relocation'}
            className="w-full md:w-auto"
          >
            {loadingAction === 'relocation' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Applying to Emergency Fund...
              </>
            ) : (
              'Apply $4k to Emergency Fund'
            )}
          </Button>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            We’ll log this insight so dashboards know the stipend already funded your runway.
          </p>
        </Card>
      )}
    </div>
  )

  const renderNetPay = () => (
    <Card className="p-6 space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-indigo-600 font-semibold">
          Step 3
        </p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
          Confirm your paycheck baseline
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          These are the latest SAP payroll transactions Teller pulled in. Pick one or enter a manual
          number if missing.
        </p>
      </div>
      <div className="space-y-4">
        {payrollOptions.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4 text-sm text-gray-500">
            No income transactions yet. Enter your net pay manually below.
          </div>
        )}
        {payrollOptions.slice(0, 2).map((tx) => {
          const isSelected = selectedPayrollId === tx.id
          return (
            <button
              key={tx.id}
              onClick={() => {
                setSelectedPayrollId(tx.id)
                setNetIncomeInput(tx.amount)
                handleDetectPayroll(tx.id, tx.amount)
              }}
              className={`w-full text-left rounded-lg border p-4 transition ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {tx.description}
                  </p>
                  <p className="text-sm text-gray-500">{new Date(tx.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-300">
                    {formatCurrency(tx.amount)}
                  </p>
                  <p className="text-xs text-gray-500">{tx.account.name}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Monthly net income goal
        </label>
        <input
          type="number"
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2"
          value={netIncomeInput}
          onChange={(event) => setNetIncomeInput(Number(event.target.value))}
        />
        <Button
          onClick={() => handleDetectPayroll(selectedPayrollId || undefined, netIncomeInput)}
          disabled={loadingAction === 'netIncome' || netIncomeInput <= 0}
          className="w-full md:w-auto"
        >
          {loadingAction === 'netIncome' ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save paycheck baseline'
          )}
        </Button>
      </div>
    </Card>
  )

  const renderCategoryStep = () => (
    <Card className="p-6 space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-indigo-600 font-semibold">
          Step 4
        </p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
          Bucket your top spend
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Label each category as NEED, WANT, SAVINGS, or DEBT. Dashboards refresh instantly with the
          right wealth waterfall splits.
        </p>
      </div>
      <CategoryBucketSelector
        categories={categories}
        topCategories={initialData.topCategories}
        onUpdate={handleCategoryUpdate}
        loadingId={loadingAction}
      />
    </Card>
  )

  const renderGoals = () => (
    <Card className="p-6 space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-indigo-600 font-semibold">
          Step 5
        </p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
          Review the seeded SAP goals
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Update targets, add monthly contribution targets, and link the funding account for each
          goal so Teller deposits automate progress.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((goal) => {
          const quickOptions =
            goal.name.toLowerCase().includes('emergency') && monthlyNeeds > 0
              ? [
                  {
                    label: '3 months runway',
                    value: monthlyNeeds * 3,
                  },
                  {
                    label: '6 months runway',
                    value: monthlyNeeds * 6,
                  },
                ]
              : undefined
          const monthsLeft =
            goal.name.toLowerCase().includes('roth') && goal.targetDate
              ? Math.max(
                  1,
                  (new Date(goal.targetDate).getMonth() - new Date().getMonth()) + 12 * (new Date(goal.targetDate).getFullYear() - new Date().getFullYear())
                )
              : 12
          const suggestion =
            goal.name.toLowerCase().includes('roth') && monthsLeft
              ? Math.max(goal.targetAmount - goal.currentAmount, 0) / monthsLeft
              : undefined
          return (
            <GoalWizardCard
              key={goal.id}
              goal={goal}
              accounts={accounts}
              quickOptions={quickOptions}
              suggestedMonthly={suggestion}
              onSave={handleGoalSave}
              isSaving={goalSavingId === goal.id}
            />
          )
        })}
      </div>
    </Card>
  )

  const renderRules = () => {
    const ruleDefinitions = [
      {
        ruleType: '401K_MATCH',
        title: '401(k) Contribution',
        description: 'Ensures the SAP match hits every paycheck.',
        min: 0,
        max: 15,
        step: 1,
        suffix: '% of salary',
      },
      {
        ruleType: 'DEBT_PAYDOWN',
        title: 'High-Interest Debt',
        description: 'Prioritize debt buckets before discretionary spending.',
        min: 0,
        max: 5000,
        step: 100,
        suffix: '$ / month',
      },
      {
        ruleType: 'EMERGENCY_FUND',
        title: 'Emergency Fund',
        description: 'Target runway in months, synced with Step 5.',
        min: 3,
        max: 12,
        step: 1,
        suffix: 'months',
      },
      {
        ruleType: 'ROTH_MAX',
        title: 'Roth IRA Max',
        description: 'Track contributions toward the $7k annual cap.',
        min: 0,
        max: 7000,
        step: 500,
        suffix: '$ per year',
      },
      {
        ruleType: 'ESPP',
        title: 'ESPP',
        description: 'Set payroll % and discount for the employee stock plan.',
        min: 0,
        max: 15,
        step: 1,
        suffix: '% payroll',
      },
      {
        ruleType: 'TRAVEL_CAP',
        title: 'Relationship Travel Fund',
        description: 'Cap UIUC trips using the travel automation budget.',
        min: 100,
        max: 1000,
        step: 50,
        suffix: '$ / month',
      },
    ]

    return (
      <Card className="p-6 space-y-6">
        <div>
          <p className="text-sm uppercase tracking-wide text-indigo-600 font-semibold">
            Step 6
          </p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            Codify the wealth waterfall
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Each rule becomes a guardrail. We’ll soon trigger alerts when Teller data violates these
            thresholds.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {ruleDefinitions.map((definition) => {
            const existing = planRulesMap[definition.ruleType]
            return (
              <RuleToggleCard
                key={definition.ruleType}
                definition={definition}
                value={existing?.targetValue ?? null}
                isEnabled={existing?.isEnabled ?? false}
                onChange={(update) => handleRuleChange(definition.ruleType, update)}
                isSaving={ruleSaving === definition.ruleType}
              />
            )
          })}
        </div>
      </Card>
    )
  }

  const renderSummary = () => (
    <OnboardingSummary
      statuses={{
        PLAN: isStepComplete('PLAN') || settings.planVersion === SAP_PLAN_VERSION,
        ACCOUNTS: accounts.length > 0,
        NET_PAY: Boolean(settings.monthlyNetIncomeGoal),
        CATEGORIES: categoryTouched.size >= Math.min(topCategoryCount || 3, 3),
        GOALS: goals.length > 0,
        RULES: Object.keys(planRulesMap).length > 0,
      }}
    />
  )

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'PLAN':
        return renderPlanSelection()
      case 'ACCOUNTS':
        return renderLinkAccounts()
      case 'NET_PAY':
        return renderNetPay()
      case 'CATEGORIES':
        return renderCategoryStep()
      case 'GOALS':
        return renderGoals()
      case 'RULES':
        return renderRules()
      case 'SUMMARY':
        return renderSummary()
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to dashboard
        </Link>
        <span className="text-sm text-gray-500">
          Step {currentStepIndex + 1} of {STEP_CONFIG.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-4">
        {STEP_CONFIG.map((step, index) => (
          <button
            key={step.id}
            onClick={() => setCurrentStepIndex(index)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
              index === currentStepIndex
                ? 'bg-indigo-600 text-white'
                : isStepComplete(step.id)
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            {step.icon}
            {step.label}
          </button>
        ))}
      </div>

      {toast && (
        <div className="rounded-lg bg-gray-900 text-white px-4 py-2 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          {toast}
        </div>
      )}

      {renderStepContent()}

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleGoBack} disabled={currentStepIndex === 0}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={stepContinueDisabled || loadingAction === 'continue'}>
          {loadingAction === 'continue' ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving progress...
            </>
          ) : currentStep.id === 'SUMMARY' ? (
            'Finish onboarding'
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </div>
  )
}


