import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerUserId } from '@/lib/auth'

const progressSchema = z.object({
  step: z.string().min(1),
  status: z.enum(['COMPLETED', 'IN_PROGRESS']),
  markComplete: z.boolean().optional(),
})

function parseSteps(value?: string | null): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = getServerUserId()
    const body = await request.json()
    const payload = progressSchema.parse(body)

    const existing = await prisma.userSettings.findUnique({
      where: { userId },
    })

    const steps = parseSteps(existing?.stepsCompleted)
    const stepAlreadyTracked = steps.includes(payload.step)

    let nextSteps = steps
    if (payload.status === 'COMPLETED' && !stepAlreadyTracked) {
      nextSteps = [...steps, payload.step]
    }

    const updatedSettings = await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        stepsCompleted: JSON.stringify(nextSteps),
        onboardingCompleted: payload.markComplete ?? false,
      },
      update: {
        stepsCompleted: JSON.stringify(nextSteps),
        ...(payload.markComplete !== undefined
          ? { onboardingCompleted: payload.markComplete }
          : {}),
      },
    })

    return NextResponse.json({
      stepsCompleted: parseSteps(updatedSettings.stepsCompleted),
      onboardingCompleted: updatedSettings.onboardingCompleted,
    })
  } catch (error) {
    console.error('Plan progress error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to update plan progress' },
      { status: 500 }
    )
  }
}


