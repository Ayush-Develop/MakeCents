import axios from 'axios'
import https from 'https'

const TELLER_API_URL = 'https://api.teller.io'

// Normalize multiline environment variables (certificates often have \n)
// Handles both escaped newlines (\n) and actual newlines
function normalizeMultilineEnv(value?: string | null): string | undefined {
  if (!value) return undefined
  // Replace escaped newlines with actual newlines
  let normalized = value.replace(/\\n/g, '\n')
  // Ensure it starts with -----BEGIN if it's a certificate
  // This helps validate the format
  return normalized.trim()
}

// Get HTTPS agent with Teller certificates for mTLS
// Certificates are required for development and production environments
// In sandbox, certificates may not be required, but we'll still try to use them if provided
function getTellerHttpsAgent(): https.Agent {
  const cert = normalizeMultilineEnv(process.env.TELLER_CERTIFICATE)
  const key = normalizeMultilineEnv(process.env.TELLER_PRIVATE_KEY)
  const env = process.env.TELLER_ENV || process.env.NEXT_PUBLIC_TELLER_ENV || 'sandbox'

  // In development/production, certificates are required
  if (['development', 'production'].includes(env)) {
    if (!cert || !key) {
      throw new Error(
        `Teller certificates are required for ${env} environment. ` +
        'Please add TELLER_CERTIFICATE and TELLER_PRIVATE_KEY to your environment variables. ' +
        'Certificates should be in PEM format with -----BEGIN and -----END markers.'
      )
    }

    // Basic validation - check if certificates look like PEM format
    if (!cert.includes('-----BEGIN') || !cert.includes('-----END')) {
      throw new Error(
        'TELLER_CERTIFICATE appears to be invalid. ' +
        'It should be in PEM format starting with -----BEGIN CERTIFICATE-----'
      )
    }

    if (!key.includes('-----BEGIN') || !key.includes('-----END')) {
      throw new Error(
        'TELLER_PRIVATE_KEY appears to be invalid. ' +
        'It should be in PEM format starting with -----BEGIN PRIVATE KEY----- or -----BEGIN RSA PRIVATE KEY-----'
      )
    }
  }

  // If certificates are provided, use them (even in sandbox)
  if (cert && key) {
    try {
      return new https.Agent({
        cert,
        key,
        // Reject unauthorized only in production
        rejectUnauthorized: env === 'production',
      })
    } catch (err) {
      throw new Error(
        `Failed to create HTTPS agent with Teller certificates: ${err instanceof Error ? err.message : 'Unknown error'}. ` +
        'Please verify your certificates are correctly formatted.'
      )
    }
  }

  // In sandbox without certificates, return a basic agent
  // Note: This may not work for all Teller endpoints
  return new https.Agent({
    rejectUnauthorized: false,
  })
}

// Make authenticated Teller API request using access token from Teller Connect
// Teller requires mTLS (certificates) for all API requests
// Teller uses Basic authentication: base64(accessToken:)
export async function tellerApiRequest(
  endpoint: string,
  accessToken: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any
) {
  const url = `${TELLER_API_URL}${endpoint}`

  try {
    // Teller API requires Basic auth, not Bearer
    // Format: Basic base64(accessToken:)
    const basicAuth = Buffer.from(`${accessToken.trim()}:`).toString('base64')

    const response = await axios({
      method,
      url,
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
      data: body,
      httpsAgent: getTellerHttpsAgent(),
    })

    return response.data
  } catch (error: any) {
    // Enhanced error logging for debugging
    const errorDetails = {
      message: error?.response?.data?.error?.message || error?.message || 'Teller API error',
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
    }
    
    console.error('Teller API Error:', errorDetails)
    throw new Error(errorDetails.message)
  }
}

export function isTellerConfigured() {
  const env = process.env.TELLER_ENV || process.env.NEXT_PUBLIC_TELLER_ENV || 'sandbox'
  const cert = normalizeMultilineEnv(process.env.TELLER_CERTIFICATE)
  const key = normalizeMultilineEnv(process.env.TELLER_PRIVATE_KEY)
  const appId = process.env.NEXT_PUBLIC_TELLER_APPLICATION_ID

  if (env === 'sandbox') {
    return Boolean(appId)
  }

  return Boolean(appId && cert && key)
}

