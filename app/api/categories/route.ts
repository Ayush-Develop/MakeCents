import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getServerUserId } from '@/lib/auth'

const categorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER']),
  color: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().optional(),
})

export async function GET() {
  try {
    const userId = getServerUserId()
    const categories = await prisma.category.findMany({
      where: { userId },
      include: {
        children: true,
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getServerUserId()
    const body = await request.json()
    const data = categorySchema.parse(body)

    const category = await prisma.category.create({
      data: {
        ...data,
        userId,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}


