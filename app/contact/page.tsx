import Navbar from '../components/Navbar'

const contactDetails = [
  {
    label: 'Email',
    value: 'bdltaofficial@gmail.com',
  },
  {
    label: 'Phone',
    value: '+91 98765 43210',
  },
  {
    label: 'Location',
    value: 'Bhagalpur, Bihar',
  },
]

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[var(--color-mist)] text-slate-900">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Contact
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Let’s connect and grow tennis in the district.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Whether you want to join, volunteer, or discuss event participation, we’d love to hear from you.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            {contactDetails.map((detail) => (
              <div key={detail.label} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                  {detail.label}
                </p>
                <p className="mt-3 text-xl font-semibold text-slate-900">{detail.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[2rem] bg-slate-900 p-6 text-white shadow-lg sm:p-8">
            <h2 className="text-3xl font-black">Send a message</h2>
            <form className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Full name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Message</label>
                <textarea
                  rows={5}
                  placeholder="Tell us how we can help"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Send message
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
