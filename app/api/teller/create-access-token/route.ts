import { NextRequest, NextResponse } from 'next/server'
import { isTellerConfigured } from '@/lib/teller'

// TODO: Add authentication middleware
const getUserId = () => 'user-1' // Placeholder

/**
 * Create a Teller Connect access token
 * This endpoint is called by Teller Connect after user links their account
 */
export async function POST(request: NextRequest) {
  try {
    if (!isTellerConfigured()) {
      return NextResponse.json(
        {
          error:
            'Teller is not configured. Please add TELLER_CERTIFICATE, TELLER_PRIVATE_KEY, and TELLER_ENV to your environment variables.',
        },
        { status: 500 }
      )
    }

    const userId = getUserId()
    const body = await request.json()
    const { accessToken, accounts } = body

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing access token from Teller' },
        { status: 400 }
      )
    }

    // The accessToken is provided by Teller Connect
    // We'll store it and use it to fetch account data
    // For now, return success - account creation will happen in exchange endpoint

    return NextResponse.json({
      success: true,
      accessToken,
      message: 'Teller account linked successfully',
    })
  } catch (error: any) {
    console.error('Teller access token creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process Teller connection' },
      { status: 500 }
    )
  }
}

