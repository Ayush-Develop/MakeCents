'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  PieChart,
  Target,
  Settings,
  CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Accounts', href: '/dashboard/accounts', icon: Wallet },
  { name: 'Expenses', href: '/dashboard/expenses', icon: CreditCard },
  { name: 'Investments', href: '/dashboard/investments', icon: TrendingUp },
  { name: 'Analytics', href: '/dashboard/analytics', icon: PieChart },
  { name: 'Trading Journal', href: '/dashboard/journal', icon: Target },
  { name: 'Planner', href: '/dashboard/planner', icon: Target },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          MakeCents
        </h1>
      </div>
      <nav className="px-4 space-y-1">
        {navigation.map((item) => {
          const isExactMatch = pathname === item.href
          const isNestedMatch =
            item.href !== '/dashboard' && pathname?.startsWith(item.href + '/')
          const isActive = isExactMatch || isNestedMatch
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}


