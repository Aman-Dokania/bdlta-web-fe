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

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    })

  const formatDay = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      timeZone: 'Asia/Kolkata',
    })

  const formatMonth = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      month: 'short',
      timeZone: 'Asia/Kolkata',
    })

  const openRegistrations = tournaments?.filter(
    (tournament) => tournament.status === 'registration_open',
  ).length ?? 0

  const categoryCount = tournaments?.reduce(
    (count, tournament) => count + (tournament.tournament_categories?.length ?? 0),
    0,
  ) ?? 0

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-10 lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-[var(--color-forest)] px-6 py-10 text-white shadow-xl sm:px-10 sm:py-14">
          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[28px] border-emerald-300/10" />
          <div className="absolute -bottom-36 right-24 h-72 w-72 rounded-full border-[18px] border-lime-300/10" />

          <div className="relative max-w-2xl">
            <Link
              href="/"
              className="text-sm font-semibold text-emerald-200 transition hover:text-white"
            >
              ← Back to home
            </Link>
            <p className="mt-10 text-xs font-bold uppercase tracking-[0.24em] text-lime-300">
              The BDLTA calendar
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
              Find your next match.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-emerald-50/80 sm:text-lg">
              Explore upcoming tournaments, compare categories, and step onto the court with Bhagalpur&apos;s tennis community.
            </p>
          </div>

          <div className="relative mt-10 grid max-w-2xl grid-cols-3 gap-3 border-t border-white/15 pt-6 sm:gap-8">
            <div>
              <p className="text-2xl font-black sm:text-3xl">{tournaments?.length ?? 0}</p>
              <p className="mt-1 text-xs text-emerald-100/70 sm:text-sm">Upcoming events</p>
            </div>
            <div>
              <p className="text-2xl font-black sm:text-3xl">{openRegistrations}</p>
              <p className="mt-1 text-xs text-emerald-100/70 sm:text-sm">Open for entry</p>
            </div>
            <div>
              <p className="text-2xl font-black sm:text-3xl">{categoryCount}</p>
              <p className="mt-1 text-xs text-emerald-100/70 sm:text-sm">Categories</p>
            </div>
          </div>
        </section>

        <div className="mb-6 mt-12 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Upcoming fixtures</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Choose your challenge</h2>
          </div>
          <p className="hidden text-sm text-slate-500 sm:block">Updated with the latest BDLTA events</p>
        </div>

        {!tournaments || tournaments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/80 p-12 text-center shadow">
            <p className="text-3xl">○</p>
            <h2 className="mt-4 text-xl font-semibold">
              No tournaments available
            </h2>

            <p className="mt-2 text-gray-500">
              There are currently no upcoming tournaments.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {tournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-emerald-100/80 bg-white shadow transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-start gap-5 border-b border-emerald-100 bg-[linear-gradient(135deg,#f5fbf6_0%,#ffffff_70%)] p-6 sm:p-7">
                  <div className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--color-forest)] text-white shadow-sm">
                    <span className="text-2xl font-black leading-none">{formatDay(tournament.start_date)}</span>
                    <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-lime-300">{formatMonth(tournament.start_date)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-xl font-black leading-tight text-slate-900 transition group-hover:text-emerald-800 sm:text-2xl">
                      {tournament.name}
                      </h2>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                          tournament.status === 'registration_open'
                            ? 'bg-lime-100 text-emerald-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {tournament.status === 'registration_open' ? 'Open' : 'Announced'}
                      </span>
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                      <span className="text-emerald-700">●</span>
                      {tournament.venue || 'Venue to be announced'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <div className="grid grid-cols-2 gap-4 rounded-xl bg-emerald-50/70 p-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Dates</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{formatDate(tournament.start_date)}</p>
                    <p className="text-xs text-slate-500">to {formatDate(tournament.end_date)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Entries</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{tournament.tournament_categories?.length ?? 0} categories</p>
                    <p className="text-xs text-slate-500">Choose your event</p>
                  </div>
                </div>

                  {tournament.description && (
                    <p className="mt-6 line-clamp-2 text-sm leading-6 text-slate-600">
                    {tournament.description}
                    </p>
                  )}

                  <div className="mt-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Categories</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {tournament.tournament_categories?.slice(0, 4).map((category: any) => (
                        <span key={category.id} className="rounded-md border border-emerald-100 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700">
                          {category.name}
                        </span>
                      ))}
                      {(tournament.tournament_categories?.length ?? 0) > 4 && (
                        <span className="px-1 py-1.5 text-xs font-semibold text-emerald-700">
                          +{tournament.tournament_categories!.length - 4} more
                        </span>
                      )}
                      {(tournament.tournament_categories?.length ?? 0) === 0 && (
                        <span className="text-sm text-slate-500">Categories coming soon</span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/tournaments/${tournament.id}`}
                    className="mt-7 inline-flex items-center justify-between rounded-xl bg-[var(--color-forest)] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-800"
                  >
                    View tournament details
                    <span aria-hidden="true" className="text-lg transition-transform group-hover:translate-x-1">→</span>
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