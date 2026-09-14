import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'
import Navbar from './components/Navbar'

const leadership = [
  {
    role: 'Head Coach',
    name: 'Mr. Sanjay',
    description: 'Leading the coaching program with a focus on discipline, technique and competitive growth.',
    featured: true,
  },
  {
    role: 'Coach',
    name: 'Mr. Abhishek',
    description: 'Developing players through structured drills, fundamentals and match-day confidence.',
  },
  {
    role: 'Coach',
    name: 'Mr. Sunil',
    description: 'Supporting youth and club training with strong technical guidance and player development.',
  },
]

const coachingPrograms = [
  {
    title: 'Beginner Training',
    description: 'A welcoming, structured pathway for new players to build confidence and fundamentals.',
  },
  {
    title: 'Competitive Training',
    description: 'Performance-driven sessions focused on match play, fitness, and tactical development.',
  },
  {
    title: 'Junior Development',
    description: 'Youth-focused coaching designed to nurture discipline, skill and long-term growth.',
  },
]

const facilities = [
  'Tennis Courts',
  'Training Arena',
  'Player Lounge',
  'Changing Rooms',
  'Club Grounds',
]

const courts = [
  { name: 'Court 1', surface: 'Hard court', accent: 'bg-emerald-500' },
  { name: 'Court 2', surface: 'Hard court', accent: 'bg-sky-500' },
]

const galleryImages = [
  'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1530915365347-e35b749a0381?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=80',
]

const stats = [
  { label: 'Players', value: '500+' },
  { label: 'Courts', value: '2' },
  { label: 'Tournaments', value: '20+' },
  { label: 'Since', value: '2010' },
]

export default async function Home() {
  const supabase = await createClient()

  const { data: announcements, error } = await supabase
    .from('announcements')
    .select(
      'id, title, content, image_url, published, published_at, created_at'
    )
    .eq('published', true)
    .order('published_at', { ascending: false })

  const { data: tournaments, error: tournamentsError } =
    await supabase
      .from('tournaments')
      .select(
        'id, name, description, venue, start_date, end_date, status'
      )
      .in('status', ['published', 'registration_open'])
      .gte(
        'end_date',
        new Date().toISOString().split('T')[0]
      )
      .order('start_date', { ascending: true })
      .limit(6)

  return (
    <main className="min-h-screen bg-[var(--color-mist)] text-slate-900">
      <Navbar />

      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=2400&q=90')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-emerald-900/70" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Bhagalpur District Lawn Tennis Association
            </p>
            <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl lg:text-7xl">
              Building the next generation of tennis.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-200">
              Promoting tennis, developing players, and creating meaningful opportunities for competition, training, and community across the district.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-emerald-500 px-7 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Join BDLTA
              </Link>
              <Link
                href="/tournaments"
                className="rounded-full border border-white/30 bg-white/5 px-7 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
              >
                Explore Tournaments
              </Link>
            </div>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm"
              >
                <div className="text-3xl font-bold text-emerald-300">{stat.value}</div>
                <div className="mt-2 text-sm uppercase tracking-[0.2em] text-slate-300">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
              About the association
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-900 sm:text-4xl">
              Excellence, opportunity and a stronger tennis community.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              The Bhagalpur District Lawn Tennis Association is dedicated to promoting and developing tennis at the district level by creating opportunities for players to train, compete, and grow with confidence.
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="text-lg font-bold text-slate-900">Our Mission</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  To nurture talent and make tennis more accessible across the district.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="text-lg font-bold text-slate-900">Our Vision</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  To build a thriving culture of sport, discipline and competitive excellence.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="text-lg font-bold text-slate-900">Objectives</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Training, tournaments, community engagement and player development.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] bg-white p-3 shadow-[0_30px_80px_rgba(15,23,42,0.12)] ring-1 ring-slate-200">
            <img
              src="https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=1000&q=80"
              alt="Tennis players training on court"
              className="h-[460px] w-full rounded-[1.5rem] object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Leadership
              </p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                Meet the team behind BDLTA
              </h2>
            </div>
            <Link href="/about" className="text-sm font-semibold text-emerald-300 hover:text-emerald-200">
              Learn more →
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {leadership.map((person) => (
              <article
                key={`${person.role}-${person.name}`}
                className={`flex h-full flex-col rounded-[2rem] border p-5 ${
                  person.featured
                    ? 'border-emerald-400 bg-gradient-to-b from-emerald-500/20 to-slate-900 ring-1 ring-emerald-400/40'
                    : 'border-slate-700 bg-slate-800/70'
                }`}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xl font-black text-slate-950">
                  {person.name
                    .split(' ')
                    .map((word) => word[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div className="mt-5 text-sm uppercase tracking-[0.18em] text-emerald-300">
                  {person.role}
                </div>
                <h3 className="mt-3 text-2xl font-bold text-white">{person.name}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-300">{person.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Training
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Train. Compete. Improve.</h2>
          </div>
          <Link href="/coaches" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
            View coaching programs →
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {coachingPrograms.map((program) => (
            <article key={program.title} className="rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-slate-200">
              <div className="text-3xl">🎾</div>
              <h3 className="mt-5 text-2xl font-bold text-slate-900">{program.title}</h3>
              <p className="mt-4 text-sm leading-6 text-slate-600">{program.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Court map
              </p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">Two courts ready for play.</h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
                A quick view of the active tennis facility layout, built to help members plan sessions and match-day practice without the guesswork.
              </p>

              <div className="mt-8 space-y-4">
                {courts.map((court) => (
                  <div key={court.name} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <span className={`inline-flex h-3.5 w-3.5 rounded-full ${court.accent}`} />
                    <div>
                      <div className="text-base font-bold text-slate-900">{court.name}</div>
                      <div className="text-sm text-slate-500">{court.surface}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[#eaf5ef] shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between border-b border-slate-200 bg-white/70 px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  2 courts
                </span>
              </div>

              <div className="relative h-[420px] bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(135deg,#dfeee7_0%,#edf7f0_45%,#d9e7df_100%)] p-6">
                <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] [background-size:32px_32px]" />

                <div className="absolute left-8 top-12 h-48 w-48 rounded-full border-2 border-dashed border-emerald-300/70 bg-white/10" />
                <div className="absolute right-10 top-20 h-28 w-28 rounded-full border-2 border-dashed border-sky-300/70 bg-white/10" />

                <div className="relative flex h-full items-center justify-center gap-6">
                  {courts.map((court, index) => (
                    <div
                      key={court.name}
                      className="relative flex h-44 w-40 items-center justify-center rounded-[2rem] border-4 border-white/80 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.22),_rgba(5,150,105,0.16)),linear-gradient(135deg,#1fad74_0%,#138d5a_100%)] shadow-[0_20px_35px_rgba(18,60,44,0.18)]"
                    >
                      <div className="absolute inset-4 rounded-[1.4rem] border-2 border-white/80" />
                      <div className="absolute inset-x-10 top-1/2 h-px -translate-y-1/2 bg-white/80" />
                      <div className="absolute inset-y-10 left-1/2 w-px -translate-x-1/2 bg-white/80" />
                      <div className={`absolute -right-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ${index === 0 ? 'bg-emerald-500' : 'bg-sky-500'}`}>
                        {index + 1}
                      </div>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/80 bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                        {court.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Tournaments
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Upcoming tournaments</h2>
          </div>
          <Link href="/tournaments" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
            View all tournaments →
          </Link>
        </div>

        {tournamentsError ? (
          <div className="mt-8 rounded-2xl bg-red-50 p-5 text-red-700 ring-1 ring-red-200">
            Unable to load tournaments right now.
          </div>
        ) : tournaments && tournaments.length > 0 ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {tournaments.map((tournament) => (
              <article key={tournament.id} className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-bold text-slate-900">{tournament.name}</h3>
                  {tournament.status === 'registration_open' ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      Open
                    </span>
                  ) : (
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                      Upcoming
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>📅 {new Date(tournament.start_date).toLocaleDateString('en-IN')} — {new Date(tournament.end_date).toLocaleDateString('en-IN')}</p>
                  {tournament.venue && <p>📍 {tournament.venue}</p>}
                </div>

                {tournament.description && (
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">{tournament.description}</p>
                )}

                <Link
                  href={`/tournaments/${tournament.id}`}
                  className="mt-6 inline-flex rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Register now
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[2rem] bg-slate-50 p-7 text-slate-500 ring-1 ring-slate-200">
            No upcoming tournaments at the moment.
          </div>
        )}
      </section>

      <section className="bg-slate-100 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Achievements
              </p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">Our players. Our pride.</h2>
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              ['District champions', '120+'],
              ['State winners', '32'],
              ['National participants', '11'],
              ['Junior programs', '8'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[2rem] bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
                <div className="text-3xl font-black text-emerald-600">{value}</div>
                <div className="mt-2 text-sm uppercase tracking-[0.18em] text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Gallery
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Life at BDLTA</h2>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {galleryImages.map((image, index) => (
            <div
              key={image}
              className={index % 3 === 0 ? 'sm:col-span-2 lg:col-span-1' : ''}
            >
              <img
                src={image}
                alt="BDLTA tennis gallery"
                className="h-72 w-full rounded-[2rem] object-cover shadow-sm ring-1 ring-slate-200"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Announcements
              </p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">Latest news & updates</h2>
            </div>
            <Link href="/announcements" className="text-sm font-semibold text-emerald-300 hover:text-emerald-200">
              View all news →
            </Link>
          </div>

          {error ? (
            <div className="mt-8 rounded-2xl bg-red-900/40 p-5 text-red-200 ring-1 ring-red-500/30">
              Unable to load announcements right now.
            </div>
          ) : announcements && announcements.length > 0 ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {announcements.map((announcement) => (
                <article key={announcement.id} className="overflow-hidden rounded-[2rem] bg-slate-800 ring-1 ring-slate-700">
                  {announcement.image_url && (
                    <img
                      src={announcement.image_url}
                      alt={announcement.title}
                      className="h-52 w-full object-cover"
                    />
                  )}
                  <div className="p-6">
                    <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">
                      {announcement.published_at
                        ? new Date(announcement.published_at).toLocaleDateString('en-IN')
                        : 'Latest'}
                    </p>
                    <h3 className="mt-3 text-xl font-bold text-white">{announcement.title}</h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                      {announcement.content}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[2rem] bg-slate-800 p-7 text-slate-300 ring-1 ring-slate-700">
              No announcements at the moment.
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-[2.5rem] bg-gradient-to-r from-emerald-600 to-emerald-500 p-8 text-slate-950 shadow-[0_30px_80px_rgba(16,185,129,0.28)] sm:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-900/70">
                Membership
              </p>
              <h2 className="mt-3 text-3xl font-black sm:text-5xl">Become a BDLTA member.</h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-900/80">
                Join the district tennis community and gain access to association facilities, tournaments, member services and year-round tennis opportunities.
              </p>
            </div>

            <div className="rounded-[2rem] bg-white/80 p-6 shadow-xl backdrop-blur-sm">
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
                Lifetime membership
              </div>
              <div className="mt-3 text-4xl font-black text-slate-900">₹1,000</div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Monthly court access is available at ₹2,000, subject to active membership and current payment.
              </p>
              <Link
                href="/signup"
                className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Join now
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Visit BDLTA
              </p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">Find us at the tennis complex.</h2>
              <div className="mt-6 space-y-4 text-slate-600">
                <p>📍 BDLTA Tennis Complex, Bhagalpur, Bihar</p>
                <p>📞 +91 98765 43210</p>
                <p>✉️ contact@bdlta.in</p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium">
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 px-4 py-2 text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700">
                  Instagram
                </a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 px-4 py-2 text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700">
                  Facebook
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 px-4 py-2 text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700">
                  YouTube
                </a>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] bg-slate-100 ring-1 ring-slate-200">
              <iframe
                title="BDLTA location map"
                src="https://www.google.com/maps?q=Bhagalpur%20Bihar&z=12&output=embed"
                className="h-[420px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
          <div>
            <p className="text-xl font-black text-white">BDLTA</p>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Bhagalpur District Lawn Tennis Association
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Quick links</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li><Link href="/about" className="hover:text-white">About</Link></li>
              <li><Link href="/tournaments" className="hover:text-white">Tournaments</Link></li>
              <li><Link href="/gallery" className="hover:text-white">Gallery</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Player</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link href="/login" className="hover:text-white">Login</Link></li>
              <li><Link href="/signup" className="hover:text-white">Register</Link></li>
              <li><Link href="/player/dashboard" className="hover:text-white">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Follow us</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white">Instagram</a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-white">Facebook</a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-white">YouTube</a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} BDLTA. All rights reserved.</p>
            <div className="flex gap-5">
              <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white">Terms & Conditions</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}