import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerUserId } from '@/lib/auth'

const metadataSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
})

export async function POST(request: NextRequest) {
  try {
    const userId = getServerUserId()
    const body = await request.json()
    const payload = metadataSchema.parse(body)

    const record = await prisma.planMetadata.upsert({
      where: {
        userId_key: {
          userId,
          key: payload.key,
        },
      },
      create: {
        userId,
        key: payload.key,
        value: JSON.stringify(payload.value),
      },
      update: {
        value: JSON.stringify(payload.value),
      },
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('Plan metadata error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to save plan metadata' },
      { status: 500 }
    )
  }
}


