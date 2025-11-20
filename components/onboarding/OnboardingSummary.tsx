import { Button } from '@/components/Button'
import { CheckCircle2, Circle } from 'lucide-react'
import Link from 'next/link'

type OnboardingSummaryProps = {
  statuses: Record<string, boolean>
}

const LABELS: Record<string, string> = {
  PLAN: 'Plan defaults applied',
  ACCOUNTS: 'Accounts linked',
  NET_PAY: 'Net income confirmed',
  CATEGORIES: 'Categories bucketed',
  GOALS: 'Goals configured',
  RULES: 'Rules saved',
}

export function OnboardingSummary({ statuses }: OnboardingSummaryProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-indigo-600 font-semibold">
          Step 7
        </p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
          All systems go
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          You can hop into the dashboard or Planner at any time. Notifications & AI nudges arrive in
          the next release.
        </p>
      </div>
      <div className="space-y-3">
        {Object.entries(LABELS).map(([key, label]) => {
          const complete = statuses[key]
          return (
            <div key={key} className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
              {complete ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
              <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          Go to dashboard
        </Link>
        <Link
          href="/dashboard/planner"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Review planner
        </Link>
        <Button variant="ghost" disabled>
          Set up notifications (soon)
        </Button>
      </div>
    </div>
  )
}


