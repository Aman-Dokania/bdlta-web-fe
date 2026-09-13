import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'

export default async function TournamentsPage() {
  const supabase = await createClient()

  const { data: tournaments, error } = await supabase
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
    .in('status', ['published', 'registration_open'])
    .order('start_date', { ascending: true })

  if (error) {
    console.error('Tournament loading error:', error)
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:underline"
          >
            ← Back to Home
          </Link>

          <h1 className="mt-4 text-3xl font-bold">
            Upcoming Tournaments
          </h1>

          <p className="mt-1 text-gray-600">
            View upcoming BDLTA tournaments and registration
            information.
          </p>
        </div>

        {!tournaments || tournaments.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <h2 className="text-xl font-semibold">
              No tournaments available
            </h2>

            <p className="mt-2 text-gray-500">
              There are currently no upcoming tournaments.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {tournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="rounded-lg bg-white p-6 shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">
                      {tournament.name}
                    </h2>

                    <p className="mt-1 text-gray-500">
                      {tournament.venue}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
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

                <div className="mt-5 grid grid-cols-2 gap-4">
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
                </div>

                {tournament.description && (
                  <p className="mt-5 line-clamp-3 text-sm text-gray-600">
                    {tournament.description}
                  </p>
                )}

                <div className="mt-5">
                  <p className="text-sm font-medium text-gray-700">
                    Categories
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {tournament.tournament_categories
                      ?.slice(0, 5)
                      .map((category: any) => (
                        <span
                          key={category.id}
                          className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                        >
                          {category.name}
                        </span>
                      ))}
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    href={`/tournaments/${tournament.id}`}
                    className="inline-block rounded-lg bg-black px-5 py-3 text-sm font-medium text-white"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}