import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Clearing all accounts...')

  const userId = 'user-1'

  // Delete all accounts for the user
  const deletedAccounts = await prisma.account.deleteMany({
    where: { userId },
  })

  console.log(`✅ Deleted ${deletedAccounts.count} accounts`)

  // Also delete related transactions
  const deletedTransactions = await prisma.transaction.deleteMany({
    where: { userId },
  })

  console.log(`✅ Deleted ${deletedTransactions.count} transactions`)

  // Delete investments and trades
  const deletedTrades = await prisma.trade.deleteMany({
    where: { userId },
  })

  const deletedInvestments = await prisma.investment.deleteMany({
    where: { userId },
  })

  console.log(`✅ Deleted ${deletedTrades.count} trades`)
  console.log(`✅ Deleted ${deletedInvestments.count} investments`)

  console.log('🎉 All account data cleared!')
}

main()
  .catch((e) => {
    console.error('❌ Error clearing accounts:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


