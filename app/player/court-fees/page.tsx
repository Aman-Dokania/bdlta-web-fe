import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../src/lib/supabase/server'

type CourtFee = {
  id: string
  fee_month: string
  amount: number | null
  currency: string | null
  status: string | null
  paid_at: string | null
  gateway_payment_id: string | null
}

function formatMonth(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
}

function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-'
}

function formatAmount(amount: number | null, currency: string | null) {
  if (amount === null) return '-'

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function statusStyles(status: string | null) {
  if (status === 'paid') {
    return 'bg-emerald-50 text-emerald-700'
  }

  if (status === 'failed') {
    return 'bg-rose-50 text-rose-700'
  }

  return 'bg-amber-50 text-amber-700'
}

function statusLabel(status: string | null) {
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending'
}

export default async function PlayerCourtFeesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: player } = await supabase
    .from('players')
    .select('id, full_name, player_number')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!player) {
    redirect('/player/dashboard')
  }

  const { data: courtFees, error } = await supabase
    .from('court_fee_payments')
    .select('id, fee_month, amount, currency, status, paid_at, gateway_payment_id')
    .eq('player_id', player.id)
    .order('fee_month', { ascending: false })

  if (error) {
    console.error('Court fee history loading error:', error)
  }

  const fees = (courtFees || []) as CourtFee[]
  const paidFees = fees.filter((fee) => fee.status === 'paid')
  const totalPaid = paidFees.reduce((total, fee) => total + (fee.amount || 0), 0)
  const currentMonth = new Date().toISOString().slice(0, 7)
  const currentFee = fees.find((fee) => fee.fee_month.startsWith(currentMonth))

  return (
    <main className="min-h-screen px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--color-court)]">
              Payments
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-forest)] sm:text-4xl">
              Court fee history
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              A complete record of your monthly BDLTA court-fee payments.
            </p>
          </div>
          <Link
            href="/player/dashboard"
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-forest)] shadow-sm transition hover:border-[var(--color-court)] sm:self-auto"
          >
            <span aria-hidden="true">←</span> Dashboard
          </Link>
        </div>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-[var(--color-forest)] p-5 text-white shadow-[0_16px_40px_rgba(18,60,44,0.14)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">This month</p>
            <p className="mt-4 text-2xl font-bold">{currentFee ? statusLabel(currentFee.status) : 'Not paid'}</p>
            <p className="mt-1 text-sm text-emerald-100">{formatMonth(`${currentMonth}-01`)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Paid months</p>
            <p className="mt-4 text-2xl font-bold text-[var(--color-forest)]">{paidFees.length}</p>
            <p className="mt-1 text-sm text-slate-500">Verified payments</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Total paid</p>
            <p className="mt-4 text-2xl font-bold text-[var(--color-forest)]">{formatAmount(totalPaid, 'INR')}</p>
            <p className="mt-1 text-sm text-slate-500">Across all paid months</p>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-forest)]">Payment records</h2>
              <p className="mt-1 text-sm text-slate-500">{player.full_name} · {player.player_number}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {fees.length} {fees.length === 1 ? 'record' : 'records'}
            </span>
          </div>

          {fees.length === 0 ? (
            <div className="px-5 py-16 text-center sm:px-7">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-[var(--color-forest)]" aria-hidden="true">₹</div>
              <h3 className="mt-4 font-bold text-[var(--color-forest)]">No court-fee payments yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">Your monthly payment records will appear here after a payment is created.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {fees.map((fee) => (
                <div key={fee.id} className="flex flex-col gap-4 px-5 py-5 sm:grid sm:grid-cols-[1.5fr_1fr_1fr_auto] sm:items-center sm:px-7">
                  <div>
                    <p className="font-semibold text-[var(--color-forest)]">{formatMonth(fee.fee_month)}</p>
                    <p className="mt-1 text-xs text-slate-400">Payment ID: {fee.gateway_payment_id || 'Not available'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Amount</p>
                    <p className="mt-1 font-semibold text-slate-700">{formatAmount(fee.amount, fee.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Paid on</p>
                    <p className="mt-1 font-semibold text-slate-700">{formatDate(fee.paid_at)}</p>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusStyles(fee.status)}`}>
                    {statusLabel(fee.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}