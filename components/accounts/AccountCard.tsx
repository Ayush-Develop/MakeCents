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

const gradientByType: Record<string, string> = {
  CHECKING: 'from-slate-900/90 via-blue-950/30 to-slate-900/80',
  SAVINGS: 'from-slate-900/90 via-emerald-900/40 to-slate-900/80',
  CREDIT_CARD: 'from-slate-900/90 via-rose-900/40 to-slate-900/80',
  BROKERAGE: 'from-slate-900/90 via-purple-900/40 to-slate-900/80',
  RETIREMENT_401K: 'from-slate-900/90 via-teal-900/40 to-slate-900/80',
  RETIREMENT_IRA: 'from-slate-900/90 via-teal-900/40 to-slate-900/80',
  RETIREMENT_ROTH_IRA: 'from-slate-900/90 via-teal-900/40 to-slate-900/80',
  INVESTMENT: 'from-slate-900/90 via-purple-900/40 to-slate-900/80',
  OTHER: 'from-slate-900/90 via-slate-900/50 to-slate-900/80',
}

const institutionDomainMap: Record<string, string> = {
  bankofamerica: 'bankofamerica.com',
  chase: 'chase.com',
  wellsfargo: 'wellsfargo.com',
  citibank: 'citi.com',
  usbank: 'usbank.com',
  pncbank: 'pnc.com',
  capitalone: 'capitalone.com',
  tdbank: 'tdbank.com',
  suntrust: 'suntrust.com',
  bbt: 'truist.com',
  navyfederalcreditunion: 'navyfederal.org',
  stateemployeescreditunion: 'ncsecu.org',
  pentagonfederalcreditunion: 'penfed.org',
  allybank: 'ally.com',
  discoverbank: 'discover.com',
  americanexpress: 'americanexpress.com',
  charlesschwab: 'schwab.com',
  fidelity: 'fidelity.com',
  vanguard: 'vanguard.com',
  robinhood: 'robinhood.com',
  webull: 'webull.com',
  etrade: 'etrade.com',
  tdameritrade: 'tdameritrade.com',
  interactivebrokers: 'interactivebrokers.com',
  merrilllynch: 'ml.com',
  morganstanley: 'morganstanley.com',
  goldmansachs: 'goldmansachs.com',
}

const normalize = (value?: string | null) =>
  value?.toLowerCase().replace(/[^a-z0-9]/g, '') || ''

const LOGO_DEV_BASE_URL = 'https://img.logo.dev'
const LOGO_DEV_PARAMS = 'size=96&format=webp&retina=true'

const getInstitutionLogo = (provider?: string | null) => {
  const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN
  if (!provider || !token) return null

  const normalized = normalize(provider)
  const mappedDomain = institutionDomainMap[normalized]

  const providerLooksLikeDomain = provider.includes('.')
  const cleanedDomain = providerLooksLikeDomain
    ? provider
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0]
    : null

  const domain = mappedDomain || cleanedDomain
  if (!domain) return null

  return `${LOGO_DEV_BASE_URL}/${domain}?token=${token}&${LOGO_DEV_PARAMS}`
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
  const gradientBackground =
    gradientByType[account.type as keyof typeof gradientByType] || gradientByType.OTHER

  const handleExpenses = (event: React.MouseEvent) => {
    event.stopPropagation()
    router.push(expensesHref)
  }

  return (
    <Card
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br text-white shadow-[0_20px_45px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all duration-300 hover:border-white/15 hover:shadow-[0_30px_60px_rgba(0,0,0,0.5)] p-5 md:p-6',
        gradientBackground
      )}
    >
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
            <div className="mt-4 pt-4 border-t border-white/10">
              <Button
                variant="ghost"
                className="text-xs px-0 py-0 text-gray-300 hover:text-white inline-flex items-center gap-2 justify-start"
                onClick={(event) => {
                  event.stopPropagation()
                  router.push(importHref)
                }}
              >
                <Upload className="w-3 h-3" />
                Import CSV
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

