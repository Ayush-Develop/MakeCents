'use client'

import { useEffect } from 'react'

interface BackgroundSyncProps {
  intervalMinutes?: number
  enabled?: boolean
}

/**
 * Background sync component that periodically syncs Teller transactions
 * Runs every N minutes (default: 15 minutes)
 */
export function BackgroundSync({ 
  intervalMinutes = 15,
  enabled = true 
}: BackgroundSyncProps) {
  useEffect(() => {
    if (!enabled) return

    const syncTransactions = async () => {
      try {
        const response = await fetch('/api/teller/sync-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ syncAll: true }),
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Background sync completed:', data)
        }
      } catch (error) {
        console.error('Background sync error:', error)
      }
    }

    // Sync immediately on mount
    syncTransactions()

    // Then sync at interval
    const intervalMs = intervalMinutes * 60 * 1000
    const intervalId = setInterval(syncTransactions, intervalMs)

    return () => clearInterval(intervalId)
  }, [intervalMinutes, enabled])

  return null // This component doesn't render anything
}

