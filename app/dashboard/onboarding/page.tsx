import { PlanWizardClient } from '@/components/onboarding/PlanWizardClient'
import { getServerUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getCategoryBreakdown,
  getFinancialHealth,
} from '@/lib/analytics/dashboard'

function parseSteps(value?: string | null): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default async function OnboardingPage() {
  const userId = getServerUserId()

  const [
    settings,
    accounts,
    categories,
    goals,
    planRules,
    payrollTransactions,
    relocationTransaction,
    planMetadata,
    topCategoriesBreakdown,
    financialHealth,
  ] = await Promise.all([
    prisma.userSettings.findUnique({ where: { userId } }),
    prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    }),
    prisma.investmentGoal.findMany({
      where: { userId },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    }),
    prisma.planRule.findMany({
      where: { userId },
    }),
    prisma.transaction.findMany({
      where: { userId, type: 'INCOME' },
      include: { account: true },
      orderBy: { date: 'desc' },
      take: 6,
    }),
    prisma.transaction.findFirst({
      where: {
        userId,
        tags: {
          contains: 'relocation',
        },
      },
      orderBy: { date: 'desc' },
    }),
    prisma.planMetadata.findMany({
      where: { userId },
    }),
    getCategoryBreakdown(userId),
    getFinancialHealth(userId),
  ])

  const topCategories = topCategoriesBreakdown.slice(0, 8)
  const planMetadataMap = planMetadata.reduce<Record<string, any>>(
    (acc, meta) => {
      try {
        acc[meta.key] = meta.value ? JSON.parse(meta.value) : null
      } catch {
        acc[meta.key] = meta.value
      }
      return acc
    },
    {}
  )

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <PlanWizardClient
          initialData={{
            settings: settings
              ? {
                  ...settings,
                  stepsCompleted: parseSteps(settings.stepsCompleted),
                }
              : { userId, stepsCompleted: [] },
            accounts,
            categories,
            goals,
            planRules,
            payrollTransactions,
            relocationTransaction,
            topCategories,
            financialHealth,
            planMetadata: planMetadataMap,
          }}
        />
      </div>
    </div>
  )
}


