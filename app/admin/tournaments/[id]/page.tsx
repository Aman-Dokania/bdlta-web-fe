'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/src/lib/supabase/client'
import LogoutButton from '@/src/components/LogoutButton'

export default function AdminTournamentDetailsPage() {
  const params = useParams()
  const router = useRouter()

  const tournamentId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const [tournament, setTournament] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [registrations, setRegistrations] = useState<any[]>([])
  const [loadingRegistrations, setLoadingRegistrations] =
    useState(false)

  const [categoryName, setCategoryName] = useState('')
  const [eventType, setEventType] = useState('singles')
  const [gender, setGender] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  const [entryFee, setEntryFee] = useState('0')
  const [maxPlayers, setMaxPlayers] = useState('')

  useEffect(() => {
    const loadTournament = async () => {
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

      // Load tournament
      const { data: tournamentData, error: tournamentError } =
        await supabase
          .from('tournaments')
          .select(`
            id,
            name,
            description,
            venue,
            start_date,
            end_date,
            registration_deadline,
            status
          `)
          .eq('id', tournamentId)
          .maybeSingle()

      if (tournamentError || !tournamentData) {
        console.error(
          'Tournament loading error:',
          tournamentError
        )
        setLoading(false)
        return
      }

      setTournament(tournamentData)

      // Load categories
      const { data: categoryData, error: categoryError } =
        await supabase
          .from('tournament_categories')
          .select(`
            id,
            name,
            event_type,
            gender,
            age_group,
            entry_fee,
            max_players,
            registration_open,
            created_at
          `)
          .eq('tournament_id', tournamentId)
          .order('created_at', { ascending: true })

      if (categoryError) {
        console.error(
          'Category loading error:',
          categoryError
        )
      }

      setCategories(categoryData || [])

      setLoadingRegistrations(true)

      const {
        data: registrationData,
        error: registrationError,
      } = await supabase.rpc(
        'get_tournament_registrations',
        {
          p_tournament_id: tournamentId,
        }
      )

      if (registrationError) {
        console.error(
          'Registration loading error:',
          registrationError
        )
      } else {
        setRegistrations(registrationData || [])
      }

      setLoadingRegistrations(false)
      setLoading(false)
    }

    loadTournament()
  }, [router, tournamentId])

  const addCategory = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (!categoryName) {
      alert('Please enter a category name.')
      return
    }

    const parsedEntryFee = Number(entryFee)

    if (Number.isNaN(parsedEntryFee) || parsedEntryFee < 0) {
      alert('Please enter a valid entry fee.')
      return
    }

    const parsedMaxPlayers = maxPlayers
      ? Number(maxPlayers)
      : null

    if (
      parsedMaxPlayers !== null &&
      (!Number.isInteger(parsedMaxPlayers) ||
        parsedMaxPlayers <= 0)
    ) {
      alert('Maximum players must be a positive whole number.')
      return
    }

    try {
      setSaving(true)

      const { data, error } = await supabase
        .from('tournament_categories')
        .insert({
          tournament_id: tournamentId,
          name: categoryName,
          event_type: eventType,
          gender: gender || null,
          age_group: ageGroup || null,
          entry_fee: parsedEntryFee,
          max_players: parsedMaxPlayers,
          registration_open: true,
        })
        .select(`
          id,
          name,
          event_type,
          gender,
          age_group,
          entry_fee,
          max_players,
          registration_open,
          created_at
        `)
        .single()

      if (error) {
        throw error
      }

      setCategories((current) => [
        ...current,
        data,
      ])

      setCategoryName('')
      setEventType('singles')
      setGender('')
      setAgeGroup('')
      setEntryFee('0')
      setMaxPlayers('')

      alert('Category added successfully.')
    } catch (error: any) {
      console.error('Category creation error:', error)

      alert(
        error.message || 'Unable to add category.'
      )
    } finally {
      setSaving(false)
    }
  }

  const updateTournamentStatus = async (newStatus: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to change the tournament status to "${newStatus}"?`
    )

    if (!confirmed) {
      return
    }

    try {
      setUpdatingStatus(true)

      const { error } = await supabase.rpc(
        'update_tournament_status',
        {
          p_tournament_id: tournamentId,
          p_status: newStatus,
        }
      )

      if (error) {
        throw error
      }

      setTournament((current: any) => ({
        ...current,
        status: newStatus,
      }))

      alert('Tournament status updated successfully.')
    } catch (error: any) {
      console.error('Tournament status update error:', error)

      alert(
        error.message ||
          'Unable to update tournament status.'
      )
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-gray-500">
            Loading tournament...
          </p>
        </div>
      </main>
    )
  }

  if (!tournament) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-lg bg-white p-8 shadow">
            <h1 className="text-xl font-semibold">
              Tournament not found
            </h1>

            <button
              onClick={() =>
                router.push('/admin/tournaments')
              }
              className="mt-4 rounded bg-black px-4 py-2 text-white"
            >
              Back to Tournaments
            </button>
          </div>
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
                router.push('/admin/tournaments')
              }
              className="mb-3 text-sm text-gray-600 hover:underline"
            >
              ← Back to Tournaments
            </button>

            <h1 className="text-3xl font-bold">
              {tournament.name}
            </h1>

            <p className="mt-1 text-gray-600">
              Tournament management
            </p>
          </div>

          <LogoutButton />
        </div>

        {/* Tournament Information */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">
            Tournament Information
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <div>
              <p className="text-sm text-gray-500">
                Venue
              </p>

              <p className="font-medium">
                {tournament.venue}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Start Date
              </p>

              <p className="font-medium">
                {new Date(
                  tournament.start_date
                ).toLocaleDateString('en-IN')}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                End Date
              </p>

              <p className="font-medium">
                {new Date(
                  tournament.end_date
                ).toLocaleDateString('en-IN')}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Status
              </p>

              <span className="inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                {tournament.status}
              </span>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    updateTournamentStatus('published')
                  }
                  disabled={
                    updatingStatus ||
                    tournament.status === 'published'
                  }
                  className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Publish
                </button>

                <button
                  onClick={() =>
                    updateTournamentStatus('registration_open')
                  }
                  disabled={
                    updatingStatus ||
                    tournament.status === 'registration_open'
                  }
                  className="rounded bg-green-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Open Registration
                </button>

                <button
                  onClick={() =>
                    updateTournamentStatus('registration_closed')
                  }
                  disabled={
                    updatingStatus ||
                    tournament.status === 'registration_closed'
                  }
                  className="rounded bg-yellow-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Close Registration
                </button>

                <button
                  onClick={() =>
                    updateTournamentStatus('ongoing')
                  }
                  disabled={
                    updatingStatus ||
                    tournament.status === 'ongoing'
                  }
                  className="rounded bg-purple-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Mark Ongoing
                </button>

                <button
                  onClick={() =>
                    updateTournamentStatus('completed')
                  }
                  disabled={
                    updatingStatus ||
                    tournament.status === 'completed'
                  }
                  className="rounded bg-gray-700 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Mark Completed
                </button>

                <button
                  onClick={() =>
                    updateTournamentStatus('cancelled')
                  }
                  disabled={
                    updatingStatus ||
                    tournament.status === 'cancelled'
                  }
                  className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cancel Tournament
                </button>
              </div>
            </div>
          </div>

          {tournament.description && (
            <div className="mt-5">
              <p className="text-sm text-gray-500">
                Description
              </p>

              <p className="mt-1 text-gray-700">
                {tournament.description}
              </p>
            </div>
          )}

          {tournament.registration_deadline && (
            <div className="mt-5">
              <p className="text-sm text-gray-500">
                Registration Deadline
              </p>

              <p className="mt-1 font-medium">
                {new Date(
                  tournament.registration_deadline
                ).toLocaleString('en-IN')}
              </p>
            </div>
          )}
        </div>

        {/* Add Category */}
        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">
            Add Category
          </h2>

          <form
            onSubmit={addCategory}
            className="mt-6 grid gap-5 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Category Name *
              </label>

              <input
                type="text"
                value={categoryName}
                onChange={(e) =>
                  setCategoryName(e.target.value)
                }
                placeholder="e.g. Men's Singles Open"
                className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Event Type *
              </label>

              <select
                value={eventType}
                onChange={(e) =>
                  setEventType(e.target.value)
                }
                className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-black"
              >
                <option value="singles">
                  Singles
                </option>

                <option value="doubles">
                  Doubles
                </option>

                <option value="mixed_doubles">
                  Mixed Doubles
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Gender
              </label>

              <select
                value={gender}
                onChange={(e) =>
                  setGender(e.target.value)
                }
                className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">
                  Any / Not specified
                </option>

                <option value="male">
                  Male
                </option>

                <option value="female">
                  Female
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Age Group
              </label>

              <input
                type="text"
                value={ageGroup}
                onChange={(e) =>
                  setAgeGroup(e.target.value)
                }
                placeholder="e.g. Open, U-18, 35+"
                className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Entry Fee (₹)
              </label>

              <input
                type="number"
                min="0"
                value={entryFee}
                onChange={(e) =>
                  setEntryFee(e.target.value)
                }
                className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Maximum Players
              </label>

              <input
                type="number"
                min="1"
                value={maxPlayers}
                onChange={(e) =>
                  setMaxPlayers(e.target.value)
                }
                placeholder="Leave empty for unlimited"
                className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-black px-5 py-3 font-medium text-white disabled:opacity-40"
              >
                {saving
                  ? 'Adding...'
                  : 'Add Category'}
              </button>
            </div>
          </form>
        </div>

        {/* Categories */}
        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">
            Categories ({categories.length})
          </h2>

          {categories.length === 0 ? (
            <p className="mt-5 text-gray-500">
              No categories added yet.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-3 font-semibold">
                      Category
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Event
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Gender
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Age Group
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Entry Fee
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Max Players
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Registration
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {categories.map((category) => (
                    <tr
                      key={category.id}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-3 py-4 font-medium">
                        {category.name}
                      </td>

                      <td className="px-3 py-4 capitalize">
                        {category.event_type.replace(
                          '_',
                          ' '
                        )}
                      </td>

                      <td className="px-3 py-4 capitalize">
                        {category.gender || 'Any'}
                      </td>

                      <td className="px-3 py-4">
                        {category.age_group || 'Open'}
                      </td>

                      <td className="px-3 py-4">
                        ₹{category.entry_fee}
                      </td>

                      <td className="px-3 py-4">
                        {category.max_players || 'Unlimited'}
                      </td>

                      <td className="px-3 py-4">
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                          {category.registration_open
                            ? 'Open'
                            : 'Closed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tournament Registrations */}
        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Tournament Registrations
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {registrations.length} registration
                {registrations.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          {loadingRegistrations ? (
            <p className="mt-6 text-gray-500">
              Loading registrations...
            </p>
          ) : registrations.length === 0 ? (
            <div className="mt-6 rounded-lg bg-gray-50 p-6 text-center">
              <p className="text-gray-500">
                No players have registered for this tournament yet.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-3 font-semibold">
                      Player
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Category
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Event
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Partner
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Entry Fee
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
                  {registrations.map((registration) => (
                    <tr
                      key={registration.registration_id}
                      className="border-b last:border-b-0"
                    >
                      {/* Player */}
                      <td className="px-3 py-4">
                        <p className="font-medium">
                          {registration.player_name}
                        </p>

                        <p className="text-xs text-gray-500">
                          {registration.player_number ||
                            'No Player ID'}
                        </p>

                        <p className="text-xs text-gray-500">
                          {registration.player_email}
                        </p>
                      </td>

                      {/* Category */}
                      <td className="px-3 py-4">
                        {registration.category_name}
                      </td>

                      {/* Event */}
                      <td className="px-3 py-4 capitalize">
                        {registration.event_type.replace(
                          '_',
                          ' '
                        )}
                      </td>

                      {/* Partner */}
                      <td className="px-3 py-4">
                        {registration.partner_player_name ? (
                          <>
                            <p className="font-medium">
                              {registration.partner_player_name}
                            </p>

                            <p className="text-xs text-gray-500">
                              {registration.partner_player_number ||
                                'No Player ID'}
                            </p>
                          </>
                        ) : (
                          <span className="text-gray-400">
                            —
                          </span>
                        )}
                      </td>

                      {/* Fee */}
                      <td className="px-3 py-4">
                        ₹{registration.entry_fee}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            registration.registration_status ===
                            'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : registration.registration_status ===
                                'pending_payment'
                                ? 'bg-yellow-100 text-yellow-700'
                                : registration.registration_status ===
                                  'cancelled'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {registration.registration_status ===
                          'pending_payment'
                            ? 'Payment Pending'
                            : registration.registration_status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="whitespace-nowrap px-3 py-4">
                        {registration.registered_at
                          ? new Date(
                              registration.registered_at
                            ).toLocaleDateString('en-IN')
                          : '—'}
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