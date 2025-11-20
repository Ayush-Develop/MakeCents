// Common banks and financial institutions
export const BANKS = [
  // Major US Banks
  { value: 'chase', label: 'Chase' },
  { value: 'bank-of-america', label: 'Bank of America' },
  { value: 'wells-fargo', label: 'Wells Fargo' },
  { value: 'citibank', label: 'Citibank' },
  { value: 'us-bank', label: 'U.S. Bank' },
  { value: 'pnc', label: 'PNC Bank' },
  { value: 'capital-one', label: 'Capital One' },
  { value: 'td-bank', label: 'TD Bank' },
  { value: 'suntrust', label: 'SunTrust' },
  { value: 'bbt', label: 'BB&T' },
  
  // Credit Unions
  { value: 'navy-federal', label: 'Navy Federal Credit Union' },
  { value: 'state-employees', label: 'State Employees Credit Union' },
  { value: 'pentagon-federal', label: 'Pentagon Federal Credit Union' },
  
  // Online Banks
  { value: 'ally', label: 'Ally Bank' },
  { value: 'discover', label: 'Discover Bank' },
  { value: 'american-express', label: 'American Express' },
  { value: 'schwab', label: 'Charles Schwab' },
  { value: 'fidelity', label: 'Fidelity' },
  { value: 'vanguard', label: 'Vanguard' },
  
  // Investment Brokers
  { value: 'robinhood', label: 'Robinhood' },
  { value: 'webull', label: 'Webull' },
  { value: 'etrade', label: 'E*TRADE' },
  { value: 'td-ameritrade', label: 'TD Ameritrade' },
  { value: 'interactive-brokers', label: 'Interactive Brokers' },
  { value: 'merrill-lynch', label: 'Merrill Lynch' },
  { value: 'morgan-stanley', label: 'Morgan Stanley' },
  { value: 'goldman-sachs', label: 'Goldman Sachs' },
  
  // Other
  { value: 'other', label: 'Other' },
]

export function getBankLabel(value: string): string {
  const bank = BANKS.find(b => b.value === value)
  return bank ? bank.label : value
}

