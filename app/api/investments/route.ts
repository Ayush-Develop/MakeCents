import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getStockPrice } from '@/lib/stock-prices'

const investmentSchema = z.object({
  accountId: z.string(),
  symbol: z.string().min(1),
  name: z.string().optional(),
  type: z.enum(['STOCK', 'ETF', 'CRYPTO', 'OPTION', 'BOND', 'MUTUAL_FUND', 'OTHER']),
  quantity: z.number().positive(),
  averageCost: z.number().positive(),
})

// TODO: Add authentication middleware
const getUserId = () => 'user-1' // Placeholder

/**
 * GET /api/investments
 * Get all investments for the user with current prices
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId()
    const searchParams = request.nextUrl.searchParams
    const accountId = searchParams.get('accountId')

    const where: any = { userId }
    if (accountId) {
      where.accountId = accountId
    }

    const investments = await prisma.investment.findMany({
      where,
      include: {
        account: true,
        trades: {
          orderBy: { date: 'desc' },
          take: 5, // Latest 5 trades
        },
      },
      orderBy: { symbol: 'asc' },
    })

    // Update prices for investments that haven't been updated recently (older than 1 hour)
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const needsUpdate = investments.filter(
      (inv) => !inv.lastUpdated || inv.lastUpdated < oneHourAgo
    )

    // Update prices in parallel (with rate limiting)
    const updatePromises = needsUpdate.map(async (investment) => {
      try {
        const priceData = await getStockPrice(investment.symbol)
        if (priceData) {
          const totalValue = investment.quantity * priceData.price
          const totalCost = investment.quantity * investment.averageCost
          const unrealizedGain = totalValue - totalCost

          await prisma.investment.update({
            where: { id: investment.id },
            data: {
              currentPrice: priceData.price,
              totalValue,
              unrealizedGain,
              lastUpdated: priceData.lastUpdated,
            },
          })

          // Update the investment object for response
          investment.currentPrice = priceData.price
          investment.totalValue = totalValue
          investment.unrealizedGain = unrealizedGain
          investment.lastUpdated = priceData.lastUpdated
        }
      } catch (error) {
        console.error(`Error updating price for ${investment.symbol}:`, error)
      }
    })

    await Promise.all(updatePromises)

    // Calculate portfolio totals
    const totalValue = investments.reduce((sum, inv) => sum + inv.totalValue, 0)
    const totalCost = investments.reduce((sum, inv) => sum + inv.totalCost, 0)
    const totalGain = investments.reduce((sum, inv) => sum + inv.unrealizedGain, 0)
    const gainPercentage = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

    return NextResponse.json({
      investments,
      portfolio: {
        totalValue,
        totalCost,
        totalGain,
        gainPercentage,
      },
    })
  } catch (error) {
    console.error('Error fetching investments:', error)
    return NextResponse.json({ error: 'Failed to fetch investments' }, { status: 500 })
  }
}

/**
 * POST /api/investments
 * Create a new investment (usually from a trade)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId()
    const body = await request.json()
    const data = investmentSchema.parse(body)

    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: { id: data.accountId, userId },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Get current price
    const priceData = await getStockPrice(data.symbol)
    const currentPrice = priceData?.price || data.averageCost

    // Calculate values
    const totalValue = data.quantity * currentPrice
    const totalCost = data.quantity * data.averageCost
    const unrealizedGain = totalValue - totalCost

    // Check if investment already exists
    const existing = await prisma.investment.findUnique({
      where: {
        userId_accountId_symbol: {
          userId,
          accountId: data.accountId,
          symbol: data.symbol.toUpperCase(),
        },
      },
    })

    let investment
    if (existing) {
      // Update existing investment (e.g., after a new trade)
      // Recalculate average cost based on all trades
      const trades = await prisma.trade.findMany({
        where: {
          userId,
          accountId: data.accountId,
          symbol: data.symbol.toUpperCase(),
          type: 'BUY',
        },
      })

      const totalQuantity = trades.reduce((sum, t) => sum + t.quantity, 0)
      const totalCostAmount = trades.reduce((sum, t) => sum + t.totalAmount, 0)
      const newAverageCost = totalQuantity > 0 ? totalCostAmount / totalQuantity : data.averageCost

      investment = await prisma.investment.update({
        where: { id: existing.id },
        data: {
          quantity: totalQuantity,
          averageCost: newAverageCost,
          totalCost: totalQuantity * newAverageCost,
          currentPrice,
          totalValue: totalQuantity * currentPrice,
          unrealizedGain: totalQuantity * currentPrice - totalQuantity * newAverageCost,
          lastUpdated: new Date(),
          name: data.name || existing.name,
        },
        include: {
          account: true,
        },
      })
    } else {
      // Create new investment
      investment = await prisma.investment.create({
        data: {
          userId,
          accountId: data.accountId,
          symbol: data.symbol.toUpperCase(),
          name: data.name,
          type: data.type,
          quantity: data.quantity,
          averageCost: data.averageCost,
          currentPrice,
          totalValue,
          totalCost,
          unrealizedGain,
          lastUpdated: new Date(),
        },
        include: {
          account: true,
        },
      })
    }

    return NextResponse.json(investment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating investment:', error)
    return NextResponse.json({ error: 'Failed to create investment' }, { status: 500 })
  }
}



