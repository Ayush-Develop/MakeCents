// Stock price API service
// Supports multiple free APIs: Alpha Vantage, Yahoo Finance (via yfinance), or Polygon.io

interface StockPriceResult {
  symbol: string
  price: number
  change: number
  changePercent: number
  lastUpdated: Date
}

interface StockQuote {
  symbol: string
  price: number
  change?: number
  changePercent?: number
}

// Alpha Vantage API (free tier: 5 calls/min, 500 calls/day)
// Get free API key at: https://www.alphavantage.co/support/#api-key
async function getPriceFromAlphaVantage(symbol: string): Promise<StockQuote | null> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY
  if (!apiKey) return null

  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
    const response = await fetch(url)
    const data = await response.json()

    if (data['Global Quote'] && data['Global Quote']['05. price']) {
      const quote = data['Global Quote']
      const price = parseFloat(quote['05. price'])
      const change = parseFloat(quote['09. change'] || '0')
      const changePercent = parseFloat(quote['10. change percent']?.replace('%', '') || '0')

      return {
        symbol,
        price,
        change,
        changePercent,
      }
    }
  } catch (error) {
    console.error(`Alpha Vantage error for ${symbol}:`, error)
  }

  return null
}

// Yahoo Finance (free, no API key needed, but rate-limited)
// Using unofficial endpoint - may break, but widely used
async function getPriceFromYahooFinance(symbol: string): Promise<StockQuote | null> {
  try {
    // Using yahoo finance quote endpoint
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    })
    const data = await response.json()

    if (data.chart?.result?.[0]?.meta) {
      const meta = data.chart.result[0].meta
      const price = meta.regularMarketPrice || meta.previousClose
      const previousClose = meta.previousClose || price
      const change = price - previousClose
      const changePercent = previousClose ? ((change / previousClose) * 100) : 0

      return {
        symbol: symbol.toUpperCase(),
        price,
        change,
        changePercent,
      }
    }
  } catch (error) {
    console.error(`Yahoo Finance error for ${symbol}:`, error)
  }

  return null
}

// Polygon.io (free tier: 5 calls/min)
// Get free API key at: https://polygon.io/
async function getPriceFromPolygon(symbol: string): Promise<StockQuote | null> {
  const apiKey = process.env.POLYGON_API_KEY
  if (!apiKey) return null

  try {
    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${apiKey}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.results?.[0]) {
      const result = data.results[0]
      const price = result.c // closing price
      const open = result.o
      const change = price - open
      const changePercent = open ? ((change / open) * 100) : 0

      return {
        symbol: symbol.toUpperCase(),
        price,
        change,
        changePercent,
      }
    }
  } catch (error) {
    console.error(`Polygon error for ${symbol}:`, error)
  }

  return null
}

/**
 * Get current stock price for a symbol
 * Tries multiple free APIs in order of preference
 */
export async function getStockPrice(symbol: string): Promise<StockPriceResult | null> {
  const normalizedSymbol = symbol.toUpperCase().trim()

  // Try Alpha Vantage first (if API key is set)
  if (process.env.ALPHA_VANTAGE_API_KEY) {
    const result = await getPriceFromAlphaVantage(normalizedSymbol)
    if (result) {
      return {
        symbol: normalizedSymbol,
        price: result.price,
        change: result.change || 0,
        changePercent: result.changePercent || 0,
        lastUpdated: new Date(),
      }
    }
  }

  // Try Polygon.io (if API key is set)
  if (process.env.POLYGON_API_KEY) {
    const result = await getPriceFromPolygon(normalizedSymbol)
    if (result) {
      return {
        symbol: normalizedSymbol,
        price: result.price,
        change: result.change || 0,
        changePercent: result.changePercent || 0,
        lastUpdated: new Date(),
      }
    }
  }

  // Fallback to Yahoo Finance (no API key needed)
  const result = await getPriceFromYahooFinance(normalizedSymbol)
  if (result) {
    return {
      symbol: normalizedSymbol,
      price: result.price,
      change: result.change || 0,
      changePercent: result.changePercent || 0,
      lastUpdated: new Date(),
    }
  }

  return null
}

/**
 * Get prices for multiple symbols
 * Returns a map of symbol -> price result
 */
export async function getStockPrices(symbols: string[]): Promise<Map<string, StockPriceResult>> {
  const results = new Map<string, StockPriceResult>()

  // Fetch prices with a small delay to respect rate limits
  for (const symbol of symbols) {
    const price = await getStockPrice(symbol)
    if (price) {
      results.set(symbol.toUpperCase(), price)
    }
    // Small delay to avoid rate limits (especially for free tiers)
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  return results
}



