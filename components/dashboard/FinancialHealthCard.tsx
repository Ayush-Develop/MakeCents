import { Card } from '@/components/Card'
import { formatCurrency } from '@/lib/utils'
import type { FinancialHealthSnapshot } from '@/lib/analytics/dashboard'
import { CheckCircle2, AlertTriangle } from 'lucide-react'

type Props = {
  data: FinancialHealthSnapshot
}

const BUDGET_TARGETS = {
  burn: 50,
  wants: 30,
}

export function FinancialHealthCard({ data }: Props) {
  const burnDelta = data.burnRate - BUDGET_TARGETS.burn
  const wantDelta = data.wantRate - BUDGET_TARGETS.wants
  const alert =
    burnDelta > 5
      ? {
          message: 'Fixed costs are creeping up. Review housing or utilities.',
        }
      : wantDelta > 5
      ? {
          message: 'Discretionary spend exceeded 30%. Trim shopping or travel.',
        }
      : null

  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Financial Health
          </p>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {data.monthLabel}
          </h2>
        </div>
        {data.isOnTrack ? (
          <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 mr-1" /> On track
          </div>
        ) : (
          <div className="flex items-center text-amber-600 dark:text-amber-400 text-sm font-medium">
            <AlertTriangle className="w-4 h-4 mr-1" /> Needs attention
          </div>
        )}
      </div>

      <dl className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/30 p-4">
          <dt className="text-xs uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
            Net income
          </dt>
          <dd className="text-2xl font-semibold text-indigo-900 dark:text-indigo-100">
            {formatCurrency(data.income || 0)}
          </dd>
          <p className="text-xs mt-2 text-indigo-700 dark:text-indigo-200">
            Monthly take-home target
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/30 p-4">
          <dt className="text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
            Burn rate (needs)
          </dt>
          <dd className="text-2xl font-semibold text-emerald-900 dark:text-emerald-100">
            {data.burnRate.toFixed(1)}%
          </dd>
          <p className="text-xs mt-2 text-emerald-700 dark:text-emerald-200">
            Target &lt; {BUDGET_TARGETS.burn}%
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/30 p-4">
          <dt className="text-xs uppercase tracking-wide text-amber-600 dark:text-amber-300">
            Wants share
          </dt>
          <dd className="text-2xl font-semibold text-amber-900 dark:text-amber-100">
            {data.wantRate.toFixed(1)}%
          </dd>
          <p className="text-xs mt-2 text-amber-700 dark:text-amber-200">
            Target &lt; {BUDGET_TARGETS.wants}%
          </p>
        </div>
      </dl>

      <div className="space-y-3">
        <ProgressRow
          label="Needs (50%)"
          value={data.buckets.needs}
          percentage={data.burnRate}
          target={BUDGET_TARGETS.burn}
          color="bg-emerald-500"
        />
        <ProgressRow
          label="Wants (30%)"
          value={data.buckets.wants}
          percentage={data.wantRate}
          target={BUDGET_TARGETS.wants}
          color="bg-amber-500"
        />
        <ProgressRow
          label="Savings potential"
          value={data.savingsPotential}
          percentage={
            data.income === 0 ? 0 : (data.savingsPotential / data.income) * 100
          }
          target={20}
          color="bg-indigo-500"
        />
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Safe to spend</span>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatCurrency(Math.max(0, data.safeToSpend))}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          30% fun-money allowance minus current wants. Use this before booking travel or
          gadgets.
        </p>
        {alert && (
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-1" />
            {alert.message}
          </p>
        )}
      </div>
    </Card>
  )
}

function ProgressRow({
  label,
  value,
  percentage,
  target,
  color,
}: {
  label: string
  value: number
  percentage: number
  target: number
  color: string
}) {
  const ratio = Math.min(100, Math.max(0, percentage))
  const overTarget = percentage > target
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-600 dark:text-gray-300">{label}</span>
        <span
          className={`font-medium ${
            overTarget ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'
          }`}
        >
          {percentage.toFixed(1)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${ratio}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs mt-1 text-gray-500 dark:text-gray-400">
        <span>{formatCurrency(value)}</span>
        <span>Target {target}%</span>
      </div>
    </div>
  )
}

