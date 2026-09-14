import Link from 'next/link'
import Navbar from '../components/Navbar'

const milestones = [
  {
    title: 'Mission',
    description:
      'To develop tennis at the district level through structured coaching, accessible training, and a strong competitive culture.',
  },
  {
    title: 'Vision',
    description:
      'To create a pathway where aspiring players grow into confident, disciplined competitors through consistent development.',
  },
  {
    title: 'Community',
    description:
      'To connect players, families, and local supporters in a welcoming environment built around sportsmanship and growth.',
  },
]

const facilities = [
  'Premium hard courts',
  'Structured practice sessions',
  'Junior tennis development',
  'Player support and guidance',
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[var(--color-mist)] text-slate-900">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
            About BDLTA
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Building a thriving tennis culture in Bhagalpur.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            The Bhagalpur District Lawn Tennis Association is committed to promoting tennis across the district through quality coaching, competitive tournaments, and youth development.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-6 lg:grid-cols-3">
          {milestones.map((item) => (
            <article
              key={item.title}
              className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm"
            >
              <div className="mb-4 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                {item.title}
              </div>
              <p className="text-base leading-7 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Our identity
            </p>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl">
              Encouraging discipline, skill, and confidence through sport.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-300">
              We believe tennis should be accessible, inspiring, and challenging in the best way. Through structured development and regular competitive opportunities, we help players improve every season.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-700 bg-slate-800/80 p-6 shadow-2xl">
            <ul className="space-y-4">
              {facilities.map((item) => (
                <li key={item} className="flex items-center gap-3 rounded-2xl bg-slate-700/60 p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-slate-950">
                    ✓
                  </span>
                  <span className="text-slate-100">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-[2rem] bg-gradient-to-r from-emerald-600 to-emerald-700 p-[1px] shadow-lg">
          <div className="rounded-[calc(2rem-1px)] bg-white p-8 sm:p-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  Join us
                </p>
                <h3 className="mt-2 text-3xl font-black text-slate-900">
                  Be part of the next generation of tennis.
                </h3>
              </div>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Become a member
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
