'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { cn, formatCurrency } from '@/lib/utils'
import { type AccountPerformance } from '@/lib/account-performance'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'

const institutionColors = [
  'bg-indigo-600',
  'bg-emerald-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-blue-600',
  'bg-purple-600',
  'bg-teal-600',
  'bg-sky-600',
  'bg-pink-600',
  'bg-orange-600',
]

const institutionLogoMap: Record<string, string> = {
  bankofamerica: 'https://logo.clearbit.com/bankofamerica.com',
  chase: 'https://logo.clearbit.com/chase.com',
  wellsfargo: 'https://logo.clearbit.com/wellsfargo.com',
  citibank: 'https://logo.clearbit.com/citi.com',
  usbank: 'https://logo.clearbit.com/usbank.com',
  pncbank: 'https://logo.clearbit.com/pnc.com',
  capitalone: 'https://logo.clearbit.com/capitalone.com',
  tdbank: 'https://logo.clearbit.com/tdbank.com',
  suntrust: 'https://logo.clearbit.com/suntrust.com',
  bbt: 'https://logo.clearbit.com/bbt.com',
  navyfederalcreditunion: 'https://logo.clearbit.com/navyfederal.org',
  stateemployeescreditunion: 'https://logo.clearbit.com/ncsecu.org',
  pentagonfederalcreditunion: 'https://logo.clearbit.com/penfed.org',
  allybank: 'https://logo.clearbit.com/ally.com',
  discoverbank: 'https://logo.clearbit.com/discover.com',
  americanexpress: 'https://logo.clearbit.com/americanexpress.com',
  charlesschwab: 'https://logo.clearbit.com/schwab.com',
  fidelity: 'https://logo.clearbit.com/fidelity.com',
  vanguard: 'https://logo.clearbit.com/vanguard.com',
  robinhood: 'https://logo.clearbit.com/robinhood.com',
  webull: 'https://logo.clearbit.com/webull.com',
  etrade: 'https://logo.clearbit.com/etrade.com',
  tdameritrade: 'https://logo.clearbit.com/tdameritrade.com',
  interactivebrokers: 'https://logo.clearbit.com/interactivebrokers.com',
  merrilllynch: 'https://logo.clearbit.com/ml.com',
  morganstanley: 'https://logo.clearbit.com/morganstanley.com',
  goldmansachs: 'https://logo.clearbit.com/goldmansachs.com',
}

const normalize = (value?: string | null) =>
  value?.toLowerCase().replace(/[^a-z0-9]/g, '') || ''

const getInstitutionLogo = (provider?: string | null) => {
  const normalized = normalize(provider)
  if (!normalized) return null
  if (institutionLogoMap[normalized]) {
    return institutionLogoMap[normalized]
  }
  return null
}

function sanitizeAccountName(name: string, provider?: string | null) {
  if (!name) return 'Account'
  if (!provider) return name
  const regex = new RegExp(provider, 'i')
  const sanitized = name.replace(regex, '').replace(/\s+/g, ' ').trim()
  return sanitized.length > 0 ? sanitized : name
}

type AccountCardAccount = {
  id: string
  name: string
  type: string
  accountNumber: string | null
  provider: string | null
  balance: number
  currency: string | null
}

interface AccountCardProps {
  account: AccountCardAccount
  performance?: AccountPerformance
  expensesHref: string
  importHref?: string
  showImportOption?: boolean
  source?: 'MANUAL' | 'TELLER'
}

export function AccountCard({
  account,
  performance,
  expensesHref,
  importHref,
  showImportOption = false,
  source = 'MANUAL',
}: AccountCardProps) {
  const router = useRouter()
  const [logoFailed, setLogoFailed] = useState(false)

  const displayBalance = account.type === 'CREDIT_CARD' ? Math.abs(account.balance) : account.balance
  const isNegative = account.balance < 0 && account.type !== 'CREDIT_CARD'
  const hasChange = performance && performance.change !== 0
  const isPositiveChange = performance ? performance.change >= 0 : true
  const changeColor = hasChange ? (isPositiveChange ? 'text-green-500' : 'text-red-500') : 'text-gray-500 dark:text-gray-400'

  const typeLabel = account.type.replace(/_/g, ' ')
  const institutionSource = (account.provider?.trim() || account.name?.trim() || '?')
  const institutionInitial = institutionSource.charAt(0).toUpperCase()
  const institutionIndex = institutionSource.charCodeAt(0) % institutionColors.length
  const institutionColor = institutionColors[institutionIndex]
  const institutionLogo = getInstitutionLogo(account.provider)

  const handleExpenses = (event: React.MouseEvent) => {
    event.stopPropagation()
    router.push(expensesHref)
  }

  return (
    <Card className="hover:shadow-lg transition-shadow relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-shrink-0">
          {institutionLogo && !logoFailed ? (
            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
              <img
                src={institutionLogo}
                alt={`${account.provider || account.name || 'Institution'} logo`}
                className="h-full w-full object-contain"
                loading="lazy"
                onError={() => setLogoFailed(true)}
              />
            </div>
          ) : (
            <div className={cn('p-3 rounded-2xl text-white font-semibold shadow-inner', institutionColor)}>
              {institutionInitial}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-50 truncate max-w-[240px]">
                {sanitizeAccountName(account.name, account.provider)}
              </h3>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {source === 'TELLER' && (
                  <span
                    title="Linked via Teller"
                    className="inline-flex items-center"
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                  </span>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                  <span>{typeLabel}</span>
                  {account.accountNumber && (
                    <span>• {account.accountNumber}</span>
                  )}
                  {account.provider && (
                    <span className="truncate">• {account.provider}</span>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              className="text-xs px-2 py-1 text-indigo-400 hover:text-indigo-200"
              onClick={handleExpenses}
            >
              View Expenses
            </Button>
          </div>

          <div className="mt-4 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0"></div>
            <div className="text-right">
              <p className={`text-xl font-bold leading-tight ${isNegative ? 'text-red-400' : 'text-white'}`}>
                {formatCurrency(displayBalance, account.currency || undefined)}
              </p>
              <div className="mt-0.5 flex items-center justify-end gap-2 text-xs">
                <span className={`font-medium ${changeColor}`}>
                  {hasChange ? (
                    <>
                      {isPositiveChange ? '+' : ''}
                      {performance?.changePercent.toFixed(1)}% ({isPositiveChange ? '+' : ''}
                      {formatCurrency(Math.abs(performance!.change))})
                    </>
                  ) : (
                    'No change'
                  )}
                </span>
                <span className="text-gray-500 dark:text-gray-400">this month</span>
              </div>
            </div>
          </div>

          {showImportOption && importHref && (
            <div className="mt-4">
              <Button
                variant="ghost"
                className="text-xs px-3 py-1 text-gray-300 hover:text-white"
                onClick={(event) => {
                  event.stopPropagation()
                  router.push(importHref)
                }}
              >
                <Upload className="w-3 h-3 mr-1" />
                Import CSV
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

