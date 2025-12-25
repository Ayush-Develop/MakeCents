import { NextRequest, NextResponse } from 'next/server'
import { getServerUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getServerUserId()
    const body = await request.json()
    const validated = updateProfileSchema.parse(body)

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: validated.name || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

