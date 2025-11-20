import Papa from 'papaparse'

export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  balance?: number
  category?: string
  merchant?: string
}

/**
 * Parse CSV file and extract transactions
 * Handles various CSV formats from different banks
 */
export function parseCSV(file: File): Promise<ParsedTransaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions = results.data
            .map((row: any) => {
              // Try to find date column (case-insensitive)
              const dateKey = Object.keys(row).find(
                (key) =>
                  key.toLowerCase().includes('date') ||
                  key.toLowerCase().includes('transaction date')
              )

              // Try to find description column
              const descKey =
                Object.keys(row).find(
                  (key) =>
                    key.toLowerCase().includes('description') ||
                    key.toLowerCase().includes('memo') ||
                    key.toLowerCase().includes('payee') ||
                    key.toLowerCase().includes('details')
                ) || 'Description'

              // Try to find amount column
              const amountKey =
                Object.keys(row).find(
                  (key) =>
                    key.toLowerCase().includes('amount') ||
                    key.toLowerCase().includes('transaction amount')
                ) || 'Amount'

              // Try to find balance column
              const balanceKey = Object.keys(row).find(
                (key) =>
                  key.toLowerCase().includes('balance') ||
                  key.toLowerCase().includes('running balance')
              )

              // Try to find merchant/category
              const merchantKey = Object.keys(row).find(
                (key) =>
                  key.toLowerCase().includes('merchant') ||
                  key.toLowerCase().includes('vendor')
              )

              const categoryKey = Object.keys(row).find((key) =>
                key.toLowerCase().includes('category')
              )

              const date = dateKey ? row[dateKey] : null
              const description = row[descKey] || ''
              const amountStr = row[amountKey] || '0'
              const balanceStr = balanceKey ? row[balanceKey] : null
              const merchant = merchantKey ? row[merchantKey] : null
              const category = categoryKey ? row[categoryKey] : null

              // Parse amount (handle currency symbols, commas, etc.)
              const amount = parseFloat(
                amountStr.toString().replace(/[^0-9.-]/g, '')
              )

              // Parse balance if available
              const balance = balanceStr
                ? parseFloat(balanceStr.toString().replace(/[^0-9.-]/g, ''))
                : undefined

              // Skip invalid rows
              if (!date || isNaN(amount)) {
                return null
              }

              return {
                date,
                description: description.toString().trim(),
                amount,
                balance,
                merchant: merchant?.toString().trim(),
                category: category?.toString().trim(),
              }
            })
            .filter((t): t is ParsedTransaction => t !== null)

          resolve(transactions)
        } catch (error) {
          reject(new Error('Failed to parse CSV: ' + (error as Error).message))
        }
      },
      error: (error) => {
        reject(new Error('CSV parsing error: ' + error.message))
      },
    })
  })
}

/**
 * Validate CSV format before parsing
 */
export function validateCSVFormat(file: File): boolean {
  // Check file extension
  const validExtensions = ['.csv', '.txt']
  const extension = file.name
    .substring(file.name.lastIndexOf('.'))
    .toLowerCase()

  return validExtensions.includes(extension)
}

