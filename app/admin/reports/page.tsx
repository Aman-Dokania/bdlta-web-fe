'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/src/lib/supabase/client'
import LogoutButton from '@/src/components/LogoutButton'

type FinancialSummary = {
  membership_revenue: number
  tournament_revenue: number
  court_fee_revenue: number
  total_revenue: number
  membership_transactions: number
  tournament_transactions: number
  court_fee_transactions: number
  total_transactions: number
  successful_transactions: number
  failed_transactions: number
  refunded_transactions: number
}

export default function AdminReportsPage() {
  const router = useRouter()

  const [report, setReport] = useState<FinancialSummary | null>(null)

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadReport()
  }, [])

  const loadReport = async (
    customStartDate = startDate,
    customEndDate = endDate
  ) => {
    try {
      setGenerating(true)
      setError('')

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (
        profileError ||
        !profile ||
        !['admin', 'super_admin'].includes(profile.role)
      ) {
        router.push('/player/dashboard')
        return
      }

      const { data, error: reportError } = await supabase.rpc(
        'get_financial_summary',
        {
          p_start_date: customStartDate || null,
          p_end_date: customEndDate || null,
        }
      )

      if (reportError) {
        console.error(reportError)
        throw new Error(reportError.message)
      }

      setReport(data?.[0] || null)
    } catch (err) {
      console.error(err)

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load financial report.'
      )
    } finally {
      setLoading(false)
      setGenerating(false)
    }
  }

  const applyFilter = async () => {
    if (startDate && endDate && startDate > endDate) {
      setError('Start date cannot be after end date.')
      return
    }

    await loadReport(startDate, endDate)
  }

  const resetFilter = async () => {
    setStartDate('')
    setEndDate('')
    await loadReport('', '')
  }

  const formatCurrency = (amount: number | null | undefined) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN')}`
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-gray-500">
            Loading financial reports...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="mb-3 text-sm text-gray-600 hover:underline"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold">
              Financial Reports
            </h1>

            <p className="mt-1 text-gray-600">
              View BDLTA payment and revenue information.
            </p>
          </div>

          <LogoutButton />
        </div>

        {/* Date Filter */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold">
            Report Period
          </h2>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">

            <div>
              <label className="mb-2 block text-sm font-medium">
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                End Date
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <button
              type="button"
              onClick={applyFilter}
              disabled={generating}
              className="rounded-lg bg-black px-5 py-2 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {generating ? 'Loading...' : 'Apply'}
            </button>

            <button
              type="button"
              onClick={resetFilter}
              disabled={generating}
              className="rounded-lg border px-5 py-2 font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Reset
            </button>

          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {report && (
          <>
            {/* Total Revenue */}
            <div className="mt-8 grid gap-6 sm:grid-cols-2">

              <div className="rounded-lg bg-black p-6 text-white shadow">
                <p className="text-sm text-gray-300">
                  Total Revenue
                </p>

                <p className="mt-2 text-4xl font-bold">
                  {formatCurrency(report.total_revenue)}
                </p>

                <p className="mt-2 text-sm text-gray-300">
                  From all successful payments
                </p>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <p className="text-sm text-gray-500">
                  Total Transactions
                </p>

                <p className="mt-2 text-4xl font-bold">
                  {report.total_transactions}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  All payment attempts in selected period
                </p>
              </div>

            </div>

            {/* Revenue Breakdown */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold">
                Revenue Breakdown
              </h2>

              <div className="mt-4 grid gap-6 md:grid-cols-3">

                {/* Membership */}
                <div className="rounded-lg bg-white p-6 shadow">
                  <p className="text-sm text-gray-500">
                    Lifetime Memberships
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {formatCurrency(report.membership_revenue)}
                  </p>

                  <p className="mt-3 text-sm text-gray-500">
                    {report.membership_transactions} transactions
                  </p>
                </div>

                {/* Tournament */}
                <div className="rounded-lg bg-white p-6 shadow">
                  <p className="text-sm text-gray-500">
                    Tournament Fees
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {formatCurrency(report.tournament_revenue)}
                  </p>

                  <p className="mt-3 text-sm text-gray-500">
                    {report.tournament_transactions} transactions
                  </p>
                </div>

                {/* Court Fee */}
                <div className="rounded-lg bg-white p-6 shadow">
                  <p className="text-sm text-gray-500">
                    Court Fees
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {formatCurrency(report.court_fee_revenue)}
                  </p>

                  <p className="mt-3 text-sm text-gray-500">
                    {report.court_fee_transactions} transactions
                  </p>
                </div>

              </div>
            </div>

            {/* Payment Status */}
            <div className="mt-8 rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-semibold">
                Payment Status
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">

                <div className="rounded-lg bg-green-50 p-5">
                  <p className="text-sm text-green-700">
                    Successful
                  </p>

                  <p className="mt-1 text-3xl font-bold text-green-800">
                    {report.successful_transactions}
                  </p>
                </div>

                <div className="rounded-lg bg-red-50 p-5">
                  <p className="text-sm text-red-700">
                    Failed
                  </p>

                  <p className="mt-1 text-3xl font-bold text-red-800">
                    {report.failed_transactions}
                  </p>
                </div>

                <div className="rounded-lg bg-yellow-50 p-5">
                  <p className="text-sm text-yellow-700">
                    Refunded
                  </p>

                  <p className="mt-1 text-3xl font-bold text-yellow-800">
                    {report.refunded_transactions}
                  </p>
                </div>

              </div>
            </div>

            {/* Summary Table */}
            <div className="mt-8 rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-semibold">
                Revenue Summary
              </h2>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-3 py-3 font-semibold">
                        Revenue Type
                      </th>

                      <th className="px-3 py-3 font-semibold">
                        Transactions
                      </th>

                      <th className="px-3 py-3 font-semibold">
                        Revenue
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr className="border-b">
                      <td className="px-3 py-4">
                        Lifetime Membership
                      </td>

                      <td className="px-3 py-4">
                        {report.membership_transactions}
                      </td>

                      <td className="px-3 py-4 font-medium">
                        {formatCurrency(report.membership_revenue)}
                      </td>
                    </tr>

                    <tr className="border-b">
                      <td className="px-3 py-4">
                        Tournament Registration
                      </td>

                      <td className="px-3 py-4">
                        {report.tournament_transactions}
                      </td>

                      <td className="px-3 py-4 font-medium">
                        {formatCurrency(report.tournament_revenue)}
                      </td>
                    </tr>

                    <tr className="border-b">
                      <td className="px-3 py-4">
                        Monthly Court Fee
                      </td>

                      <td className="px-3 py-4">
                        {report.court_fee_transactions}
                      </td>

                      <td className="px-3 py-4 font-medium">
                        {formatCurrency(report.court_fee_revenue)}
                      </td>
                    </tr>

                    <tr>
                      <td className="px-3 py-4 font-bold">
                        Total
                      </td>

                      <td className="px-3 py-4 font-bold">
                        {report.total_transactions}
                      </td>

                      <td className="px-3 py-4 font-bold">
                        {formatCurrency(report.total_revenue)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </main>
  )
}