'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export type RuleToggleValue = {
  isEnabled: boolean
  targetValue?: number | null
  notes?: string
  metadata?: Record<string, any>
}

type RuleToggleCardProps = {
  definition: {
    ruleType: string
    title: string
    description: string
    min: number
    max: number
    step: number
    suffix: string
  }
  value: number | null
  isEnabled: boolean
  onChange: (value: RuleToggleValue) => Promise<void> | void
  isSaving: boolean
}

export function RuleToggleCard({
  definition,
  value,
  isEnabled,
  onChange,
  isSaving,
}: RuleToggleCardProps) {
  const [enabled, setEnabled] = useState(isEnabled)
  const [sliderValue, setSliderValue] = useState<number>(
    value ?? definition.min
  )
  const [notes, setNotes] = useState('')

  useEffect(() => {
    setEnabled(isEnabled)
  }, [isEnabled])

  useEffect(() => {
    if (value !== null && value !== undefined) {
      setSliderValue(value)
    }
  }, [value])

  const commitChange = (nextEnabled = enabled, nextValue = sliderValue) => {
    onChange({
      isEnabled: nextEnabled,
      targetValue: nextEnabled ? nextValue : null,
      notes,
    })
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{definition.title}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{definition.description}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEnabled((prev) => {
              const next = !prev
              commitChange(next)
              return next
            })
          }}
          className={cn(
            enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700',
            'relative inline-flex h-6 w-11 items-center rounded-full transition'
          )}
        >
          <span
            className={cn(
              enabled ? 'translate-x-6' : 'translate-x-1',
              'inline-block h-4 w-4 transform rounded-full bg-white shadow transition'
            )}
          />
        </button>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{definition.min}</span>
          <span>{definition.max}</span>
        </div>
        <input
          type="range"
          min={definition.min}
          max={definition.max}
          step={definition.step}
          value={sliderValue}
          disabled={!enabled}
          onChange={(event) => setSliderValue(Number(event.target.value))}
          onMouseUp={() => commitChange()}
          onTouchEnd={() => commitChange()}
          className="w-full"
        />
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {sliderValue} {definition.suffix}
        </p>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-gray-500">Notes</label>
        <textarea
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
          rows={2}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          onBlur={() => notes && commitChange()}
          placeholder="Optional reminder"
        />
      </div>
      {isSaving && (
        <p className="text-xs text-indigo-600">Saving...</p>
      )}
    </div>
  )
}


