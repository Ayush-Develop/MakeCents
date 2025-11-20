import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerUserId } from '@/lib/auth'

const ruleSchema = z.object({
  ruleType: z.string().min(1),
  isEnabled: z.boolean(),
  targetValue: z.number().nullable().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const userId = getServerUserId()
    const body = await request.json()
    const rules = z.array(ruleSchema).min(1).parse(body)

    const updatedRules = await Promise.all(
      rules.map((rule) =>
        prisma.planRule.upsert({
          where: {
            userId_ruleType: {
              userId,
              ruleType: rule.ruleType,
            },
          },
          create: {
            userId,
            ruleType: rule.ruleType,
            isEnabled: rule.isEnabled,
            targetValue: rule.targetValue ?? undefined,
            metadata: JSON.stringify({
              ...(rule.metadata || {}),
              ...(rule.notes ? { notes: rule.notes } : {}),
            }),
          },
          update: {
            isEnabled: rule.isEnabled,
            targetValue: rule.targetValue ?? undefined,
            metadata: JSON.stringify({
              ...(rule.metadata || {}),
              ...(rule.notes ? { notes: rule.notes } : {}),
            }),
          },
        })
      )
    )

    return NextResponse.json(updatedRules)
  } catch (error) {
    console.error('Plan rule error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to upsert plan rules' },
      { status: 500 }
    )
  }
}


