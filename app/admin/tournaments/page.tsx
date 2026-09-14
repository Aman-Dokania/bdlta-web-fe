'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/src/lib/supabase/client'
import LogoutButton from '@/src/components/LogoutButton'

type Tournament = {
  id: string
  name: string
  description: string | null
  venue: string
  start_date: string
  end_date: string
  registration_deadline: string | null
  status: string
  created_at: string
}

export default function AdminTournamentsPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [tournaments, setTournaments] = useState<Tournament[]>([])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [venue, setVenue] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [registrationDeadline, setRegistrationDeadline] =
    useState('')

  const draftCount = tournaments.filter(
    (tournament) => tournament.status === 'draft'
  ).length
  const activeCount = tournaments.filter(
    (tournament) => ['open', 'ongoing'].includes(tournament.status)
  ).length
  const nextTournament = tournaments.find(
    (tournament) => new Date(tournament.start_date) >= new Date()
  )

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
    } catch (error: unknown) {
      console.error('Tournament creation error:', error)

      alert(
        error instanceof Error
          ? error.message
          : 'Unable to create tournament.'
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
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              onClick={() =>
                router.push('/admin/dashboard')
              }
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-green-800"
            >
              <span aria-hidden="true">←</span> Back to Dashboard
            </button>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">
              Event operations
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-green-950">
              Tournaments
            </h1>

            <p className="mt-2 max-w-xl text-gray-600">
              Plan the season, publish upcoming fixtures, and keep every event moving.
            </p>
          </div>

          <LogoutButton />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-green-200 bg-green-950 p-5 text-white shadow">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-200">
              Total events
            </p>
            <p className="mt-3 text-3xl font-bold">{tournaments.length}</p>
            <p className="mt-1 text-sm text-green-100">Across your tournament calendar</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-white p-5 shadow">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">
              Active now
            </p>
            <p className="mt-3 text-3xl font-bold text-green-950">{activeCount}</p>
            <p className="mt-1 text-sm text-gray-500">Open or currently ongoing</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-white p-5 shadow">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">
              Drafts
            </p>
            <p className="mt-3 text-3xl font-bold text-green-950">{draftCount}</p>
            <p className="mt-1 truncate text-sm text-gray-500">
              {nextTournament ? `Next: ${nextTournament.name}` : 'No upcoming events scheduled'}
            </p>
          </div>
        </div>

        {/* Create Tournament */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow sm:p-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">
              New event
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-green-950">
              Create a tournament
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Start with the essentials. You can configure draws and players from the tournament detail page.
            </p>
          </div>

          <form
            onSubmit={createTournament}
            className="mt-8 grid gap-5 sm:grid-cols-2"
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
                className="w-full rounded-lg border px-4 py-3 outline-none transition placeholder:text-gray-400"
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
                className="w-full rounded-lg border px-4 py-3 outline-none transition placeholder:text-gray-400"
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
                className="w-full rounded-lg border px-4 py-3 outline-none transition placeholder:text-gray-400"
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
                className="w-full rounded-lg border px-4 py-3 outline-none transition"
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
                className="w-full rounded-lg border px-4 py-3 outline-none transition"
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
                className="w-full rounded-lg border px-4 py-3 outline-none transition"
              />

              <p className="mt-1 text-xs text-gray-500">
                Optional. Players won&apos;t be able to register
                after this deadline.
              </p>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-green-950 px-6 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving
                  ? 'Creating...'
                  : 'Create Tournament'}
              </button>
            </div>
          </form>
        </div>

        {/* Tournament List */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow sm:p-8">
          <div className="flex flex-col gap-3 border-b border-green-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">
                Calendar
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-green-950">
                All tournaments
              </h2>
            </div>
            <span className="w-fit rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-800">
              {tournaments.length} {tournaments.length === 1 ? 'event' : 'events'}
            </span>
          </div>

          {tournaments.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-green-200 bg-green-50/60 px-6 py-10 text-center">
              <p className="font-semibold text-green-950">Your tournament calendar is empty</p>
              <p className="mt-1 text-sm text-gray-500">Create your first event above to start planning the season.</p>
            </div>
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
                    <th className="px-3 py-3 text-right font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {tournaments.map((tournament) => (
                    <tr
                      key={tournament.id}
                      className="border-b transition hover:bg-green-50/60 last:border-b-0"
                    >
                      <td className="px-3 py-4">
                        <a
                          href={`/admin/tournaments/${tournament.id}`}
                          className="font-semibold text-green-900 hover:text-green-600 hover:underline"
                        >
                          {tournament.name}
                        </a>
                      </td>

                      <td className="px-3 py-4">
                        <span className="whitespace-nowrap">{tournament.venue}</span>
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
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          ['open', 'ongoing'].includes(tournament.status)
                            ? 'bg-green-100 text-green-700'
                            : tournament.status === 'completed'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {tournament.status}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <Link
                          href={`/admin/tournaments/${tournament.id}`}
                          className="font-semibold text-green-700 hover:text-green-950"
                        >
                          Manage <span aria-hidden="true">→</span>
                        </Link>
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