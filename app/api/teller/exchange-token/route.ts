import { NextRequest, NextResponse } from 'next/server'
import { tellerApiRequest } from '@/lib/teller'
import { prisma } from '@/lib/prisma'
import { getServerUserId } from '@/lib/auth'

/**
 * Exchange Teller access token for account data and create account
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getServerUserId()
    const body = await request.json()
    const { accessToken, accountId, institutionId, institutionName: passedInstitutionName, enrollmentId } = body

    if (!accessToken || !accountId) {
      return NextResponse.json(
        { error: 'Missing accessToken or accountId' },
        { status: 400 }
      )
    }

    try {
      console.log('Fetching account details from Teller API...', { accountId, hasAccessToken: !!accessToken })
      
      // Fetch account details from Teller API using access token
      const accountData = await tellerApiRequest(`/accounts/${accountId}`, accessToken, 'GET')
      
      // Log full account data for debugging
      console.log('Full account data received:', JSON.stringify(accountData, null, 2))

      // Fetch balance from /accounts/{id}/balances endpoint
      // According to Teller API docs: https://teller.io/docs/api/account/balances
      // Balance is NOT in the account object, must be fetched separately
      let balance = 0
      const currency = accountData.currency || 'USD' // Currency is in account object
      
      try {
        // Use the balances link if available, otherwise construct the URL
        const balanceUrl = accountData.links?.balances || `/accounts/${accountId}/balances`
        const balanceEndpoint = balanceUrl.startsWith('http') 
          ? new URL(balanceUrl).pathname 
          : balanceUrl
        
        const balanceData = await tellerApiRequest(balanceEndpoint, accessToken, 'GET')
        console.log('Balance data received:', JSON.stringify(balanceData, null, 2))
        
        // Teller API returns balance as strings (e.g., "28575.02")
        // Prefer available balance, fallback to ledger balance
        if (balanceData.available !== null && balanceData.available !== undefined) {
          balance = parseFloat(balanceData.available) || 0
        } else if (balanceData.ledger !== null && balanceData.ledger !== undefined) {
          balance = parseFloat(balanceData.ledger) || 0
        }
        
        // For credit cards, balance should be negative (debt)
        if (accountData.type === 'credit' && balance > 0) {
          balance = -Math.abs(balance)
        }
      } catch (balanceError: any) {
        console.warn('Failed to fetch balance from balances endpoint:', balanceError.message)
        // Balance will remain 0 if fetch fails
      }

      // Map Teller account type to our account type
      const typeMap: Record<string, string> = {
        depository: accountData.subtype === 'checking' ? 'CHECKING' : 'SAVINGS',
        credit: 'CREDIT_CARD',
        loan: 'OTHER',
        other: 'OTHER',
      }

      const accountType = typeMap[accountData.type] || 'OTHER'

      // Get institution name from account data
      // According to Teller API docs: https://teller.io/docs/api/accounts
      // The account object includes institution: { name, id } directly
      const institutionName = accountData.institution?.name || 
                             passedInstitutionName || 
                             'Unknown Bank'
      
      const tellerInstitutionId = accountData.institution?.id || institutionId

      // Extract account number - Teller API provides last_four
      // According to Teller API docs, account object has last_four field
      const accountNumber = accountData.last_four || null

      // Create account in our database
      const createdAccount = await prisma.account.create({
        data: {
          userId,
          name: accountData.name || accountData.display_name || 'Linked Account',
          type: accountType,
          provider: institutionName,
          accountNumber: accountNumber,
          balance: balance,
          currency: currency,
          apiKey: accessToken, // Store Teller access token (should be encrypted in production!)
          metadata: JSON.stringify({
            source: 'TELLER',
            teller_account_id: accountData.id,
            teller_institution_id: tellerInstitutionId,
            teller_enrollment_id: accountData.enrollment_id,
            teller_status: accountData.status, // 'open' or 'closed'
            raw_account_data: accountData, // Store full data for debugging
          }),
        },
      })

      // Auto-sync transactions immediately after account creation
      // This runs in the background and doesn't block the response
      try {
        const { syncTellerTransactions } = await import('@/lib/teller-sync')
        // Sync last 90 days of transactions
        const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        
        // Run sync in background (don't await to not block response)
        syncTellerTransactions(createdAccount.id, {
          startDate,
          userId,
        }).then((result) => {
          console.log('Auto-synced transactions for account:', createdAccount.id, result)
        }).catch((error) => {
          console.warn('Failed to auto-sync transactions:', error.message)
          // Don't fail account creation if sync fails
        })
      } catch (syncError: any) {
        console.warn('Failed to initiate transaction sync:', syncError.message)
      }

      return NextResponse.json({
        account: createdAccount,
        message: 'Account linked successfully. Transactions are being synced in the background.',
      })
    } catch (apiError: any) {
      // If Teller API fails, we can still create account with basic info
      console.warn('Teller API error, creating account with basic info:', apiError)
      
      const createdAccount = await prisma.account.create({
        data: {
          userId,
          name: 'Linked Account',
          type: 'OTHER',
          provider: 'Teller',
          balance: 0,
          currency: 'USD',
          apiKey: accessToken,
          metadata: JSON.stringify({
            source: 'TELLER',
            teller_account_id: accountId,
            teller_institution_id: institutionId,
            note: 'Account created but Teller API details not available',
          }),
        },
      })

      return NextResponse.json({
        account: createdAccount,
        message: 'Account linked (limited details available)',
        warning: 'Could not fetch full account details from Teller',
      })
    }
  } catch (error: any) {
    console.error('Teller exchange error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to link Teller account' },
      { status: 500 }
    )
  }
}

