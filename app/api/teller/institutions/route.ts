import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import https from 'https'

/**
 * List all institutions supported by Teller
 * According to Teller API docs: https://teller.io/docs/api/institutions
 * This endpoint does NOT require authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Institutions endpoint doesn't require authentication
    // But we still need certificates for mTLS in development/production
    const cert = process.env.TELLER_CERTIFICATE?.replace(/\\n/g, '\n')
    const key = process.env.TELLER_PRIVATE_KEY?.replace(/\\n/g, '\n')
    const env = process.env.TELLER_ENV || process.env.NEXT_PUBLIC_TELLER_ENV || 'sandbox'

    let httpsAgent
    if (cert && key) {
      httpsAgent = new https.Agent({
        cert,
        key,
        rejectUnauthorized: env === 'production',
      })
    } else if (env === 'sandbox') {
      // In sandbox, we can try without certificates
      httpsAgent = new https.Agent({
        rejectUnauthorized: false,
      })
    }

    const response = await axios.get('https://api.teller.io/institutions', {
      httpsAgent,
    })

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Failed to fetch institutions:', error.message)
    return NextResponse.json(
      { 
        error: 'Failed to fetch institutions from Teller',
        message: error.message,
        details: error?.response?.data,
      },
      { status: error?.response?.status || 500 }
    )
  }
}

