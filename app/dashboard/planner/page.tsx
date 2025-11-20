import { prisma } from '@/lib/prisma'
import { getServerUserId } from '@/lib/auth'
import { GoalsClient } from './GoalsClient'

export default async function PlannerPage() {
  const userId = getServerUserId()
  const goals = await prisma.investmentGoal.findMany({
    where: { userId },
    orderBy: [
      { isCompleted: 'asc' },
      { priority: 'desc' },
      { targetDate: 'asc' },
    ],
  })

  return (
    <div className="p-8">
      <GoalsClient initialGoals={goals} />
    </div>
  )
}


