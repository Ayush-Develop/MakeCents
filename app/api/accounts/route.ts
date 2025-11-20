import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getServerUserId } from '@/lib/auth'

const accountSchema = z.object({
  name: z.string().min(1),
  type: z.enum([
    'CHECKING',
    'SAVINGS',
    'CREDIT_CARD',
    'BROKERAGE',
    'RETIREMENT_401K',
    'RETIREMENT_IRA',
    'RETIREMENT_ROTH_IRA',
    'INVESTMENT',
    'OTHER',
  ]),
  provider: z.string().optional(),
  accountNumber: z.string().optional(),
  balance: z.number().default(0),
  currency: z.string().default('USD'),
})

export async function GET() {
  try {
    const userId = getServerUserId()
    const accounts = await prisma.account.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(accounts)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getServerUserId()
    const body = await request.json()
    const data = accountSchema.parse(body)

    // For credit cards, balance should be negative (debt)
    // If user enters positive value, convert to negative
    let balance = data.balance
    if (data.type === 'CREDIT_CARD' && balance > 0) {
      balance = -Math.abs(balance)
    }

    const account = await prisma.account.create({
      data: {
        ...data,
        balance,
        userId,
        metadata: JSON.stringify({
          source: 'MANUAL',
        }),
      },
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}


