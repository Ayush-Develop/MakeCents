'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from './Button'

interface TellerConnectProps {
  accountType?: string
  onSuccess?: () => void
}

declare global {
  interface Window {
    TellerConnect: {
      setup: (config: {
        applicationId: string
        environment?: string
        products: string[]
        onSuccess: (enrollment: any) => void
        onInit?: () => void
        onExit?: () => void
        onFailure?: (error: any) => void
      }) => {
        open: () => void
      }
    }
  }
}

export function TellerConnect({ accountType, onSuccess }: TellerConnectProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    // Check if Teller Connect is already loaded
    if (window.TellerConnect) {
      setIsLoading(false)
      return
    }

    // Load Teller Connect script
    const script = document.createElement('script')
    script.src = 'https://cdn.teller.io/connect/connect.js'
    
    script.onload = () => {
      if (window.TellerConnect) {
        setIsLoading(false)
      } else {
        setError('Teller Connect script loaded but not initialized')
        setIsLoading(false)
      }
    }
    
    script.onerror = () => {
      setError('Failed to load Teller Connect script')
      setIsLoading(false)
    }
    
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const handleConnect = () => {
    if (!window.TellerConnect) {
      setError('Teller Connect not loaded. Please refresh the page.')
      return
    }

    setIsConnecting(true)
    setError(null)

    const applicationId = process.env.NEXT_PUBLIC_TELLER_APPLICATION_ID
    const environment = process.env.NEXT_PUBLIC_TELLER_ENV || 'sandbox'
    
    if (!applicationId) {
      setError('Teller Application ID not configured')
      setIsConnecting(false)
      return
    }

    try {
      const teller = window.TellerConnect.setup({
        applicationId,
        environment,
        products: ['balance', 'transactions'],
        onInit: () => {
          console.log('Teller Connect has initialized')
        },
        onSuccess: async (enrollment: any) => {
          try {
            const accessToken = enrollment?.accessToken
            
            if (!accessToken) {
              throw new Error('No access token received from Teller')
            }
            
            // Fetch accounts from Teller API
            const accountsResponse = await fetch('/api/teller/fetch-accounts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accessToken }),
            })
            
            if (!accountsResponse.ok) {
              const errorData = await accountsResponse.json()
              throw new Error(errorData.error || 'Failed to fetch accounts')
            }
            
            const { accounts } = await accountsResponse.json()
            
            if (!accounts || accounts.length === 0) {
              throw new Error('No accounts found')
            }

            // Process each account
            // Extract institution info from enrollment - try multiple paths
            const institutionId = enrollment?.enrollment?.institution?.id || 
                                  enrollment?.institution?.id ||
                                  enrollment?.institution_id
            const institutionName = enrollment?.enrollment?.institution?.name ||
                                   enrollment?.institution?.name ||
                                   enrollment?.institution_name
            
            console.log('Enrollment data:', {
              institutionId,
              institutionName,
              enrollmentKeys: Object.keys(enrollment || {}),
            })
            
            const accountPromises = accounts.map(async (account: any) => {
              const response = await fetch('/api/teller/exchange-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  accessToken,
                  accountId: account.id,
                  institutionId,
                  institutionName, // Pass name directly if available
                  enrollmentId: enrollment?.enrollment?.id || enrollment?.id,
                }),
              })

              if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to link account')
              }

              return response.json()
            })

            await Promise.all(accountPromises)

            // Force a hard navigation to ensure server component re-fetches fresh data
            if (onSuccess) {
              // Call the success handler first
              onSuccess()
            }
            // Always do a hard navigation to ensure fresh data
            window.location.href = '/dashboard/accounts'
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to link account')
            setIsConnecting(false)
          }
        },
        onExit: () => {
          setIsConnecting(false)
        },
        onFailure: (error: any) => {
          setError(error?.message || error?.error || 'Teller Connect error')
          setIsConnecting(false)
        },
      })

      teller.open()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize Teller')
      setIsConnecting(false)
    }
  }

  if (isLoading) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading Teller...
      </Button>
    )
  }

  if (error && !isConnecting) {
    return (
      <div className="space-y-2">
        <div className="text-sm text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded">
          {error}
        </div>
        <Button onClick={handleConnect} variant="outline" className="w-full">
          Try Again
        </Button>
      </div>
    )
  }

  const applicationId = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_TELLER_APPLICATION_ID : null
  const isConfigured = !!applicationId

  return (
    <div className="space-y-2">
      <Button
        onClick={handleConnect}
        disabled={isConnecting || !isConfigured}
        className="w-full"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          'Link Account with Teller'
        )}
      </Button>
      {!isConfigured && (
        <p className="text-xs text-red-600 dark:text-red-400">
          ⚠️ Teller not configured. Add NEXT_PUBLIC_TELLER_APPLICATION_ID to .env
        </p>
      )}
    </div>
  )
}
