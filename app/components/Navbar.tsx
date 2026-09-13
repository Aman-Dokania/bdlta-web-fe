import Link from 'next/link'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-sm font-black text-white shadow-md">
            B
          </div>

          <div>
            <p className="text-lg font-black tracking-tight text-slate-900">BDLTA</p>
            <p className="hidden text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500 sm:block">
              District Tennis
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
          <Link href="/" className="transition hover:text-emerald-700">Home</Link>
          <Link href="/about" className="transition hover:text-emerald-700">About</Link>
          <Link href="/coaches" className="transition hover:text-emerald-700">Coaches</Link>
          <Link href="/tournaments" className="transition hover:text-emerald-700">Tournaments</Link>
          <Link href="/gallery" className="transition hover:text-emerald-700">Gallery</Link>
          <Link href="/contact" className="transition hover:text-emerald-700">Contact</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm font-semibold text-slate-700 transition hover:text-emerald-700 sm:inline-flex">
            Login
          </Link>
          <Link
            href="/signup"
            className="inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Join BDLTA
          </Link>

          <details className="relative md:hidden">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50">
              <span className="sr-only">Open navigation menu</span>
              <span className="text-xl leading-none" aria-hidden="true">&#9776;</span>
            </summary>
            <div className="absolute right-0 top-12 z-50 w-52 rounded-2xl border border-slate-200 bg-white p-2 text-sm font-medium text-slate-700 shadow-xl">
              <Link href="/" className="block rounded-xl px-4 py-3 hover:bg-emerald-50 hover:text-emerald-700">Home</Link>
              <Link href="/about" className="block rounded-xl px-4 py-3 hover:bg-emerald-50 hover:text-emerald-700">About</Link>
              <Link href="/coaches" className="block rounded-xl px-4 py-3 hover:bg-emerald-50 hover:text-emerald-700">Coaches</Link>
              <Link href="/tournaments" className="block rounded-xl px-4 py-3 hover:bg-emerald-50 hover:text-emerald-700">Tournaments</Link>
              <Link href="/gallery" className="block rounded-xl px-4 py-3 hover:bg-emerald-50 hover:text-emerald-700">Gallery</Link>
              <Link href="/contact" className="block rounded-xl px-4 py-3 hover:bg-emerald-50 hover:text-emerald-700">Contact</Link>
              <Link href="/login" className="block rounded-xl px-4 py-3 hover:bg-emerald-50 hover:text-emerald-700">Login</Link>
            </div>
          </details>
        </div>
      </nav>
    </header>
  )
}