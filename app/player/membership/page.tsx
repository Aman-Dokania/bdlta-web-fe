'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../src/lib/supabase/client'

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function MembershipPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [message, setMessage] = useState('')

  const [isExistingMember, setIsExistingMember] = useState(false)
  const [requestStatus, setRequestStatus] = useState('not_requested')
  const [membershipActive, setMembershipActive] = useState(false)

  useEffect(() => {
    async function loadPlayer() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: player, error } = await supabase
        .from('players')
        .select(
          'status, is_existing_member, existing_member_request_status'
        )
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error(error)
        setMessage('Could not load your membership information.')
        setLoading(false)
        return
      }

      if (!player) {
        setMessage('Please complete player registration first.')
        setLoading(false)
        return
      }

      setMembershipActive(player.status === 'active')
      setIsExistingMember(player.is_existing_member === true)
      setRequestStatus(
        player.existing_member_request_status || 'not_requested'
      )

      setLoading(false)
    }

    loadPlayer()
  }, [router])

  async function handlePayment() {
    try {
      setPaying(true)
      setMessage('Creating payment...')

      const response = await fetch(
        '/api/membership/create-order',
        {
          method: 'POST',
        }
      )

      const order = await response.json()

      if (!response.ok) {
        throw new Error(
          order.error || 'Unable to create order'
        )
      }

      if (!window.Razorpay) {
        const script = document.createElement('script')

        script.src =
          'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true

        document.body.appendChild(script)

        await new Promise((resolve, reject) => {
          script.onload = resolve
          script.onerror = reject
        })
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'BDLTA',
        description: 'Lifetime Membership',
        order_id: order.orderId,

        handler: async function (response: any) {
          try {
            setMessage('Verifying payment...')

            const verifyResponse = await fetch(
              '/api/membership/verify-payment',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(response),
              }
            )

            const result = await verifyResponse.json()

            if (!verifyResponse.ok) {
              throw new Error(
                result.error ||
                  'Payment verification failed.'
              )
            }

            setMessage(
              `Payment successful! Your Player ID is ${result.playerNumber}`
            )

            setTimeout(() => {
              router.push('/player/dashboard')
              router.refresh()
            }, 1500)
          } catch (error) {
            console.error(error)

            setMessage(
              error instanceof Error
                ? error.message
                : 'Payment verification failed.'
            )
          } finally {
            setPaying(false)
          }
        },

        modal: {
          ondismiss: function () {
            setPaying(false)
          },
        },

        theme: {
          color: '#000000',
        },
      }

      const razorpay = new window.Razorpay(options)

      razorpay.on(
        'payment.failed',
        function (response: any) {
          console.error(
            'Payment failed:',
            response.error
          )

          setMessage(
            'Payment failed. Please try again.'
          )

          setPaying(false)
        }
      )

      razorpay.open()

    } catch (error) {
      console.error(error)

      setMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong.'
      )

      setPaying(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6" />
    )
  }

  // Existing member request pending
  if (
    isExistingMember &&
    requestStatus === 'pending'
  ) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">

        <div className="mx-auto max-w-lg">

          <div className="rounded-lg bg-white p-8 shadow">

            <h1 className="text-3xl font-bold">
              Membership
            </h1>

            <div className="mt-8 rounded-lg bg-yellow-50 p-6">

              <p className="text-lg font-semibold text-yellow-800">
                Existing Member Verification Pending
              </p>

              <p className="mt-3 text-yellow-700">
                You have requested verification as an
                existing BDLTA member.
              </p>

              <p className="mt-3 text-sm text-yellow-700">
                Your request is currently being reviewed
                by an administrator.
              </p>

              <p className="mt-4 font-medium text-yellow-800">
                No membership payment is required at this
                stage.
              </p>

            </div>

            <button
              onClick={() => router.push('/player/dashboard')}
              className="mt-6 w-full rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800"
            >
              Back to Dashboard
            </button>

          </div>

        </div>

      </main>
    )
  }

  // Already active
  if (membershipActive) {
    return (
      <main className="min-h-screen bg-gray-100 px-5 py-8 sm:p-10">

        <div className="mx-auto max-w-2xl">

          <div className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-emerald-950/5">

            <div className="border-b border-green-100 bg-green-50 px-6 py-7 sm:px-10">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-600 text-2xl font-bold text-white">
                  &#10003;
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
                    Membership confirmed
                  </p>
                  <h1 className="mt-1 text-3xl font-bold tracking-tight text-green-950 sm:text-4xl">
                    You are all set.
                  </h1>
                  <p className="mt-2 max-w-xl text-green-800">
                    Your lifetime BDLTA membership is active and ready to use.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-7 sm:px-10 sm:py-8">
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div>
                  <p className="text-sm text-gray-500">Membership type</p>
                  <p className="mt-1 text-lg font-semibold text-gray-950">
                    Lifetime membership
                  </p>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                  Active
                </span>
              </div>

              <div className="mt-7">
                <h2 className="text-lg font-semibold text-gray-950">
                  What you can do now
                </h2>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    ['Manage your profile', 'Keep your player details up to date.'],
                    ['Join tournaments', 'Register for upcoming BDLTA events.'],
                    ['Access your Player Card', 'View and share your player details.'],
                  ].map(([title, description]) => (
                    <div
                      key={title}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                    >
                      <p className="font-semibold text-gray-900">{title}</p>
                      <p className="mt-1 text-sm leading-5 text-gray-600">
                        {description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => router.push('/player/dashboard')}
                  className="flex-1 rounded-lg bg-black px-5 py-3 text-center font-semibold text-white transition hover:bg-gray-800"
                >
                  Go to Dashboard
                </button>

                <button
                  onClick={() => router.push('/player/profile')}
                  className="flex-1 rounded-lg border border-gray-200 px-5 py-3 text-center font-semibold text-gray-800 transition hover:border-gray-300 hover:bg-gray-50"
                >
                  View Player Profile
                </button>
              </div>

              <p className="mt-5 text-center text-sm text-gray-500">
                Your membership is already active. There is nothing else to pay.
              </p>
            </div>
          </div>

        </div>

      </main>
    )
  }

  // Normal new-member payment page
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-court)]">
          <span className="h-px w-8 bg-[var(--color-court)]" />
          BDLTA membership
        </div>

        <section className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/95 shadow-[0_24px_70px_rgba(18,60,44,0.16)] backdrop-blur-sm">
          <div className="relative overflow-hidden bg-[var(--color-forest)] px-6 py-9 text-white sm:px-10 sm:py-11">
            <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border-[24px] border-white/10" />
            <div className="relative">
              <p className="text-sm font-bold tracking-[0.3em] text-[#b9f23d]">BDLTA</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Become a lifetime member</h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-emerald-100 sm:text-base">Join the Bhagalpur District Lawn Tennis Association with a one-time membership payment.</p>
            </div>
          </div>

          <div className="px-6 py-7 sm:px-10 sm:py-9">
            <div className="flex flex-col gap-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-court)]">Membership type</p>
                <h2 className="mt-2 text-2xl font-bold text-[var(--color-forest)]">Lifetime Membership</h2>
                <p className="mt-2 text-sm text-slate-600">One-time payment · No recurring fees</p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Membership fee</p>
                <p className="mt-1 text-4xl font-bold tracking-tight text-[var(--color-forest)]">₹1,000</p>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                ['01', 'Official player profile'],
                ['02', 'Tournament access'],
                ['03', 'Digital player card'],
              ].map(([number, label]) => (
                <div key={number} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-bold text-[var(--color-court)]">{number}</p>
                  <p className="mt-2 text-sm font-semibold leading-5 text-slate-700">{label}</p>
                </div>
              ))}
            </div>

            <button onClick={handlePayment} disabled={paying} className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-forest)] px-5 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-[var(--color-court)] focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-50">
              {paying ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                  Creating secure payment...
                </>
              ) : (
                'Pay ₹1,000 securely'
              )}
            </button>

            {message && <p role="status" className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-center text-sm leading-6 text-slate-600">{message}</p>}
            <p className="mt-5 text-center text-xs text-slate-400">You will be redirected to Razorpay to complete your payment.</p>
          </div>
        </section>
      </div>
    </main>
  )
}