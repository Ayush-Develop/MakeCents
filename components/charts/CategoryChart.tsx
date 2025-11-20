'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

type CategoryChartDatum = {
  id: string
  name: string
  value: number
  color?: string
}

const palette = ['#6366f1', '#ec4899', '#10b981', '#f97316', '#f43f5e', '#14b8a6', '#a855f7']

async function fetchCategories(startDate?: string, endDate?: string) {
  const params = new URLSearchParams({ metric: 'categories' })
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)

  const response = await fetch(`/api/analytics?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to load category data')
  }

  const payload = await response.json()
  return (payload.categories || []) as CategoryChartDatum[]
}

interface CategoryChartProps {
  height?: number
  startDate?: string
  endDate?: string
}

export function CategoryChart({ height = 300, startDate, endDate }: CategoryChartProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['analytics', 'categories', startDate, endDate],
    queryFn: () => fetchCategories(startDate, endDate),
    staleTime: 5 * 60 * 1000,
  })

  const prepared = useMemo(() => {
    if (!data || data.length === 0) return []
    return data.map((entry, index) => ({
      ...entry,
      color: entry.color || palette[index % palette.length],
    }))
  }, [data])

  const total = prepared.reduce((sum, entry) => sum + entry.value, 0)

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        Loading categories...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center text-sm text-red-500">
        <p>Unable to load categories.</p>
        {error instanceof Error && (
          <p className="text-xs opacity-75 mt-1">{error.message}</p>
        )}
      </div>
    )
  }

  if (!prepared.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        Track expenses to see category trends.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <div className="w-full lg:w-2/3">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={prepared}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              outerRadius={85}
              fill="#8884d8"
              dataKey="value"
            >
              {prepared.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color!} strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, _name, props) => [
                `${formatPercent(value as number, total)}`,
                props?.payload?.name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-full lg:w-1/3 space-y-2 text-sm">
        {prepared.map((entry, index) => (
          <div
            key={`${entry.name}-${index}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 dark:border-gray-800 px-3 py-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="truncate text-gray-900 dark:text-white" title={entry.name}>
                {truncateLabel(entry.name)}
              </span>
            </div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {formatPercent(entry.value, total)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function truncateLabel(label: string, max = 18) {
  if (label.length <= max) return label
  return `${label.slice(0, max - 1)}…`
}

function formatPercent(value: number, total: number) {
  if (total === 0) return '0%'
  const pct = (value / total) * 100
  return `${pct.toFixed(pct >= 10 ? 0 : 1)}%`
}
