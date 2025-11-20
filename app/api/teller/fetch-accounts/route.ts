import { NextRequest, NextResponse } from 'next/server'
import { tellerApiRequest } from '@/lib/teller'

/**
 * Fetch accounts from Teller API using access token from Teller Connect
 * Following Teller's quick start guide
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accessToken } = body

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing accessToken' },
        { status: 400 }
      )
    }

    // Fetch accounts from Teller API
    // The /accounts endpoint returns all accounts for the access token
    const accounts = await tellerApiRequest('/accounts', accessToken, 'GET')
    
    // Teller API returns an array of accounts
    const accountsList = Array.isArray(accounts) ? accounts : []
    
    return NextResponse.json({
      accounts: accountsList,
      count: accountsList.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch accounts from Teller',
        accounts: [] 
      },
      { status: 500 }
    )
  }
}

