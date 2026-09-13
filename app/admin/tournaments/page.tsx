'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/src/lib/supabase/client'
import LogoutButton from '@/src/components/LogoutButton'

export default function AdminTournamentsPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [tournaments, setTournaments] = useState<any[]>([])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [venue, setVenue] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [registrationDeadline, setRegistrationDeadline] =
    useState('')

  useEffect(() => {
    const loadPage = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile, error: profileError } =
        await supabase
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
        .from('tournaments')
        .select(`
          id,
          name,
          description,
          venue,
          start_date,
          end_date,
          registration_deadline,
          status,
          created_at
        `)
        .order('start_date', { ascending: true })

      if (error) {
        console.error('Tournament loading error:', error)
        setTournaments([])
      } else {
        setTournaments(data || [])
      }

      setLoading(false)
    }

    loadPage()
  }, [router])

  const createTournament = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (!name || !venue || !startDate || !endDate) {
      alert('Please fill in all required fields.')
      return
    }

    if (endDate < startDate) {
      alert('End date cannot be before start date.')
      return
    }

    try {
      setSaving(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('You must be logged in.')
      }

      const { data, error } = await supabase
        .from('tournaments')
        .insert({
          name,
          description: description || null,
          venue,
          start_date: startDate,
          end_date: endDate,
          registration_deadline:
            registrationDeadline
              ? new Date(registrationDeadline).toISOString()
              : null,
          status: 'draft',
          created_by: user.id,
        })
        .select(`
          id,
          name,
          description,
          venue,
          start_date,
          end_date,
          registration_deadline,
          status,
          created_at
        `)
        .single()

      if (error) {
        throw error
      }

      setTournaments((current) => [
        ...current,
        data,
      ])

      setName('')
      setDescription('')
      setVenue('')
      setStartDate('')
      setEndDate('')
      setRegistrationDeadline('')

      alert('Tournament created successfully.')
    } catch (error: any) {
      console.error('Tournament creation error:', error)

      alert(
        error.message || 'Unable to create tournament.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-gray-500">
            Loading tournaments...
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
              onClick={() =>
                router.push('/admin/dashboard')
              }
              className="mb-3 text-sm text-gray-600 hover:underline"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold">
              Tournaments
            </h1>

            <p className="mt-1 text-gray-600">
              Create and manage BDLTA tournaments
            </p>
          </div>

          <LogoutButton />
        </div>

        {/* Create Tournament */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">
            Create Tournament
          </h2>

          <form
            onSubmit={createTournament}
            className="mt-6 grid gap-5 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Tournament Name *
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="e.g. BDLTA Open 2026"
                className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                rows={4}
                placeholder="Tournament information..."
                className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Venue *
              </label>

              <input
                type="text"
                value={venue}
                onChange={(e) =>
                  setVenue(e.target.value)
                }
                placeholder="e.g. BDLTA Tennis Courts"
                className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Start Date *
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) =>
                  setStartDate(e.target.value)
                }
                className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                End Date *
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(e) =>
                  setEndDate(e.target.value)
                }
                className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Registration Deadline
              </label>

              <input
                type="datetime-local"
                value={registrationDeadline}
                onChange={(e) =>
                  setRegistrationDeadline(e.target.value)
                }
                className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-black"
              />

              <p className="mt-1 text-xs text-gray-500">
                Optional. Players won't be able to register
                after this deadline.
              </p>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-black px-5 py-3 font-medium text-white disabled:opacity-40"
              >
                {saving
                  ? 'Creating...'
                  : 'Create Tournament'}
              </button>
            </div>
          </form>
        </div>

        {/* Tournament List */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">
            All Tournaments ({tournaments.length})
          </h2>

          {tournaments.length === 0 ? (
            <p className="mt-5 text-gray-500">
              No tournaments created yet.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-3 font-semibold">
                      Tournament
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Venue
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Dates
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {tournaments.map((tournament) => (
                    <tr
                      key={tournament.id}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-3 py-4">
                        <a
                          href={`/admin/tournaments/${tournament.id}`}
                          className="font-medium hover:underline"
                        >
                          {tournament.name}
                        </a>
                      </td>

                      <td className="px-3 py-4">
                        {tournament.venue}
                      </td>

                      <td className="px-3 py-4">
                        {new Date(
                          tournament.start_date
                        ).toLocaleDateString('en-IN')}{' '}
                        –{' '}
                        {new Date(
                          tournament.end_date
                        ).toLocaleDateString('en-IN')}
                      </td>

                      <td className="px-3 py-4">
                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                          {tournament.status}
                        </span>
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