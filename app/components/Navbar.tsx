import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'
import LogoutButton from '@/src/components/LogoutButton'

export default async function Navbar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let dashboardHref = '/player/dashboard'
  let displayName: string =
    user?.user_metadata?.full_name || user?.email || 'Player'
  let profileImageUrl: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .maybeSingle()

    displayName = profile?.full_name || displayName
    const role = profile?.role?.toLowerCase().replace(/[-\s]/g, '_')

    if (role === 'admin' || role === 'super_admin') {
      dashboardHref = '/admin/dashboard'
    } else {
      const { data: player } = await supabase
        .from('players')
        .select('full_name, photo_url')
        .eq('user_id', user.id)
        .maybeSingle()

      displayName = player?.full_name || displayName

      if (player?.photo_url) {
        const { data: signedPhoto } = await supabase.storage
          .from('player-photos')
          .createSignedUrl(player.photo_url, 60 * 60)

        profileImageUrl = signedPhoto?.signedUrl || null
      }
    }
  }

  const initials = displayName
    .split(/\s+/)
    .filter((part: string) => part.length > 0)
    .map((part: string) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 shadow-[0_8px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl">
      <nav className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-emerald-800 text-sm font-black text-white shadow-[0_8px_18px_rgba(16,185,129,0.25)] transition-transform group-hover:-rotate-3">
            B
          </div>

          <div>
            <p className="text-[17px] font-black tracking-tight text-slate-900">BDLTA</p>
            <p className="hidden text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:block">
              District Tennis
            </p>
          </div>
        </Link>

        <div className="hidden items-center justify-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="/" className="py-2 transition hover:text-emerald-700">Home</Link>
          <Link href="/about" className="py-2 transition hover:text-emerald-700">About</Link>
          <Link href="/coaches" className="py-2 transition hover:text-emerald-700">Coaches</Link>
          <Link href="/tournaments" className="py-2 transition hover:text-emerald-700">Tournaments</Link>
          <Link href="/gallery" className="py-2 transition hover:text-emerald-700">Gallery</Link>
          <Link href="/contact" className="py-2 transition hover:text-emerald-700">Contact</Link>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 sm:flex" title={displayName}>
                {profileImageUrl ? (
                  <span
                    role="img"
                    aria-label={`${displayName} profile picture`}
                    className="h-9 w-9 rounded-full bg-cover bg-center ring-2 ring-emerald-100"
                    style={{ backgroundImage: `url(${profileImageUrl})` }}
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 ring-2 ring-emerald-50">
                    {initials}
                  </span>
                )}
                <span className="max-w-28 truncate text-sm font-semibold text-slate-800">
                  {displayName}
                </span>
              </div>
              <Link
                href={dashboardHref}
                className="hidden rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 sm:inline-flex"
              >
                Dashboard
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hidden rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700 sm:inline-flex">
                Login
              </Link>
              <Link
                href="/signup"
                className="inline-flex rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                Join BDLTA
              </Link>
            </>
          )}

          <details className="relative md:hidden">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50">
              <span className="sr-only">Open navigation menu</span>
              {user && profileImageUrl ? (
                <span
                  aria-hidden="true"
                  className="h-8 w-8 rounded-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${profileImageUrl})` }}
                />
              ) : user ? (
                <span className="text-xs font-bold text-emerald-800" aria-hidden="true">{initials}</span>
              ) : (
                <span className="text-xl leading-none" aria-hidden="true">&#9776;</span>
              )}
            </summary>
            <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-2 text-sm font-medium text-slate-700 shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
              {user && (
                <div className="mb-1 flex items-center gap-3 border-b border-slate-100 px-3 py-3">
                  {profileImageUrl ? (
                    <span className="h-9 w-9 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${profileImageUrl})` }} />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">{initials}</span>
                  )}
                  <span className="min-w-0 truncate font-semibold text-slate-900">{displayName}</span>
                </div>
              )}
              <Link href="/" className="block rounded-xl px-4 py-3 transition hover:bg-emerald-50 hover:text-emerald-700">Home</Link>
              <Link href="/about" className="block rounded-xl px-4 py-3 transition hover:bg-emerald-50 hover:text-emerald-700">About</Link>
              <Link href="/coaches" className="block rounded-xl px-4 py-3 transition hover:bg-emerald-50 hover:text-emerald-700">Coaches</Link>
              <Link href="/tournaments" className="block rounded-xl px-4 py-3 transition hover:bg-emerald-50 hover:text-emerald-700">Tournaments</Link>
              <Link href="/gallery" className="block rounded-xl px-4 py-3 transition hover:bg-emerald-50 hover:text-emerald-700">Gallery</Link>
              <Link href="/contact" className="block rounded-xl px-4 py-3 transition hover:bg-emerald-50 hover:text-emerald-700">Contact</Link>
              {user ? (
                <>
                  <Link href={dashboardHref} className="block rounded-xl px-4 py-3 font-semibold text-emerald-700 transition hover:bg-emerald-50">Dashboard</Link>
                  <LogoutButton />
                </>
              ) : (
                <Link href="/login" className="block rounded-xl px-4 py-3 hover:bg-emerald-50 hover:text-emerald-700">Login</Link>
              )}
            </div>
          </details>
        </div>
      </nav>
    </header>
  )
}