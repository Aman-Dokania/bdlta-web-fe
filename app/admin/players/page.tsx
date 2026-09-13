'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/src/lib/supabase/client'
import LogoutButton from '@/src/components/LogoutButton'

type Player = {
  id: string
  player_number: string | null
  full_name: string
  date_of_birth: string | null
  gender: string | null
  phone: string | null
  email: string | null
  address: string | null
  photo_url: string | null
  status: string
  created_at: string
  is_existing_member: boolean
}

export default function AdminPlayersPage() {
  const router = useRouter()

  const [players, setPlayers] = useState<Player[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [memberTypeFilter, setMemberTypeFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPlayers = async () => {
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

      const { data, error } = await supabase
        .from('players')
        .select(`
          id,
          player_number,
          full_name,
          date_of_birth,
          gender,
          phone,
          email,
          address,
          photo_url,
          status,
          created_at,
          is_existing_member
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Players loading error:', error)
        setPlayers([])
      } else {
        setPlayers(data || [])
      }

      setLoading(false)
    }

    loadPlayers()
  }, [router])

  const filteredPlayers = players.filter((player) => {
    const searchText = search.trim().toLowerCase()

    const matchesSearch =
      searchText === '' ||
      player.full_name?.toLowerCase().includes(searchText) ||
      player.player_number?.toLowerCase().includes(searchText) ||
      player.email?.toLowerCase().includes(searchText)

    const matchesStatus =
      statusFilter === 'all' ||
      player.status === statusFilter

    const matchesMemberType =
      memberTypeFilter === 'all' ||
      (memberTypeFilter === 'existing' && player.is_existing_member) ||
      (memberTypeFilter === 'new' && !player.is_existing_member)

    return (
      matchesSearch &&
      matchesStatus &&
      matchesMemberType
    )
  })

  const calculateAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return '-'

    const today = new Date()
    const birthDate = new Date(dateOfBirth)

    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDifference = today.getMonth() - birthDate.getMonth()

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--
    }

    return age
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-gray-500">Loading players...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="mb-3 text-sm text-gray-600 hover:underline"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold">
              Players
            </h1>

            <p className="mt-1 text-gray-600">
              Manage registered BDLTA players
            </p>
          </div>

          <LogoutButton />
        </div>

        <div className="mt-8 rounded-lg bg-white p-6 shadow">

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold">
              Players ({filteredPlayers.length})
            </h2>

            <div className="flex flex-col gap-3 sm:flex-row">
              {/* Search */}
              <input
                type="text"
                placeholder="Search name, Player ID or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              />

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="expired">Expired</option>
              </select>

              {/* Member Type */}
              <select
                value={memberTypeFilter}
                onChange={(e) => setMemberTypeFilter(e.target.value)}
                className="rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              >
                <option value="all">All Members</option>
                <option value="new">New Members</option>
                <option value="existing">Existing Members</option>
              </select>

              {/* Reset */}
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('all')
                  setMemberTypeFilter('all')
                }}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </div>

          {filteredPlayers.length === 0 ? (
            <p className="text-gray-500">
              No players match your search or filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-3 font-semibold">
                      Player ID
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Name
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Age
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Phone
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Email
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Gender
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Status
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Registered
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPlayers.map((player) => (
                    <tr
                      key={player.id}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-3 py-4 font-medium">
                        {player.player_number || '-'}
                      </td>

                      <td className="px-3 py-4">
                        <a
                          href={`/admin/players/${player.id}`}
                          className="font-medium hover:underline"
                        >
                          {player.full_name}
                        </a>
                      </td>

                      <td className="px-3 py-4">
                        {calculateAge(player.date_of_birth)}
                      </td>

                      <td className="px-3 py-4">
                        {player.phone || '-'}
                      </td>

                      <td className="px-3 py-4">
                        {player.email || '-'}
                      </td>

                      <td className="px-3 py-4">
                        {player.gender || '-'}
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            player.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : player.status === 'suspended'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {player.status}
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        {new Date(
                          player.created_at
                        ).toLocaleDateString('en-IN')}
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