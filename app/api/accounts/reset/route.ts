import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// TODO: Add authentication middleware
const getUserId = () => 'user-1' // Placeholder

/**
 * Reset all accounts and related data (for testing)
 * DELETE /api/accounts/reset
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserId()

    // Delete in correct order to respect foreign key constraints
    await prisma.$transaction([
      // Delete transactions first (references accounts)
      prisma.transaction.deleteMany({ where: { userId } }),
      // Delete investments and trades
      prisma.trade.deleteMany({ where: { userId } }),
      prisma.investment.deleteMany({ where: { userId } }),
      // Delete accounts
      prisma.account.deleteMany({ where: { userId } }),
      // Delete categories (optional - you might want to keep these)
      // prisma.category.deleteMany({ where: { userId } }),
    ])

    return NextResponse.json({
      success: true,
      message: 'All accounts and transactions have been reset',
    })
  } catch (error: any) {
    console.error('Reset accounts error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to reset accounts',
        success: false,
      },
      { status: 500 }
    )
  }
}


