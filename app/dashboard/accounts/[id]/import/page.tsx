'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { ArrowLeft, Upload, FileText, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { parseCSV, validateCSVFormat, type ParsedTransaction } from '@/lib/csv-parser'

export default function ImportTransactionsPage() {
  const router = useRouter()
  const params = useParams()
  const accountId = params.id as string

  const [file, setFile] = useState<File | null>(null)
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<{
    imported: number
    errors?: Array<{ row: number; error: any }>
  } | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setError(null)
    setImportResult(null)

    // Validate file
    if (!validateCSVFormat(selectedFile)) {
      setError('Please select a CSV file')
      return
    }

    setFile(selectedFile)
    setIsParsing(true)

    try {
      const parsed = await parseCSV(selectedFile)
      setTransactions(parsed)
      if (parsed.length === 0) {
        setError('No transactions found in file. Please check the CSV format.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file')
      setTransactions([])
    } finally {
      setIsParsing(false)
    }
  }

  const handleImport = async () => {
    if (transactions.length === 0) {
      setError('No transactions to import')
      return
    }

    setIsImporting(true)
    setError(null)

    try {
      const response = await fetch(`/api/accounts/${accountId}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactions }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to import transactions')
      }

      const result = await response.json()
      setImportResult(result)

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/dashboard/accounts`)
        router.refresh()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import transactions')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link
        href="/dashboard/accounts"
        className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Accounts
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Import Transactions
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload a CSV file exported from your bank to import transactions
        </p>
      </div>

      <Card>
        <div className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select CSV File
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
                disabled={isParsing || isImporting}
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  CSV files only
                </p>
              </label>
              {file && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm text-gray-900 dark:text-white">
                    {file.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Parsing Status */}
          {isParsing && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Parsing CSV file...
              </p>
            </div>
          )}

          {/* Preview */}
          {transactions.length > 0 && !isImporting && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Preview ({transactions.length} transactions)
                </h2>
                <Button onClick={handleImport}>
                  Import {transactions.length} Transactions
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Description
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {transactions.slice(0, 10).map((t, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {t.date}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {t.description}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm text-right ${
                            t.amount >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {t.amount >= 0 ? '+' : ''}${t.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {transactions.length > 10 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Showing first 10 of {transactions.length} transactions
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Import Status */}
          {isImporting && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Importing transactions...
              </p>
            </div>
          )}

          {/* Success Message */}
          {importResult && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-800 dark:text-green-200">
                  Successfully imported {importResult.imported} transactions!
                </p>
              </div>
              {importResult.errors && importResult.errors.length > 0 && (
                <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                  {importResult.errors.length} rows had errors
                </p>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              How to Export from Your Bank
            </h3>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
              <li>Log into your bank's website</li>
              <li>Go to "Transactions" or "Account History"</li>
              <li>Look for "Export" or "Download" button</li>
              <li>Select CSV format and date range</li>
              <li>Download and upload here</li>
            </ul>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
              CSV should include: Date, Description, and Amount columns
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

