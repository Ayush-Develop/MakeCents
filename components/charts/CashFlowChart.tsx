'use client'

import { useQuery } from '@tanstack/react-query'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

type CashFlowPoint = {
  month: string
  income: number
  expenses: number
  surplus: number
  savingsRate: number
}

async function fetchCashFlow(months: number) {
  const response = await fetch(`/api/analytics?metric=cashflow&months=${months}`)
  if (!response.ok) {
    throw new Error('Failed to load cash flow data')
  }
  const payload = await response.json()
  return (payload.cashFlow || []) as CashFlowPoint[]
}

export function CashFlowChart({ months = 6, height = 300 }: { months?: number; height?: number }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['analytics', 'cashflow', months],
    queryFn: () => fetchCashFlow(months),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        Loading cash flow...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center text-sm text-red-500">
        <p>Unable to load cash flow.</p>
        {error instanceof Error && (
          <p className="text-xs opacity-75 mt-1">{error.message}</p>
        )}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        Sync transactions to unlock your cash flow history.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
        <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
      </LineChart>
    </ResponsiveContainer>
  )
}


