 'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../../src/lib/supabase/client'
import LogoutButton from '@/src/components/LogoutButton'

type Profile = {
  full_name: string | null
  role: string | null
}

type CourtFee = {
  player_id: string
  full_name: string | null
  player_number: string | null
  email: string | null
  amount: number
  payment_status: string | null
  paid_at: string | null
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [courtFees, setCourtFees] = useState<CourtFee[]>([])
  const [courtFeeLoading, setCourtFeeLoading] = useState(true)
  const [pendingExistingMemberRequests, setPendingExistingMemberRequests] = useState(0)

  const loadCourtFees = async () => {
    setCourtFeeLoading(true)

    const { data, error } = await supabase.rpc(
      'get_current_month_court_fee_status'
    )

    if (error) {
      console.error('Court fee loading error:', error)
      setCourtFees([])
    } else {
      setCourtFees(data || [])
    }

    setCourtFeeLoading(false)
  }

  const loadExistingMemberRequests = async () => {
    const { count, error } = await supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('is_existing_member', true)
      .eq('existing_member_request_status', 'pending')

    if (error) {
      console.error('Existing member request loading error:', error)
      setPendingExistingMemberRequests(0)
      return
    }

    setPendingExistingMemberRequests(count || 0)
  }

  useEffect(() => {
    const loadDashboard = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push('/login')
        return
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', currentUser.id)
        .maybeSingle()

      const currentRole = profileData?.role?.toLowerCase().replace(/[-\s]/g, '_')

      if (error || !profileData) {
        router.push('/player/dashboard')
        return
      }

      if (currentRole !== 'admin' && currentRole !== 'super_admin') {
        router.push('/player/dashboard')
        return
      }

      setUser(currentUser)
      setProfile(profileData)
      await loadCourtFees()
      await loadExistingMemberRequests()
      setLoading(false)
    }

    loadDashboard()
  }, [router])

  const role = profile?.role?.toLowerCase().replace(/[-\s]/g, '_')

  const paidCourtFees = courtFees.filter(
    (fee) => fee.payment_status === 'paid'
  )

  const unpaidCourtFees = courtFees.filter(
    (fee) => fee.payment_status !== 'paid'
  )

  if (loading || !profile || !user) {
    return <main className="min-h-screen bg-gray-100 p-8" />
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            BDLTA Admin Dashboard
          </h1>
          <LogoutButton />
        </div>

        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">
            Welcome, {profile.full_name}
          </h2>

          <p className="mt-2 text-gray-600">
            Role: {role}
          </p>

          <p className="mt-4 text-gray-600">
            Email: {user.email}
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

          <button
            onClick={() => router.push('/admin/players')}
            className="rounded-lg bg-white p-6 text-left shadow transition hover:shadow-md"
          >
            <h3 className="font-semibold">Players</h3>
            <p className="mt-2 text-gray-500">
              Manage players
            </p>
          </button>

          <button
            onClick={() => router.push('/admin/memberships')}
            className="rounded-lg bg-white p-6 text-left shadow transition hover:shadow-md"
          >
            <h3 className="font-semibold">Memberships</h3>
            <p className="mt-2 text-gray-500">
              Manage memberships
            </p>
          </button>

          <button
            onClick={() => router.push('/admin/tournaments')}
            className="rounded-lg bg-white p-6 text-left shadow transition hover:shadow-md"
          >
            <h3 className="font-semibold">Tournaments</h3>
            <p className="mt-2 text-gray-500">
              Manage tournaments
            </p>
          </button>

          <button
            onClick={() => router.push('/admin/payments')}
            className="rounded-lg bg-white p-6 text-left shadow transition hover:shadow-md"
          >
            <h3 className="font-semibold">Payments</h3>
            <p className="mt-2 text-gray-500">
              View payments
            </p>
          </button>

          <a
            href="/admin/reports"
            className="rounded-lg bg-white p-6 shadow hover:shadow-md"
          >
            <h2 className="text-lg font-semibold">
              Financial Reports
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              View membership, tournament and court fee revenue.
            </p>
          </a>

          <button
            onClick={() => router.push('/admin/announcements')}
            className="rounded-lg bg-white p-6 text-left shadow transition hover:shadow-md"
          >
            <h3 className="font-semibold">Announcements</h3>
            <p className="mt-2 text-gray-500">
              Create and manage announcements
            </p>
          </button>

          <button
            onClick={() => router.push('/admin/members/requests')}
            className="rounded-lg bg-white p-6 text-left shadow transition hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">
                  Existing Member Requests
                </h3>

                <p className="mt-2 text-gray-500">
                  Review existing member applications
                </p>
              </div>

              {pendingExistingMemberRequests > 0 && (
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-800">
                  {pendingExistingMemberRequests}
                </span>
              )}
            </div>
          </button>

        </div>

        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Monthly Court Fees
              </h2>

              <p className="text-sm text-gray-500">
                Current month — active members only
              </p>
            </div>

            <div className="flex gap-3">
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                Paid: {paidCourtFees.length}
              </span>

              <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                Unpaid: {unpaidCourtFees.length}
              </span>
            </div>
          </div>

          {courtFeeLoading ? (
            <p className="mt-6 text-gray-500">
              Loading court fee information...
            </p>
          ) : (
            <>
              <div className="mt-8">
                <h3 className="mb-4 text-lg font-semibold text-green-700">
                  Paid Members ({paidCourtFees.length})
                </h3>

                {paidCourtFees.length === 0 ? (
                  <div className="rounded-lg bg-gray-50 p-4 text-gray-500">
                    No active members have paid this month yet.
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
                            Email
                          </th>
                          <th className="px-3 py-3 font-semibold">
                            Amount
                          </th>
                          <th className="px-3 py-3 font-semibold">
                            Paid On
                          </th>
                          <th className="px-3 py-3 font-semibold">
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {paidCourtFees.map((fee) => (
                          <tr
                            key={fee.player_id}
                            className="border-b last:border-b-0"
                          >
                            <td className="px-3 py-4 font-medium">
                              {fee.full_name}
                            </td>
                            <td className="px-3 py-4">
                              {fee.player_number || '-'}
                            </td>
                            <td className="px-3 py-4">
                              {fee.email || '-'}
                            </td>
                            <td className="px-3 py-4">
                              ₹{fee.amount}
                            </td>
                            <td className="px-3 py-4">
                              {fee.paid_at
                                ? new Date(
                                    fee.paid_at
                                  ).toLocaleDateString('en-IN')
                                : '-'}
                            </td>
                            <td className="px-3 py-4">
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                                Paid
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="mt-10">
                <h3 className="mb-4 text-lg font-semibold text-red-700">
                  Unpaid Members ({unpaidCourtFees.length})
                </h3>

                {unpaidCourtFees.length === 0 ? (
                  <div className="rounded-lg bg-green-50 p-4 text-green-700">
                    ✓ All active members have paid this month&apos;s court fee.
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
                            Email
                          </th>
                          <th className="px-3 py-3 font-semibold">
                            Amount
                          </th>
                          <th className="px-3 py-3 font-semibold">
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {unpaidCourtFees.map((fee) => (
                          <tr
                            key={fee.player_id}
                            className="border-b last:border-b-0"
                          >
                            <td className="px-3 py-4 font-medium">
                              {fee.full_name}
                            </td>
                            <td className="px-3 py-4">
                              {fee.player_number || '-'}
                            </td>
                            <td className="px-3 py-4">
                              {fee.email || '-'}
                            </td>
                            <td className="px-3 py-4">
                              ₹{fee.amount}
                            </td>
                            <td className="px-3 py-4">
                              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                                Unpaid
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </main>
  )
}