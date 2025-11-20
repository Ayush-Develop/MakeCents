// Broker integration framework
// This file provides a unified interface for different broker APIs

export interface BrokerConfig {
  apiKey: string
  apiSecret: string
  accountId?: string
}

export interface BrokerAccount {
  id: string
  name: string
  balance: number
  currency: string
}

export interface BrokerHolding {
  symbol: string
  name: string
  quantity: number
  averageCost: number
  currentPrice: number
  totalValue: number
  unrealizedGain: number
}

export interface BrokerTrade {
  id: string
  symbol: string
  type: 'BUY' | 'SELL'
  quantity: number
  price: number
  fees: number
  date: Date
}

export interface IBrokerAdapter {
  name: string
  connect(config: BrokerConfig): Promise<boolean>
  getAccounts(): Promise<BrokerAccount[]>
  getHoldings(accountId: string): Promise<BrokerHolding[]>
  getTrades(accountId: string, startDate?: Date, endDate?: Date): Promise<BrokerTrade[]>
}

// Webull adapter
export class WebullAdapter implements IBrokerAdapter {
  name = 'Webull'

  async connect(config: BrokerConfig): Promise<boolean> {
    // TODO: Implement Webull API connection
    // Webull has an official OpenAPI: https://developer.webull.com/api-doc/
    throw new Error('Webull integration not yet implemented')
  }

  async getAccounts(): Promise<BrokerAccount[]> {
    throw new Error('Webull integration not yet implemented')
  }

  async getHoldings(accountId: string): Promise<BrokerHolding[]> {
    throw new Error('Webull integration not yet implemented')
  }

  async getTrades(accountId: string, startDate?: Date, endDate?: Date): Promise<BrokerTrade[]> {
    throw new Error('Webull integration not yet implemented')
  }
}

// Robinhood adapter
export class RobinhoodAdapter implements IBrokerAdapter {
  name = 'Robinhood'

  async connect(config: BrokerConfig): Promise<boolean> {
    // TODO: Implement Robinhood API connection
    // Note: Official API is limited to crypto. For stocks, consider using unofficial libraries
    // or manual entry
    throw new Error('Robinhood integration not yet implemented')
  }

  async getAccounts(): Promise<BrokerAccount[]> {
    throw new Error('Robinhood integration not yet implemented')
  }

  async getHoldings(accountId: string): Promise<BrokerHolding[]> {
    throw new Error('Robinhood integration not yet implemented')
  }

  async getTrades(accountId: string, startDate?: Date, endDate?: Date): Promise<BrokerTrade[]> {
    throw new Error('Robinhood integration not yet implemented')
  }
}

// Factory function to get the right adapter
export function getBrokerAdapter(provider: string): IBrokerAdapter {
  switch (provider.toLowerCase()) {
    case 'webull':
      return new WebullAdapter()
    case 'robinhood':
      return new RobinhoodAdapter()
    default:
      throw new Error(`Unsupported broker: ${provider}`)
  }
}


