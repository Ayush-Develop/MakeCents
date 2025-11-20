import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a test user (we'll use this ID throughout)
  const userId = 'user-1'

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing data...')
  await prisma.transaction.deleteMany({ where: { userId } })
  await prisma.category.deleteMany({ where: { userId } })
  await prisma.account.deleteMany({ where: { userId } })
  
  // Create or get user
  const user = await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed-password-placeholder', // In real app, this would be hashed
    },
  })
  console.log('✅ Cleaned existing data and ensured user exists')

  // Create some accounts
  const accounts = await Promise.all([
    prisma.account.create({
      data: {
        userId,
        name: 'Chase Checking',
        type: 'CHECKING',
        balance: 5000,
        currency: 'USD',
        provider: 'Chase',
        accountNumber: '****1234',
      },
    }),
    prisma.account.create({
      data: {
        userId,
        name: 'Savings Account',
        type: 'SAVINGS',
        balance: 15000,
        currency: 'USD',
        provider: 'Chase',
        accountNumber: '****5678',
      },
    }),
    prisma.account.create({
      data: {
        userId,
        name: 'Chase Credit Card',
        type: 'CREDIT_CARD',
        balance: -1200, // Negative for credit cards (debt)
        currency: 'USD',
        provider: 'Chase',
        accountNumber: '****9012',
      },
    }),
    prisma.account.create({
      data: {
        userId,
        name: 'Robinhood Portfolio',
        type: 'BROKERAGE',
        balance: 25000,
        currency: 'USD',
        provider: 'Robinhood',
      },
    }),
    prisma.account.create({
      data: {
        userId,
        name: '401(k) Retirement',
        type: 'RETIREMENT_401K',
        balance: 45000,
        currency: 'USD',
        provider: 'Fidelity',
      },
    }),
  ])

  console.log(`✅ Created ${accounts.length} accounts`)

  // Create some categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        userId,
        name: 'Food & Dining',
        type: 'EXPENSE',
        color: '#3b82f6',
        icon: 'utensils',
        budgetType: 'NEED',
        budgetTarget: 300,
      },
    }),
    prisma.category.create({
      data: {
        userId,
        name: 'Shopping',
        type: 'EXPENSE',
        color: '#8b5cf6',
        icon: 'shopping-bag',
        budgetType: 'WANT',
        budgetTarget: 250,
      },
    }),
    prisma.category.create({
      data: {
        userId,
        name: 'Transportation',
        type: 'EXPENSE',
        color: '#10b981',
        icon: 'car',
        budgetType: 'NEED',
        budgetTarget: 200,
      },
    }),
    prisma.category.create({
      data: {
        userId,
        name: 'Salary',
        type: 'INCOME',
        color: '#10b981',
        icon: 'dollar-sign',
        budgetType: 'SAVINGS',
      },
    }),
  ])

  console.log(`✅ Created ${categories.length} categories`)

  // Create default user settings aligned with SAP plan
  await prisma.$executeRaw`
    INSERT INTO UserSettings (
      userId,
      monthlyNetIncomeGoal,
      emergencyFundTargetMonths,
      planVersion,
      onboardingCompleted,
      stepsCompleted,
      createdAt,
      updatedAt
    )
    VALUES (
      ${userId},
      7400,
      6,
      'SAP_NEXT_TALENT_2025',
      0,
      '[]',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT(userId) DO UPDATE SET
      monthlyNetIncomeGoal=excluded.monthlyNetIncomeGoal,
      emergencyFundTargetMonths=excluded.emergencyFundTargetMonths,
      planVersion=excluded.planVersion,
      onboardingCompleted=excluded.onboardingCompleted,
      stepsCompleted=excluded.stepsCompleted,
      updatedAt=CURRENT_TIMESTAMP
  `
  console.log('✅ Created default user settings')

  // Create baseline financial goals
  const goals = await Promise.all([
    prisma.investmentGoal.create({
      data: {
        userId,
        name: 'Emergency Fund',
        description: 'Cover 3-6 months of expenses ($15k target)',
        targetAmount: 15000,
        currentAmount: 5000,
        targetDate: new Date('2025-12-31'),
        priority: 10,
        monthlyTarget: 1200,
        fundingAccountId: savingsAccount.id,
      },
    }),
    prisma.investmentGoal.create({
      data: {
        userId,
        name: 'Roth IRA Max',
        description: 'Max out Roth IRA contributions for the year',
        targetAmount: 7000,
        currentAmount: 2500,
        targetDate: new Date('2025-12-31'),
        priority: 8,
        monthlyTarget: 583.33,
        fundingAccountId: investmentAccount.id,
      },
    }),
    prisma.investmentGoal.create({
      data: {
        userId,
        name: 'Relationship Travel Fund',
        description: 'Budget for monthly UIUC trips',
        targetAmount: 3000,
        currentAmount: 900,
        targetDate: new Date('2025-08-31'),
        priority: 6,
        monthlyTarget: 250,
        fundingAccountId: checkingAccount.id,
      },
    }),
  ])

  console.log(`✅ Created ${goals.length} default goals`)

  // Create some sample transactions
  const checkingAccount = accounts[0]
  const savingsAccount = accounts[1]
  const investmentAccount = accounts[3]
  const foodCategory = categories[0]
  const shoppingCategory = categories[1]
  const salaryCategory = categories[3]

  const transactions = await Promise.all([
    // Income
    prisma.transaction.create({
      data: {
        userId,
        accountId: checkingAccount.id,
        categoryId: salaryCategory.id,
        amount: 5000,
        type: 'INCOME',
        description: 'Monthly Salary',
        date: new Date('2024-01-01'),
        merchant: 'Employer',
      },
    }),
    // Expenses
    prisma.transaction.create({
      data: {
        userId,
        accountId: checkingAccount.id,
        categoryId: foodCategory.id,
        amount: 85.50,
        type: 'EXPENSE',
        description: 'Grocery Shopping',
        date: new Date('2024-01-15'),
        merchant: 'Whole Foods',
        tags: JSON.stringify(['groceries', 'food']),
      },
    }),
    prisma.transaction.create({
      data: {
        userId,
        accountId: checkingAccount.id,
        categoryId: shoppingCategory.id,
        amount: 120.00,
        type: 'EXPENSE',
        description: 'New Shoes',
        date: new Date('2024-01-20'),
        merchant: 'Nike Store',
        tags: JSON.stringify(['clothing']),
      },
    }),
    prisma.transaction.create({
      data: {
        userId,
        accountId: checkingAccount.id,
        categoryId: foodCategory.id,
        amount: 45.00,
        type: 'EXPENSE',
        description: 'Dinner Out',
        date: new Date('2024-01-22'),
        merchant: 'Local Restaurant',
      },
    }),
  ])

  console.log(`✅ Created ${transactions.length} transactions`)

  await prisma.planRule.createMany({
    data: [
      {
        userId,
        ruleType: '401K_MATCH',
        isEnabled: true,
        targetValue: 0.08,
        metadata: JSON.stringify({ description: 'Contribute 8% to capture full match' }),
      },
      {
        userId,
        ruleType: 'EMERGENCY_FUND',
        isEnabled: true,
        targetValue: 6,
        metadata: JSON.stringify({ unit: 'months' }),
      },
      {
        userId,
        ruleType: 'ROTH_MAX',
        isEnabled: true,
        targetValue: 7000,
        metadata: JSON.stringify({ period: 'annual' }),
      },
      {
        userId,
        ruleType: 'TRAVEL_CAP',
        isEnabled: true,
        targetValue: 300,
        metadata: JSON.stringify({ description: 'Monthly UIUC travel budget' }),
      },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Seeded baseline plan rules')

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

