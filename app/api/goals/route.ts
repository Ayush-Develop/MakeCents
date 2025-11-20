import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getServerUserId } from '@/lib/auth'

const createGoalSchema = z.object({
  name: z.string().min(1),
  description: z.string().max(500).optional(),
  targetAmount: z.number().positive(),
  currentAmount: z.number().nonnegative().default(0),
  targetDate: z.string().optional(),
  priority: z.number().int().min(0).max(10).default(0),
})

export async function GET() {
  try {
    const userId = getServerUserId()
    const goals = await prisma.investmentGoal.findMany({
      where: { userId },
      orderBy: [
        { isCompleted: 'asc' },
        { priority: 'desc' },
        { targetDate: 'asc' },
      ],
    })

    return NextResponse.json(goals)
  } catch (error) {
    console.error('Goals GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getServerUserId()
    const body = await request.json()
    const payload = createGoalSchema.parse(body)

    const goal = await prisma.investmentGoal.create({
      data: {
        userId,
        name: payload.name,
        description: payload.description,
        targetAmount: payload.targetAmount,
        currentAmount: payload.currentAmount ?? 0,
        targetDate: payload.targetDate ? new Date(payload.targetDate) : null,
        priority: payload.priority ?? 0,
      },
    })

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    console.error('Goals POST error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}


