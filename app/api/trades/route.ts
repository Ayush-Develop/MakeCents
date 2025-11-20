import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const tradeSchema = z.object({
  accountId: z.string(),
  symbol: z.string().min(1),
  type: z.enum(['BUY', 'SELL']),
  quantity: z.number().positive(),
  price: z.number().positive(),
  fees: z.number().default(0),
  date: z.string().transform((str) => new Date(str)),
  notes: z.string().optional(),
  strategy: z.string().optional(),
})

// TODO: Add authentication middleware
const getUserId = () => 'user-1' // Placeholder

/**
 * GET /api/trades
 * Get all trades for the user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId()
    const searchParams = request.nextUrl.searchParams
    const accountId = searchParams.get('accountId')
    const symbol = searchParams.get('symbol')

    const where: any = { userId }
    if (accountId) {
      where.accountId = accountId
    }
    if (symbol) {
      where.symbol = symbol.toUpperCase()
    }

    const trades = await prisma.trade.findMany({
      where,
      include: {
        account: true,
        investment: true,
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(trades)
  } catch (error) {
    console.error('Error fetching trades:', error)
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 })
  }
}

/**
 * POST /api/trades
 * Create a new trade and update investment holdings
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId()
    const body = await request.json()
    const data = tradeSchema.parse(body)

    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: { id: data.accountId, userId },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Calculate total amount
    const totalAmount = data.quantity * data.price + data.fees

    // Create the trade
    const trade = await prisma.trade.create({
      data: {
        userId,
        accountId: data.accountId,
        symbol: data.symbol.toUpperCase(),
        type: data.type,
        quantity: data.quantity,
        price: data.price,
        fees: data.fees,
        totalAmount,
        date: data.date,
        notes: data.notes,
        strategy: data.strategy,
      },
    })

    // Update or create investment holding
    const existingInvestment = await prisma.investment.findUnique({
      where: {
        userId_accountId_symbol: {
          userId,
          accountId: data.accountId,
          symbol: data.symbol.toUpperCase(),
        },
      },
    })

    if (data.type === 'BUY') {
      // Get all BUY trades to recalculate average cost
      const allBuyTrades = await prisma.trade.findMany({
        where: {
          userId,
          accountId: data.accountId,
          symbol: data.symbol.toUpperCase(),
          type: 'BUY',
        },
      })

      const totalQuantity = allBuyTrades.reduce((sum, t) => sum + t.quantity, 0)
      const totalCostAmount = allBuyTrades.reduce((sum, t) => sum + t.totalAmount, 0)
      const averageCost = totalQuantity > 0 ? totalCostAmount / totalQuantity : data.price

      // Get current price (will be set to purchase price if unavailable)
      const { getStockPrice } = await import('@/lib/stock-prices')
      const priceData = await getStockPrice(data.symbol)
      const currentPrice = priceData?.price || data.price

      const totalValue = totalQuantity * currentPrice
      const totalCost = totalQuantity * averageCost
      const unrealizedGain = totalValue - totalCost

      if (existingInvestment) {
        await prisma.investment.update({
          where: { id: existingInvestment.id },
          data: {
            quantity: totalQuantity,
            averageCost,
            totalCost,
            currentPrice,
            totalValue,
            unrealizedGain,
            lastUpdated: new Date(),
          },
        })
      } else {
        // Get stock name if available
        const stockName = priceData ? undefined : undefined // Could fetch from API

        await prisma.investment.create({
          data: {
            userId,
            accountId: data.accountId,
            symbol: data.symbol.toUpperCase(),
            name: stockName,
            type: 'STOCK', // Default, can be updated
            quantity: totalQuantity,
            averageCost,
            totalCost,
            currentPrice,
            totalValue,
            unrealizedGain,
            lastUpdated: new Date(),
          },
        })
      }
    } else if (data.type === 'SELL') {
      // For SELL, reduce quantity
      if (existingInvestment) {
        const newQuantity = existingInvestment.quantity - data.quantity

        if (newQuantity <= 0) {
          // Sold all shares, delete investment
          await prisma.investment.delete({
            where: { id: existingInvestment.id },
          })
        } else {
          // Update quantity, keep average cost the same
          const { getStockPrice } = await import('@/lib/stock-prices')
          const priceData = await getStockPrice(data.symbol)
          const currentPrice = priceData?.price || existingInvestment.currentPrice || existingInvestment.averageCost

          const totalValue = newQuantity * currentPrice
          const totalCost = newQuantity * existingInvestment.averageCost
          const unrealizedGain = totalValue - totalCost

          await prisma.investment.update({
            where: { id: existingInvestment.id },
            data: {
              quantity: newQuantity,
              totalCost,
              currentPrice,
              totalValue,
              unrealizedGain,
              lastUpdated: new Date(),
            },
          })
        }
      }
    }

    // Link trade to investment
    const updatedInvestment = await prisma.investment.findUnique({
      where: {
        userId_accountId_symbol: {
          userId,
          accountId: data.accountId,
          symbol: data.symbol.toUpperCase(),
        },
      },
    })

    if (updatedInvestment) {
      await prisma.trade.update({
        where: { id: trade.id },
        data: { investmentId: updatedInvestment.id },
      })
    }

    const tradeWithRelations = await prisma.trade.findUnique({
      where: { id: trade.id },
      include: {
        account: true,
        investment: true,
      },
    })

    return NextResponse.json(tradeWithRelations, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating trade:', error)
    return NextResponse.json({ error: 'Failed to create trade' }, { status: 500 })
  }
}



