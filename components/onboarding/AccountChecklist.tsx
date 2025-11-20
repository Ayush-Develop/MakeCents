'use client'

import { CheckCircle2, Circle, Wallet, CreditCard, PiggyBank } from 'lucide-react'

type AccountChecklistProps = {
  accounts: {
    id: string
    type: string
    name: string
  }[]
}

const REQUIRED_TYPES = [
  { type: 'CHECKING', label: 'Checking / Spending', icon: Wallet },
  { type: 'SAVINGS', label: 'Emergency Fund Savings', icon: PiggyBank },
  { type: 'CREDIT_CARD', label: 'Primary Credit Card', icon: CreditCard },
  { type: 'RETIREMENT_401K', label: '401(k) or Retirement', icon: PiggyBank },
]

export function AccountChecklist({ accounts }: AccountChecklistProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {REQUIRED_TYPES.map((item) => {
        const Icon = item.icon
        const complete = accounts.some((account) => account.type === item.type)
        return (
          <div
            key={item.type}
            className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3"
          >
            {complete ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400" />
            )}
            <Icon className="w-5 h-5 text-indigo-500" />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</p>
              <p className="text-xs text-gray-500">
                {complete ? 'Linked' : 'Pending link'}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}


