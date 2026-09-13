 'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../src/lib/supabase/client'
import LogoutButton from '@/src/components/LogoutButton'

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function PlayerDashboard() {
  const router = useRouter()
  const [player, setPlayer] = useState<any>(null)
  const [membership, setMembership] = useState<any>(null)
  const [payment, setPayment] = useState<any>(null)
  const [courtFee, setCourtFee] = useState<any>(null)
  const [tournamentRegistrations, setTournamentRegistrations] =
    useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [payingCourtFee, setPayingCourtFee] = useState(false)
  const [sendingCard, setSendingCard] = useState(false)
  const [cardMessage, setCardMessage] = useState('')
  const currentMonth = new Date()

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  useEffect(() => {
    const loadDashboard = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select(
          `id, player_number, full_name, date_of_birth, gender, email, address, photo_url, status, is_existing_member, existing_member_request_status`
        )
        .eq('user_id', user.id)
        .maybeSingle()

      if (playerError) {
        console.error(playerError)
      }

      setPlayer(playerData)

      if (playerData) {
        const { data: membershipData } = await supabase
          .from('memberships')
          .select('id, membership_type, start_date, end_date, fee, status')
          .eq('player_id', playerData.id)
          .eq('membership_type', 'lifetime')
          .maybeSingle()

        setMembership(membershipData)

        if (membershipData) {
          const { data: paymentData } = await supabase
            .from('payments')
            .select('amount, currency, status, paid_at, gateway_payment_id')
            .eq('membership_id', membershipData.id)
            .maybeSingle()

          setPayment(paymentData)
        }

        const feeMonth = `${currentMonth.getFullYear()}-${String(
          currentMonth.getMonth() + 1
        ).padStart(2, '0')}-01`

        const { data: courtFeeData } = await supabase
          .from('court_fee_payments')
          .select('id, fee_month, amount, status, paid_at')
          .eq('player_id', playerData.id)
          .eq('fee_month', feeMonth)
          .maybeSingle()

        setCourtFee(courtFeeData)

        const { data: tournamentData, error: tournamentError } =
          await supabase
            .from('tournament_registrations')
            .select(`
              id,
              status,
              registered_at,
              partner_player_id,
              tournaments (
                id,
                name,
                venue,
                start_date,
                end_date,
                status
              ),
              tournament_categories (
                id,
                name,
                event_type,
                entry_fee
              )
            `)
            .eq('player_id', playerData.id)
            .order('registered_at', {
              ascending: false,
            })

        if (tournamentError) {
          console.error(tournamentError)
        } else {
          setTournamentRegistrations(tournamentData || [])
        }
      }

      setLoading(false)
    }

    loadDashboard()
  }, [router])

  const handleEmailPlayerCard = async () => {
    setSendingCard(true)
    setCardMessage('')

    try {
      const response = await fetch('/api/player-card/send', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to send Player Card.')
      }

      setCardMessage('Player Card sent successfully to your email.')
    } catch (error) {
      setCardMessage(
        error instanceof Error
          ? error.message
          : 'Unable to send Player Card.'
      )
    } finally {
      setSendingCard(false)
    }
  }

  const payCourtFee = async () => {
    try {
      setPayingCourtFee(true)

      const feeMonth = `${currentMonth.getFullYear()}-${String(
        currentMonth.getMonth() + 1
      ).padStart(2, '0')}-01`

      const orderResponse = await fetch('/api/court-fee/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feeMonth }),
      })

      const orderData = await orderResponse.json()

      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Unable to create payment order.')
      }

      if (!window.Razorpay) {
        throw new Error('Razorpay failed to load. Please refresh the page.')
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'BDLTA',
        description: 'Monthly Tennis Court Fee',
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            const verifyResponse = await fetch('/api/court-fee/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                fee_month: feeMonth,
              }),
            })

            const verifyData = await verifyResponse.json()

            if (!verifyResponse.ok) {
              throw new Error(verifyData.error || 'Payment verification failed.')
            }

            alert('Court fee paid successfully!')
            window.location.reload()
          } catch (error: any) {
            alert(error.message || 'Payment verification failed.')
          } finally {
            setPayingCourtFee(false)
          }
        },
        modal: {
          ondismiss: function () {
            setPayingCourtFee(false)
          },
        },
        theme: {
          color: '#000000',
        },
      }

      const razorpay = new window.Razorpay(options)

      razorpay.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response.error)
        alert('Payment failed. Please try again.')
        setPayingCourtFee(false)
      })

      razorpay.open()
    } catch (error: any) {
      console.error(error)
      alert(error.message || 'Unable to start payment.')
      setPayingCourtFee(false)
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-gray-100 p-6" />
  }

  if (!player) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-4xl">

          <div className="rounded-lg bg-white p-8 shadow">

            <h1 className="text-3xl font-bold">
              Welcome to BDLTA
            </h1>

            <p className="mt-3 text-gray-600">
              You haven't completed your player registration yet.
            </p>

            <a
              href="/player/register"
              className="mt-6 inline-block rounded-lg bg-black px-5 py-3 font-medium text-white"
            >
              Complete Player Registration
            </a>

          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-3xl font-bold">
              Player Dashboard
            </h1>

            <p className="mt-1 text-gray-600">
              Welcome, {player.full_name}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/player/profile"
              className="rounded-lg border bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-50"
            >
              Edit Profile
            </a>

            <LogoutButton />
          </div>

        </div>

        {/* Player ID Card */}
        <div className="mt-8 rounded-lg bg-black p-6 text-white shadow">

          <p className="text-sm text-gray-300">
            BDLTA PLAYER ID
          </p>

          <p className="mt-2 text-3xl font-bold">
            {player.player_number || 'Not assigned'}
          </p>

          <div className="mt-4">

            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                player.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {player.status}
            </span>

            {player.status === 'active' && (
              <>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href="/player/card"
                    className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-100"
                  >
                    View Player Card
                  </a>

                  <button
                    type="button"
                    onClick={handleEmailPlayerCard}
                    disabled={sendingCard}
                    className="rounded-lg border border-white bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sendingCard ? 'Sending...' : 'Email Player Card'}
                  </button>
                </div>

                {cardMessage && (
                  <p className="mt-3 text-sm text-gray-300">
                    {cardMessage}
                  </p>
                )}
              </>
            )}

          </div>

        </div>

        {/* Dashboard Cards */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {/* Membership */}
          <div className="rounded-lg bg-white p-6 shadow">

            <h2 className="text-lg font-semibold">
              Membership
            </h2>

            {membership ? (
              <>
                <p className="mt-3 font-medium text-green-600">
                  Active
                </p>

                <p className="mt-2 text-gray-600">
                  Lifetime Membership
                </p>

                <p className="mt-1 text-gray-600">
                  Fee: ₹{membership.fee}
                </p>

                <p className="mt-1 text-gray-600">
                  Joined:{' '}
                  {new Date(
                    membership.start_date
                  ).toLocaleDateString('en-IN')}
                </p>
              </>
            ) : player.is_existing_member &&
              player.existing_member_request_status === 'pending' ? (
              <>
                <p className="mt-3 font-medium text-yellow-600">
                  Verification Pending
                </p>

                <p className="mt-2 text-gray-600">
                  Your existing BDLTA membership request is waiting
                  for administrator approval.
                </p>

                <p className="mt-3 text-sm text-gray-500">
                  No membership payment is required while your request
                  is being reviewed.
                </p>
              </>
            ) : player.is_existing_member &&
              player.existing_member_request_status === 'rejected' ? (
              <>
                <p className="mt-3 font-medium text-red-600">
                  Request Rejected
                </p>

                <p className="mt-2 text-gray-600">
                  Your existing member request was not approved.
                </p>

                <a
                  href="/player/membership"
                  className="mt-4 inline-block rounded bg-black px-4 py-2 text-white"
                >
                  Apply for New Membership
                </a>
              </>
            ) : (
              <>
                <p className="mt-3 font-medium text-yellow-600">
                  Payment Pending
                </p>

                <p className="mt-2 text-gray-600">
                  Lifetime Membership
                </p>

                <a
                  href="/player/membership"
                  className="mt-4 inline-block rounded bg-black px-4 py-2 text-white"
                >
                  Pay ₹1,000
                </a>
              </>
            )}

          </div>

          {/* Court Fee */}
          <div className="rounded-lg bg-white p-6 shadow">

            <h2 className="text-lg font-semibold">
              Court Fee
            </h2>

            <p className="mt-3 text-gray-600">
              {currentMonth.toLocaleDateString('en-IN', {
                month: 'long',
                year: 'numeric',
              })}
            </p>

            <p className="mt-2 text-2xl font-bold">
              ₹2,000
            </p>

            {courtFee?.status === 'paid' ? (
              <>
                <p className="mt-3 font-medium text-green-600">
                  ✓ Paid
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {courtFee.paid_at
                    ? `Paid on ${new Date(
                        courtFee.paid_at
                      ).toLocaleDateString('en-IN')}`
                    : ''}
                </p>
              </>
            ) : (
              <>
                <p className="mt-3 font-medium text-red-600">
                  Unpaid
                </p>

                <button
                  onClick={payCourtFee}
                  disabled={player.status !== 'active' || payingCourtFee}
                  className="mt-4 rounded bg-black px-4 py-2 text-white disabled:opacity-40"
                >
                  {payingCourtFee ? 'Processing...' : 'Pay ₹2,000'}
                </button>
              </>
            )}

          </div>

          {/* Tournaments */}
          <div className="rounded-lg bg-white p-6 shadow">

            <h2 className="text-lg font-semibold">
              Tournaments
            </h2>

            <p className="mt-3 text-gray-600">
              View upcoming tournaments and register.
            </p>

            <a
              href="/tournaments"
              className="mt-4 inline-block rounded bg-black px-4 py-2 text-white"
            >
              View Tournaments
            </a>

          </div>

        </div>

        {/* My Tournament Registrations */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-xl font-semibold">
                My Tournament Registrations
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your tournament entries and registration status.
              </p>
            </div>

            <a
              href="/tournaments"
              className="w-fit rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Browse Tournaments
            </a>

          </div>

          {tournamentRegistrations.length === 0 ? (

            <div className="mt-6 rounded-lg bg-gray-50 p-6 text-center">
              <p className="text-gray-500">
                You haven't registered for any tournaments yet.
              </p>

              <a
                href="/tournaments"
                className="mt-4 inline-block text-sm font-medium text-black underline"
              >
                View upcoming tournaments
              </a>
            </div>

          ) : (

            <div className="mt-6 space-y-4">

              {tournamentRegistrations.map((registration) => {
                const tournament =
                  Array.isArray(registration.tournaments)
                    ? registration.tournaments[0]
                    : registration.tournaments

                const category =
                  Array.isArray(registration.tournament_categories)
                    ? registration.tournament_categories[0]
                    : registration.tournament_categories

                return (
                  <div
                    key={registration.id}
                    className="rounded-lg border p-5"
                  >

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                      <div>

                        <h3 className="text-lg font-semibold">
                          {tournament?.name || 'Tournament'}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          {category?.name || 'Category'}
                        </p>

                      </div>

                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
                          registration.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : registration.status === 'pending_payment'
                              ? 'bg-yellow-100 text-yellow-700'
                              : registration.status === 'cancelled'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {registration.status === 'pending_payment'
                          ? 'Payment Pending'
                          : registration.status}
                      </span>

                    </div>

                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">

                      <div>
                        <p className="text-gray-500">Event</p>

                        <p className="font-medium capitalize">
                          {category?.event_type?.replace('_', ' ') || '-'}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">Entry Fee</p>

                        <p className="font-medium">
                          ₹{category?.entry_fee ?? 0}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">Tournament Date</p>

                        <p className="font-medium">
                          {tournament?.start_date
                            ? new Date(
                                tournament.start_date
                              ).toLocaleDateString('en-IN')
                            : '-'}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">Venue</p>

                        <p className="font-medium">
                          {tournament?.venue || '-'}
                        </p>
                      </div>

                    </div>

                    {registration.partner_player_id && (
                      <p className="mt-4 text-sm text-gray-600">
                        <strong>Doubles Partner:</strong> Partner selected
                      </p>
                    )}

                    <p className="mt-3 text-xs text-gray-400">
                      Registered on{' '}
                      {registration.registered_at
                        ? new Date(
                            registration.registered_at
                          ).toLocaleDateString('en-IN')
                        : '-'}
                    </p>

                  </div>
                )
              })}

            </div>

          )}

        </div>

        {/* Membership Payment */}
        {payment && (
          <div className="mt-8 rounded-lg bg-white p-6 shadow">

            <h2 className="text-lg font-semibold">
              Membership Payment
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">

              <div>
                <p className="text-sm text-gray-500">
                  Amount
                </p>

                <p className="font-medium">
                  ₹{payment.amount}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Status
                </p>

                <p className="font-medium">
                  {payment.status}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Paid On
                </p>

                <p className="font-medium">
                  {payment.paid_at
                    ? new Date(
                        payment.paid_at
                      ).toLocaleDateString('en-IN')
                    : '-'}
                </p>
              </div>

            </div>

          </div>
        )}

      </div>

    </main>
  )
}