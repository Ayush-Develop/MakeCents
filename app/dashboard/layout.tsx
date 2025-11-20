import { Sidebar } from '@/components/Sidebar'
import { BackgroundSync } from '@/components/BackgroundSync'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        {children}
      </main>
      {/* Background sync runs every 15 minutes */}
      <BackgroundSync intervalMinutes={15} enabled={true} />
    </div>
  )
}


