import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerUserId } from '@/lib/auth'

const planIncomeSchema = z.object({
  netIncome: z.number().positive(),
  payrollTransactionId: z.string().optional(),
  planVersion: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const userId = getServerUserId()
    const body = await request.json()
    const payload = planIncomeSchema.parse(body)

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        monthlyNetIncomeGoal: payload.netIncome,
        planVersion: payload.planVersion,
      },
      update: {
        monthlyNetIncomeGoal: payload.netIncome,
        ...(payload.planVersion ? { planVersion: payload.planVersion } : {}),
      },
    })

    if (payload.payrollTransactionId) {
      await prisma.planMetadata.upsert({
        where: {
          userId_key: {
            userId,
            key: 'payrollTransactionId',
          },
        },
        create: {
          userId,
          key: 'payrollTransactionId',
          value: JSON.stringify({
            transactionId: payload.payrollTransactionId,
            updatedAt: new Date().toISOString(),
          }),
        },
        update: {
          value: JSON.stringify({
            transactionId: payload.payrollTransactionId,
            updatedAt: new Date().toISOString(),
          }),
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Plan income error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to update plan income' },
      { status: 500 }
    )
  }
}


