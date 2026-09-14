import { createClient } from '../../../src/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function formatDate(value: string | null | undefined) {
  return value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-'
}

export default async function PlayerCardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: player, error } = await supabase
    .from('players')
    .select(
      'id, player_number, full_name, date_of_birth, gender, photo_url, status'
    )
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !player) {
    redirect('/player/dashboard')
  }

  // Only active members can view their official card
  if (player.status !== 'active') {
    redirect('/player/dashboard')
  }

  const { data: membership } = await supabase
    .from('memberships')
    .select(
      'membership_type, start_date, end_date, status'
    )
    .eq('player_id', player.id)
    .eq('status', 'active')
    .maybeSingle()

  let photoUrl: string | null = null

  if (player.photo_url) {
    const { data: signedPhoto } = await supabase.storage
      .from('player-photos')
      .createSignedUrl(player.photo_url, 60 * 60)

    photoUrl = signedPhoto?.signedUrl ?? null
  }

  const membershipLabel = membership?.membership_type === 'lifetime'
    ? 'Lifetime'
    : membership?.membership_type || '-'

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/player/dashboard"
            className="text-sm font-medium text-[var(--color-forest)] transition-colors hover:text-[var(--color-court)]"
          >
            <span aria-hidden="true">←</span> Back to dashboard
          </Link>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Official ID
          </span>
        </div>

        <section className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-[0_24px_70px_rgba(18,60,44,0.14)]">
          <div className="relative overflow-hidden bg-[var(--color-forest)] px-6 py-7 text-white sm:px-10 sm:py-8">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[22px] border-white/10" />
            <div className="absolute -bottom-28 -left-12 h-48 w-48 rounded-full border-[18px] border-[var(--color-court)]/30" />
            <div className="relative flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-bold tracking-[0.3em] text-[#b9f23d]">BDLTA</p>
                <h1 className="mt-3 max-w-xs text-xl font-bold leading-tight sm:text-2xl">
                  Bhagalpur District Lawn Tennis Association
                </h1>
              </div>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl font-bold text-[#b9f23d]">
                B
              </div>
            </div>
            <div className="relative mt-8 flex items-center justify-between border-t border-white/15 pt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
              <span>2026 edition</span>
            </div>
          </div>

          <div className="px-6 pb-7 sm:px-10 sm:pb-10">
            <div className="-mt-12 flex flex-col items-center gap-5 sm:-mt-14 sm:flex-row sm:items-end">
              <div className="relative shrink-0 rounded-[1.4rem] bg-white p-2 shadow-lg ring-1 ring-black/5">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={player.full_name}
                    className="h-28 w-28 rounded-[1rem] object-cover sm:h-32 sm:w-32"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-[1rem] bg-emerald-50 text-4xl font-bold text-[var(--color-forest)] sm:h-32 sm:w-32">
                    {player.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-[#b9f23d] text-sm font-bold text-[var(--color-forest)]" aria-label="Verified active member">
                  ✓
                </span>
              </div>
              <div className="min-w-0 flex-1 text-center sm:pb-1 sm:text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-court)]">Member name</p>
                <h2 className="mt-1 break-words text-2xl font-bold tracking-tight text-[var(--color-forest)] sm:text-3xl">
                  {player.full_name}
                </h2>
                <p className="mt-1 font-mono text-sm font-semibold tracking-wider text-slate-500">ID / {player.player_number}</p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-emerald-50 px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Status</p>
                <p className="mt-1 text-sm font-bold text-[var(--color-forest)]">Active</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Membership</p>
                <p className="mt-1 text-sm font-bold text-[var(--color-forest)]">{membershipLabel}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Member since</p>
                <p className="mt-1 text-sm font-bold text-[var(--color-forest)]">{formatDate(membership?.start_date)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Valid until</p>
                <p className="mt-1 text-sm font-bold text-[var(--color-forest)]">{membership?.end_date ? formatDate(membership.end_date) : 'Lifetime'}</p>
              </div>
            </div>

            <div className="mt-7 grid gap-x-8 gap-y-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
              <div><p className="text-xs font-medium text-slate-400">Date of birth</p><p className="mt-1 font-semibold text-slate-700">{formatDate(player.date_of_birth)}</p></div>
              <div><p className="text-xs font-medium text-slate-400">Gender</p><p className="mt-1 font-semibold capitalize text-slate-700">{player.gender || '-'}</p></div>
              <div><p className="text-xs font-medium text-slate-400">Card status</p><p className="mt-1 font-semibold text-slate-700">Verified member</p></div>
              <div><p className="text-xs font-medium text-slate-400">Issued by</p><p className="mt-1 font-semibold text-slate-700">BDLTA, Bhagalpur</p></div>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 text-center text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:text-left">
            <p>This digital card confirms active BDLTA membership.</p>
            <p className="font-mono font-semibold tracking-wider text-[var(--color-forest)]">BDLTA / {player.player_number}</p>
          </div>
        </section>
      </div>
    </main>
  )
}