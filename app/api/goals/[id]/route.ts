import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getServerUserId } from '@/lib/auth'

const updateGoalSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().max(500).nullable().optional(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().nonnegative().optional(),
  targetDate: z.string().nullable().optional(),
  priority: z.number().int().min(0).max(10).optional(),
  isCompleted: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getServerUserId()
    const body = await request.json()
    const payload = updateGoalSchema.parse(body)

    const result = await prisma.investmentGoal.updateMany({
      where: {
        id: params.id,
        userId,
      },
      data: {
        ...payload,
        targetDate: payload.targetDate
          ? new Date(payload.targetDate)
          : payload.targetDate,
      },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    const goal = await prisma.investmentGoal.findUnique({
      where: { id: params.id },
    })

    return NextResponse.json(goal)
  } catch (error) {
    console.error('Goals PATCH error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getServerUserId()
    const result = await prisma.investmentGoal.deleteMany({
      where: {
        id: params.id,
        userId,
      },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Goals DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
  }
}

