import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function TournamentDetailsPage({
  params,
}: PageProps) {
  const { id } = await params

  const supabase = await createClient()

  const { data: tournament, error } = await supabase
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
      tournament_categories (
        id,
        name,
        event_type,
        gender,
        age_group,
        entry_fee,
        max_players,
        registration_open
      )
    `)
    .eq('id', id)
    .in('status', ['published', 'registration_open'])
    .maybeSingle()

  if (error) {
    console.error('Tournament details error:', error)
  }

  if (!tournament) {
    notFound()
  }

  const categories =
    tournament.tournament_categories || []

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    })

  const formatDeadline = (date: string | null) => {
    if (!date) return 'Not specified'

    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    })
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-5xl">

        {/* Back */}
        <Link
          href="/tournaments"
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back to Tournaments
        </Link>

        {/* Tournament Header */}
        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

            <div>
              <h1 className="text-3xl font-bold">
                {tournament.name}
              </h1>

              {tournament.venue && (
                <p className="mt-2 text-gray-600">
                  📍 {tournament.venue}
                </p>
              )}
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1 text-sm font-medium ${
                tournament.status ===
                'registration_open'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {tournament.status ===
              'registration_open'
                ? 'Registration Open'
                : 'Published'}
            </span>
          </div>

          {/* Dates */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Start Date
              </p>

              <p className="mt-1 font-medium">
                {formatDate(tournament.start_date)}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                End Date
              </p>

              <p className="mt-1 font-medium">
                {formatDate(tournament.end_date)}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Registration Deadline
              </p>

              <p className="mt-1 font-medium">
                {formatDeadline(
                  tournament.registration_deadline
                )}
              </p>
            </div>

          </div>

          {/* Description */}
          {tournament.description && (
            <div className="mt-6">
              <h2 className="font-semibold">
                About the Tournament
              </h2>

              <p className="mt-2 whitespace-pre-line text-gray-600">
                {tournament.description}
              </p>
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="mt-6 rounded-lg bg-white p-6 shadow">

          <h2 className="text-2xl font-bold">
            Categories
          </h2>

          {categories.length === 0 ? (
            <p className="mt-5 text-gray-500">
              Categories have not been announced yet.
            </p>
          ) : (
            <div className="mt-5 grid gap-5 md:grid-cols-2">

              {categories.map((category: any) => (

                <div
                  key={category.id}
                  className="rounded-lg border p-5"
                >

                  {/* Category heading */}
                  <div className="flex items-start justify-between gap-3">

                    <h3 className="text-lg font-semibold">
                      {category.name}
                    </h3>

                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        category.registration_open
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {category.registration_open
                        ? 'Open'
                        : 'Closed'}
                    </span>

                  </div>

                  {/* Category details */}
                  <div className="mt-4 space-y-2 text-sm text-gray-600">

                    <p>
                      <strong>Event:</strong>{' '}
                      {category.event_type.replace(
                        '_',
                        ' '
                      )}
                    </p>

                    <p>
                      <strong>Gender:</strong>{' '}
                      {category.gender || 'Any'}
                    </p>

                    <p>
                      <strong>Age Group:</strong>{' '}
                      {category.age_group || 'Open'}
                    </p>

                    <p>
                      <strong>Entry Fee:</strong>{' '}
                      ₹{category.entry_fee}
                    </p>

                    <p>
                      <strong>Maximum Players:</strong>{' '}
                      {category.max_players ||
                        'Unlimited'}
                    </p>

                  </div>

                  {/* Register button */}
                  {tournament.status ===
                    'registration_open' &&
                    category.registration_open && (
                      <Link
                        href={`/tournaments/${tournament.id}/register?category=${category.id}`}
                        className="mt-5 block w-full rounded-lg bg-black px-4 py-3 text-center text-sm font-medium text-white hover:bg-gray-800"
                      >
                        {Number(category.entry_fee) === 0
                          ? 'Register — Free'
                          : `Register — ₹${category.entry_fee}`}
                      </Link>
                    )}

                </div>

              ))}

            </div>
          )}

        </div>

      </div>
    </main>
  )
}