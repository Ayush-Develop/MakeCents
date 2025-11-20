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
      },
    }),
    prisma.category.create({
      data: {
        userId,
        name: 'Shopping',
        type: 'EXPENSE',
        color: '#8b5cf6',
        icon: 'shopping-bag',
      },
    }),
    prisma.category.create({
      data: {
        userId,
        name: 'Transportation',
        type: 'EXPENSE',
        color: '#10b981',
        icon: 'car',
      },
    }),
    prisma.category.create({
      data: {
        userId,
        name: 'Salary',
        type: 'INCOME',
        color: '#10b981',
        icon: 'dollar-sign',
      },
    }),
  ])

  console.log(`✅ Created ${categories.length} categories`)

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
      },
    }),
  ])

  console.log(`✅ Created ${goals.length} default goals`)

  // Create some sample transactions
  const checkingAccount = accounts[0]
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

