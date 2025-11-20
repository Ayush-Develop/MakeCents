import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerUserId } from '@/lib/auth'

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER']).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().nullable().optional(),
  budgetType: z.enum(['NEED', 'WANT', 'SAVINGS', 'DEBT']).optional(),
  budgetTarget: z.number().nonnegative().nullable().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getServerUserId()
    const body = await request.json()
    const payload = updateCategorySchema.parse(body)

    const result = await prisma.category.updateMany({
      where: {
        id: params.id,
        userId,
      },
      data: payload,
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const category = await prisma.category.findUnique({
      where: { id: params.id },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Category PATCH error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}


