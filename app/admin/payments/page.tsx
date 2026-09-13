'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../../src/lib/supabase/client'
import LogoutButton from '@/src/components/LogoutButton'

type Payment = {
  id: string
  player_id: string
  membership_id: string | null
  tournament_registration_id: string | null
  amount: number
  currency: string
  gateway: string
  gateway_order_id: string | null
  gateway_payment_id: string | null
  status: string
  paid_at: string | null
  created_at: string
  player: {
    full_name: string
    player_number: string | null
    email: string | null
  } | null
}

export default function AdminPaymentsPage() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  const loadPayments = async () => {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        id,
        player_id,
        membership_id,
        tournament_registration_id,
        amount,
        currency,
        gateway,
        gateway_order_id,
        gateway_payment_id,
        status,
        paid_at,
        created_at,
        players (
          full_name,
          player_number,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Payment loading error:', error)
      setPayments([])
      return
    }

    const formatted = (data || []).map((payment: any) => ({
      ...payment,
      player: payment.players,
    }))

    setPayments(formatted)
  }

  useEffect(() => {
    const loadPage = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push('/login')
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .maybeSingle()

      const role = profile?.role
        ?.toLowerCase()
        .replace(/[-\s]/g, '_')

      if (
        error ||
        !profile ||
        (role !== 'admin' && role !== 'super_admin')
      ) {
        router.push('/player/dashboard')
        return
      }

      setUser(currentUser)

      await loadPayments()

      setLoading(false)
    }

    loadPage()
  }, [router])

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <p className="text-gray-500">Loading payments...</p>
      </main>
    )
  }

  const paidPayments = payments.filter(
    (payment) => payment.status === 'paid'
  )

  const otherPayments = payments.filter(
    (payment) => payment.status !== 'paid'
  )

  const membershipPayments = payments.filter(
    (payment) => payment.membership_id !== null
  )

  const tournamentPayments = payments.filter(
    (payment) => payment.tournament_registration_id !== null
  )

  const totalPaid = paidPayments.reduce(
    (total, payment) => total + Number(payment.amount),
    0
  )

  const getPaymentType = (payment: Payment) => {
    if (payment.membership_id) {
      return 'Lifetime Membership'
    }

    if (payment.tournament_registration_id) {
      return 'Tournament Entry'
    }

    return 'Other'
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}

        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="mb-2 text-sm text-blue-600 hover:underline"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold">
              Payments
            </h1>

            <p className="mt-1 text-gray-500">
              View Razorpay payment records
            </p>
          </div>

          <LogoutButton />
        </div>

        {/* Summary */}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              Total Payments
            </p>

            <p className="mt-2 text-3xl font-bold">
              {payments.length}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              Successful
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {paidPayments.length}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              Other Status
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {otherPayments.length}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              Membership Payments
            </p>

            <p className="mt-2 text-3xl font-bold">
              {membershipPayments.length}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              Tournament Payments
            </p>

            <p className="mt-2 text-3xl font-bold">
              {tournamentPayments.length}
            </p>
          </div>

        </div>

        {/* Total revenue */}

        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-gray-500">
            Total Successful Payments
          </p>

          <p className="mt-2 text-3xl font-bold text-green-600">
            ₹{totalPaid.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Payments table */}

        <div className="rounded-lg bg-white p-6 shadow">

          <h2 className="mb-6 text-xl font-semibold">
            Payment Records
          </h2>

          {payments.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-6 text-center text-gray-500">
              No payment records found.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-left text-sm">

                <thead>
                  <tr className="border-b">

                    <th className="px-3 py-3 font-semibold">
                      Player
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Player ID
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Type
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Amount
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Gateway
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Payment ID
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Status
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Paid On
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {payments.map((payment) => (

                    <tr
                      key={payment.id}
                      className="border-b last:border-b-0"
                    >

                      <td className="px-3 py-4 font-medium">
                        {payment.player?.full_name || '-'}
                        <div className="text-xs text-gray-500">
                          {payment.player?.email || '-'}
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        {payment.player?.player_number || '-'}
                      </td>

                      <td className="px-3 py-4">
                        {getPaymentType(payment)}
                      </td>

                      <td className="px-3 py-4 font-medium">
                        ₹{Number(payment.amount).toLocaleString('en-IN')}
                      </td>

                      <td className="px-3 py-4 capitalize">
                        {payment.gateway}
                      </td>

                      <td className="px-3 py-4">
                        <span className="font-mono text-xs">
                          {payment.gateway_payment_id || '-'}
                        </span>
                      </td>

                      <td className="px-3 py-4">

                        {payment.status === 'paid' ? (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                            Paid
                          </span>
                        ) : payment.status === 'failed' ? (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                            Failed
                          </span>
                        ) : (
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                            {payment.status}
                          </span>
                        )}

                      </td>

                      <td className="px-3 py-4">
                        {payment.paid_at
                          ? new Date(
                              payment.paid_at
                            ).toLocaleDateString('en-IN')
                          : '-'}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </main>
  )
}