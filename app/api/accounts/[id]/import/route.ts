import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// TODO: Add authentication middleware
const getUserId = () => 'user-1' // Placeholder

const transactionRowSchema = z.object({
  date: z.string(),
  description: z.string(),
  amount: z.number(),
  balance: z.number().optional(),
  category: z.string().optional(),
  merchant: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId()
    const accountId = params.id

    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
      },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const body = await request.json()
    const { transactions } = body

    if (!Array.isArray(transactions)) {
      return NextResponse.json(
        { error: 'Transactions must be an array' },
        { status: 400 }
      )
    }

    // Validate and create transactions
    const createdTransactions = []
    const errors = []

    for (const [index, row] of transactions.entries()) {
      try {
        const data = transactionRowSchema.parse(row)

        // Determine transaction type
        const type = data.amount >= 0 ? 'INCOME' : 'EXPENSE'
        const amount = Math.abs(data.amount)

        // Parse date
        const date = new Date(data.date)

        // Create transaction
        const transaction = await prisma.transaction.create({
          data: {
            userId,
            accountId,
            amount,
            type,
            description: data.description,
            date,
            merchant: data.merchant || null,
            categoryId: null, // Can be auto-categorized later
          },
        })

        createdTransactions.push(transaction)

        // Update account balance
        const balanceChange = type === 'INCOME' ? amount : -amount
        await prisma.account.update({
          where: { id: accountId },
          data: {
            balance: account.balance + balanceChange,
          },
        })
      } catch (error) {
        errors.push({
          row: index + 1,
          error: error instanceof z.ZodError ? error.errors : 'Invalid data',
        })
      }
    }

    return NextResponse.json({
      success: true,
      imported: createdTransactions.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import transactions' },
      { status: 500 }
    )
  }
}

