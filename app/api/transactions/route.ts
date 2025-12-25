import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getServerUserId } from '@/lib/auth'

const transactionSchema = z.object({
  accountId: z.string(),
  categoryId: z.string().optional(),
  amount: z.number().positive(),
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER']),
  description: z.string().min(1),
  date: z.string().transform((str) => new Date(str)),
  merchant: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const userId = await getServerUserId()
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = { userId }
    if (accountId) where.accountId = accountId
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: true,
        category: true,
      },
      orderBy: { date: 'desc' },
      take: 100,
    })

    return NextResponse.json(transactions)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getServerUserId()
    const body = await request.json()
    const data = transactionSchema.parse(body)

    // Update account balance
    const account = await prisma.account.findUnique({
      where: { id: data.accountId },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const balanceChange =
      data.type === 'INCOME' ? data.amount : data.type === 'EXPENSE' ? -data.amount : 0

    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          ...data,
          userId,
          tags: data.tags ? JSON.stringify(data.tags) : null,
        },
      }),
      prisma.account.update({
        where: { id: data.accountId },
        data: {
          balance: account.balance + balanceChange,
        },
      }),
    ])

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}


