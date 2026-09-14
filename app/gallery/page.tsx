import Navbar from '../components/Navbar'

const galleryItems = [
  {
    title: 'Court training session',
    image:
      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Junior development camp',
    image:
      'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Tournament action',
    image:
      'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Club practice focus',
    image:
      'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Youth tennis program',
    image:
      'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Match day energy',
    image:
      'https://images.unsplash.com/photo-1530915365347-e35b749a0381?auto=format&fit=crop&w=900&q=80',
  },
]

export default function GalleryPage() {
  return (
    <main className="min-h-screen bg-[var(--color-mist)] text-slate-900">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Gallery
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            A glimpse into our tennis community.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            From practice sessions to tournament moments, these images capture the energy, discipline, and progress that define BDLTA.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {galleryItems.map((item, index) => (
            <figure
              key={item.title}
              className={`overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 ${
                index % 2 === 0 ? 'lg:translate-y-6' : ''
              }`}
            >
              <img src={item.image} alt={item.title} className="h-72 w-full object-cover" />
              <figcaption className="px-5 py-4 text-sm font-medium text-slate-700">
                {item.title}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </main>
  )
}
