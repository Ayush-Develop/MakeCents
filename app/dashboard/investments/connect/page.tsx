'use client'

import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { useState } from 'react'
import { ExternalLink } from 'lucide-react'

const brokers = [
  {
    name: 'Webull',
    description: 'Connect your Webull account using their official OpenAPI',
    logo: '📈',
    supported: true,
  },
  {
    name: 'Robinhood',
    description: 'Connect your Robinhood account (crypto API available, stock trading via manual entry)',
    logo: '🎯',
    supported: false,
  },
]

export default function ConnectBrokerPage() {
  const [selectedBroker, setSelectedBroker] = useState<string | null>(null)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Connect Broker
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Link your investment accounts to automatically sync holdings and trades
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {brokers.map((broker) => (
          <Card
            key={broker.name}
            className={`cursor-pointer transition-all ${
              selectedBroker === broker.name
                ? 'ring-2 ring-indigo-500'
                : 'hover:shadow-lg'
            }`}
            onClick={() => setSelectedBroker(broker.name)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <span className="text-4xl mr-4">{broker.logo}</span>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {broker.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {broker.description}
                  </p>
                </div>
              </div>
              {!broker.supported && (
                <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                  Coming Soon
                </span>
              )}
            </div>
            {broker.supported && (
              <Button
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  // TODO: Implement broker connection flow
                  alert(`${broker.name} connection will be implemented soon`)
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Connect {broker.name}
              </Button>
            )}
          </Card>
        ))}
      </div>

      <Card className="mt-8 max-w-4xl">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Manual Entry
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Don't see your broker? You can manually add your accounts and trades. Go to{' '}
          <a href="/dashboard/accounts/new" className="text-indigo-600 hover:underline">
            Add Account
          </a>{' '}
          to get started.
        </p>
      </Card>
    </div>
  )
}


