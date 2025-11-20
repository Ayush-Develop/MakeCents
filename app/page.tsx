import Link from 'next/link'
import { Wallet, TrendingUp, PieChart, Target } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            MakeCents
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Your comprehensive financial dashboard
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <FeatureCard
            icon={Wallet}
            title="Expense Management"
            description="Track debit and credit card expenses with smart categorization"
            href="/dashboard/expenses"
          />
          <FeatureCard
            icon={TrendingUp}
            title="Investment Tracking"
            description="Connect with brokers and monitor your portfolio performance"
            href="/dashboard/investments"
          />
          <FeatureCard
            icon={PieChart}
            title="Data Visualizations"
            description="Visualize cash flow and spending patterns with interactive charts"
            href="/dashboard/analytics"
          />
          <FeatureCard
            icon={Target}
            title="Investment Planner"
            description="Set goals and plan your investment strategy"
            href="/dashboard/planner"
          />
        </div>

        <div className="text-center mt-12">
          <Link
            href="/dashboard"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
    >
      <Icon className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </Link>
  )
}


