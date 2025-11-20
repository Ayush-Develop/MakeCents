'use client'

import { useState } from 'react'
import { Button } from './Button'
import { Loader2, RefreshCw } from 'lucide-react'

interface SyncTransactionsButtonProps {
  accountId: string
  accountName?: string
  onSyncComplete?: () => void
}

export function SyncTransactionsButton({ 
  accountId, 
  accountName,
  onSyncComplete 
}: SyncTransactionsButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [syncResult, setSyncResult] = useState<{
    synced: number
    total: number
    errors: number
  } | null>(null)

  const handleSync = async () => {
    setIsSyncing(true)
    setSyncResult(null)

    try {
      const response = await fetch('/api/teller/sync-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          // Sync last 90 days by default
          startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync transactions')
      }

      setSyncResult({
        synced: data.synced || 0,
        total: data.total || 0,
        errors: data.errors || 0,
      })
      setLastSync(new Date())

      if (onSyncComplete) {
        onSyncComplete()
      }
    } catch (error: any) {
      console.error('Sync error:', error)
      setSyncResult({
        synced: 0,
        total: 0,
        errors: 1,
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleSync}
        disabled={isSyncing}
        variant="outline"
        className="w-full sm:w-auto"
      >
        {isSyncing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Transactions
          </>
        )}
      </Button>

      {syncResult && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {syncResult.synced > 0 && (
            <p className="text-green-600 dark:text-green-400">
              ✓ Synced {syncResult.synced} of {syncResult.total} transactions
            </p>
          )}
          {syncResult.errors > 0 && (
            <p className="text-red-600 dark:text-red-400">
              ⚠ {syncResult.errors} errors occurred
            </p>
          )}
          {syncResult.synced === 0 && syncResult.errors === 0 && (
            <p>No new transactions to sync</p>
          )}
        </div>
      )}

      {lastSync && (
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Last synced: {lastSync.toLocaleString()}
        </p>
      )}
    </div>
  )
}


