import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const session = await getServerSession()
  
  if (!session?.user?.id) {
    return (
      <div className="p-8">
        <p className="text-gray-600 dark:text-gray-400">Please sign in to view settings.</p>
      </div>
    )
  }

  // Fetch user data from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      name: true,
    },
  })

  if (!user) {
    return (
      <div className="p-8">
        <p className="text-red-600 dark:text-red-400">User not found.</p>
      </div>
    )
  }

  return <SettingsClient initialUser={user} />
}


