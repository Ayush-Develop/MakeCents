'use client'

import { useState } from 'react'
import { Button } from './Button'
import { Trash2, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ResetAccountsButton() {
  const [isResetting, setIsResetting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleReset = async () => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setIsResetting(true)

    try {
      const response = await fetch('/api/accounts/reset', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to reset accounts')
      }

      // Refresh the page to show empty state
      router.refresh()
      setShowConfirm(false)
    } catch (error: any) {
      console.error('Reset error:', error)
      alert('Failed to reset accounts: ' + error.message)
    } finally {
      setIsResetting(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertTriangle className="w-4 h-4" />
          <span>This will delete ALL accounts and transactions!</span>
        </div>
        <Button
          onClick={handleReset}
          disabled={isResetting}
          variant="outline"
          className="bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700"
        >
          {isResetting ? 'Resetting...' : 'Confirm Reset'}
        </Button>
        <Button
          onClick={() => setShowConfirm(false)}
          disabled={isResetting}
          variant="outline"
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={handleReset}
      disabled={isResetting}
      variant="outline"
      className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
    >
      <Trash2 className="w-4 h-4 mr-2" />
      {isResetting ? 'Resetting...' : 'Reset All Accounts'}
    </Button>
  )
}


