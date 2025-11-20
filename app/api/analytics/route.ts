import { NextRequest, NextResponse } from 'next/server'
import { getServerUserId } from '@/lib/auth'
import {
  getCashFlowSeries,
  getCategoryBreakdown,
} from '@/lib/analytics/dashboard'

export async function GET(request: NextRequest) {
  try {
    const userId = getServerUserId()
    const { searchParams } = new URL(request.url)
    const metric = searchParams.get('metric') || 'all'
    const months = Number(searchParams.get('months') || '6')
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    const startDate = startDateParam ? new Date(startDateParam) : undefined
    const endDate = endDateParam ? new Date(endDateParam) : undefined

    const payload: Record<string, unknown> = {}

    if (metric === 'cashflow' || metric === 'all') {
      payload.cashFlow = await getCashFlowSeries(userId, months)
    }

    if (metric === 'categories' || metric === 'all') {
      payload.categories = await getCategoryBreakdown(userId, startDate, endDate)
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: `Unknown metric "${metric}"` },
        { status: 400 }
      )
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}


