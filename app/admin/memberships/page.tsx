'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../../src/lib/supabase/client'
import LogoutButton from '@/src/components/LogoutButton'

type Membership = {
  id: string
  player_id: string
  membership_type: string
  start_date: string
  end_date: string | null
  fee: number
  status: string
  player: {
    player_number: string | null
    full_name: string
    email: string | null
  } | null
}

export default function AdminMembershipsPage() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)

  const loadMemberships = async () => {
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        id,
        player_id,
        membership_type,
        start_date,
        end_date,
        fee,
        status,
        players (
          player_number,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Membership loading error:', error)
      setMemberships([])
      return
    }

    const formatted = (data || []).map((membership: any) => ({
      ...membership,
      player: membership.players,
    }))

    setMemberships(formatted)
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

      await loadMemberships()

      setLoading(false)
    }

    loadPage()
  }, [router])

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <p className="text-gray-500">Loading memberships...</p>
      </main>
    )
  }

  const activeMemberships = memberships.filter(
    (membership) => membership.status === 'active'
  )

  const pendingMemberships = memberships.filter(
    (membership) => membership.status === 'pending'
  )

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="mb-2 text-sm text-blue-600 hover:underline"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold">
              Memberships
            </h1>

            <p className="mt-1 text-gray-500">
              Manage lifetime memberships
            </p>
          </div>

          <LogoutButton />
        </div>

        {/* Summary */}

        <div className="mb-8 grid gap-4 sm:grid-cols-3">

          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              Total Memberships
            </p>

            <p className="mt-2 text-3xl font-bold">
              {memberships.length}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              Active
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {activeMemberships.length}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              Pending
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {pendingMemberships.length}
            </p>
          </div>

        </div>

        {/* Membership table */}

        <div className="rounded-lg bg-white p-6 shadow">

          <h2 className="mb-6 text-xl font-semibold">
            All Memberships
          </h2>

          {memberships.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-6 text-center text-gray-500">
              No memberships found.
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
                      Type
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Start Date
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Fee
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Status
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {memberships.map((membership) => (

                    <tr
                      key={membership.id}
                      className="border-b last:border-b-0"
                    >

                      <td className="px-3 py-4 font-medium">
                        {membership.player?.full_name || '-'}
                      </td>

                      <td className="px-3 py-4">
                        {membership.player?.player_number || '-'}
                      </td>

                      <td className="px-3 py-4">
                        {membership.player?.email || '-'}
                      </td>

                      <td className="px-3 py-4 capitalize">
                        {membership.membership_type}
                      </td>

                      <td className="px-3 py-4">
                        {membership.start_date
                          ? new Date(
                              membership.start_date
                            ).toLocaleDateString('en-IN')
                          : '-'}
                      </td>

                      <td className="px-3 py-4">
                        ₹{membership.fee}
                      </td>

                      <td className="px-3 py-4">

                        {membership.status === 'active' ? (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                            Active
                          </span>
                        ) : membership.status === 'pending' ? (
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                            Pending
                          </span>
                        ) : membership.status === 'expired' ? (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                            Expired
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                            {membership.status}
                          </span>
                        )}

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