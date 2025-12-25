import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
    function middleware(req) {
        // You can add additional middleware logic here if needed
        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token, // Only allow if user has a token
        },
    }
)

// Protect these routes - require authentication
export const config = {
    matcher: [
        '/dashboard/:path*',
        '/api/accounts/:path*',
        '/api/transactions/:path*',
        '/api/categories/:path*',
        '/api/goals/:path*',
        '/api/investments/:path*',
        '/api/trades/:path*',
        '/api/analytics/:path*',
        '/api/teller/:path*',
    ],
}

