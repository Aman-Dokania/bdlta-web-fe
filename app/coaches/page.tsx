import Link from 'next/link'
import Navbar from '../components/Navbar'

const coaches = [
  {
    role: 'Head Coach',
    name: 'Mr. Sanjay',
    description:
      'Leads the association with a strong emphasis on discipline, technical mastery, and player progression at every level.',
  },
  {
    role: 'Coach',
    name: 'Mr. Abhishek',
    description:
      'Focuses on skill development, court movement, and confidence-building for young and competitive players.',
  },
  {
    role: 'Coach',
    name: 'Mr. Sunil',
    description:
      'Supports junior and club-level training with patient instruction and a practical, performance-focused approach.',
  },
]

const programs = [
  {
    title: 'Beginner Training',
    description: 'A welcoming foundation for new players to learn grips, footwork, balance, and basic match play.',
  },
  {
    title: 'Performance Coaching',
    description: 'Advanced sessions for skill refinement, tactical awareness, fitness, and competitive preparation.',
  },
  {
    title: 'Junior Development',
    description: 'Structured youth coaching designed to build confidence, discipline, and long-term tennis habits.',
  },
]

export default function CoachesPage() {
  return (
    <main className="min-h-screen bg-[var(--color-mist)] text-slate-900">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Coaching team
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Coaching that develops talent, confidence, and competitive grit.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Our coaches combine technical guidance with structured training routines that help players grow steadily and perform with clarity under pressure.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {coaches.map((coach) => (
            <article
              key={coach.name}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-xl font-black text-white">
                {coach.name
                  .split(' ')
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                {coach.role}
              </p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">{coach.name}</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">{coach.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Programs
          </p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">
            Training pathways for every stage of development.
          </h2>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {programs.map((program) => (
              <div key={program.title} className="rounded-[2rem] border border-slate-700 bg-slate-800/70 p-6">
                <h3 className="text-2xl font-bold text-white">{program.title}</h3>
                <p className="mt-4 text-base leading-7 text-slate-300">{program.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Training calendar
              </p>
              <h3 className="mt-3 text-3xl font-black text-slate-900">
                Sessions built around skill, consistency, and growth.
              </h3>
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Enroll now
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
