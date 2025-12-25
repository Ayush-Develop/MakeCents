import { NextRequest, NextResponse } from 'next/server'
import { syncTellerTransactions, syncAllTellerAccounts } from '@/lib/teller-sync'
import { getServerUserId } from '@/lib/auth'

/**
 * Sync transactions from Teller API
 * POST /api/teller/sync-transactions - Sync specific account
 * GET /api/teller/sync-transactions - Sync all accounts (background job)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getServerUserId()
    const body = await request.json()
    const { accountId, startDate, endDate, syncAll } = body

    // Sync all accounts if requested
    if (syncAll) {
      const results = await syncAllTellerAccounts(userId)
      return NextResponse.json({
        success: true,
        accounts: results,
        totalSynced: results.reduce((sum, r) => sum + ((r as any).synced || 0), 0),
      })
    }

    if (!accountId) {
      return NextResponse.json(
        { error: 'Missing accountId' },
        { status: 400 }
      )
    }

    const result = await syncTellerTransactions(accountId, {
      startDate,
      endDate,
      userId,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Teller sync transactions error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to sync transactions from Teller',
        success: false,
      },
      { status: 500 }
    )
  }
}

/**
 * Background sync endpoint - can be called by cron jobs or intervals
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getServerUserId()
    const results = await syncAllTellerAccounts(userId)
    
    return NextResponse.json({
      success: true,
      accounts: results,
      totalSynced: results.reduce((sum, r) => sum + ((r as any).synced || 0), 0),
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Background sync error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to sync transactions',
        success: false,
      },
      { status: 500 }
    )
  }
}

