'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/src/lib/supabase/client'

declare global {
  interface Window {
    Razorpay: any
  }
}

type Category = {
  id: string
  name: string
  event_type: 'singles' | 'doubles' | 'mixed_doubles'
  gender: string | null
  age_group: string | null
  entry_fee: number
  max_players: number | null
  registration_open: boolean
}

type Player = {
  id: string
  player_number: string | null
  full_name: string
  status: string
}

export default function TournamentRegistrationPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const tournamentId = params.id as string
  const preselectedCategory = searchParams.get('category')

  const [tournament, setTournament] = useState<any>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [player, setPlayer] = useState<Player | null>(null)
  const [partners, setPartners] = useState<Player[]>([])

  const [selectedCategory, setSelectedCategory] = useState(
    preselectedCategory || ''
  )
  const [selectedPartner, setSelectedPartner] = useState('')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadRazorpay()
    loadData()
  }, [])

  function loadRazorpay() {
    if (document.getElementById('razorpay-script')) {
      return
    }

    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true

    document.body.appendChild(script)
  }

  async function loadData() {
    try {
      setLoading(true)
      setError('')

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get current player
      const { data: playerData, error: playerError } =
        await supabase
          .from('players')
          .select(
            'id, player_number, full_name, status'
          )
          .eq('user_id', user.id)
          .maybeSingle()

      if (playerError) throw playerError

      if (!playerData) {
        setError('Player profile not found.')
        return
      }

      setPlayer(playerData)

      if (playerData.status !== 'active') {
        setError(
          'Only active members can register for tournaments.'
        )
        return
      }

      // Get tournament
      const {
        data: tournamentData,
        error: tournamentError,
      } = await supabase
        .from('tournaments')
        .select(
          'id, name, venue, start_date, end_date, status'
        )
        .eq('id', tournamentId)
        .maybeSingle()

      if (tournamentError) throw tournamentError

      if (!tournamentData) {
        setError('Tournament not found.')
        return
      }

      if (tournamentData.status !== 'registration_open') {
        setError('Tournament registration is not open.')
        return
      }

      setTournament(tournamentData)

      // Get categories
      const {
        data: categoryData,
        error: categoryError,
      } = await supabase
        .from('tournament_categories')
        .select(
          'id, name, event_type, gender, age_group, entry_fee, max_players, registration_open'
        )
        .eq('tournament_id', tournamentId)
        .eq('registration_open', true)
        .order('name')

      if (categoryError) throw categoryError

      setCategories(categoryData || [])

      // Get active players for doubles partner
      const {
        data: partnerData,
        error: partnerError,
      } = await supabase
        .from('players')
        .select(
          'id, player_number, full_name, status'
        )
        .eq('status', 'active')
        .neq('id', playerData.id)
        .order('full_name')

      if (partnerError) throw partnerError

      setPartners(partnerData || [])
    } catch (err: any) {
      console.error(err)

      setError(
        err.message ||
          'Unable to load registration page.'
      )
    } finally {
      setLoading(false)
    }
  }

  const selectedCategoryData = categories.find(
    (category) =>
      category.id === selectedCategory
  )

  const requiresPartner =
    selectedCategoryData?.event_type === 'doubles' ||
    selectedCategoryData?.event_type ===
      'mixed_doubles'

  async function registerForTournament() {
    if (!selectedCategoryData) {
      setError('Please select a category.')
      return
    }

    if (
      requiresPartner &&
      !selectedPartner
    ) {
      setError('Please select a doubles partner.')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      // Create registration
      const { data: registration, error: registrationError } =
        await supabase.rpc(
          'create_tournament_registration',
          {
            p_tournament_id: tournamentId,
            p_category_id: selectedCategoryData.id,
            p_partner_player_id: requiresPartner
              ? selectedPartner
              : null,
          }
        )

      if (registrationError) {
        throw registrationError
      }

      if (!registration) {
        throw new Error(
          'Unable to create tournament registration.'
        )
      }

      /*
       * FREE TOURNAMENT
       *
       * The database function automatically creates
       * ₹0 registrations as confirmed.
       */
      if (selectedCategoryData.entry_fee === 0) {
        setSuccess(
          'Registration confirmed successfully! No payment is required.'
        )

        setTimeout(() => {
          router.push('/player/dashboard')
        }, 1500)

        return
      }

      /*
       * PAID TOURNAMENT
       *
       * Create Razorpay order.
       */
      const response = await fetch(
        '/api/tournament/create-order',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            registrationId: registration.id,
          }),
        }
      )

      const orderData = await response.json()

      if (!response.ok) {
        throw new Error(
          orderData.error ||
            'Unable to create payment order.'
        )
      }

      // Make sure Razorpay has loaded
      if (!window.Razorpay) {
        throw new Error(
          'Payment system is still loading. Please try again.'
        )
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'BDLTA',
        description: `${orderData.tournamentName} - ${orderData.categoryName}`,
        order_id: orderData.orderId,

        prefill: {
          name: player?.full_name || '',
        },

        theme: {
          color: '#000000',
        },

        handler: async function (
          paymentResponse: any
        ) {
          try {
            setError('')
            setSuccess(
              'Payment received. Verifying...'
            )

            const verifyResponse = await fetch(
              '/api/tournament/verify-payment',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id:
                    paymentResponse.razorpay_order_id,
                  razorpay_payment_id:
                    paymentResponse.razorpay_payment_id,
                  razorpay_signature:
                    paymentResponse.razorpay_signature,
                  registration_id:
                    registration.id,
                }),
              }
            )

            const verifyData =
              await verifyResponse.json()

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData.error ||
                  'Payment verification failed.'
              )
            }

            setSuccess(
              'Payment successful! Your tournament registration is confirmed.'
            )

            setTimeout(() => {
              router.push('/player/dashboard')
            }, 2000)
          } catch (err: any) {
            console.error(err)

            setSuccess('')

            setError(
              err.message ||
                'Payment verification failed.'
            )
          } finally {
            setSubmitting(false)
          }
        },

        modal: {
          ondismiss: function () {
            setSubmitting(false)

            setError(
              'Payment was cancelled. Your registration is still pending payment.'
            )
          },
        },
      }

      const razorpay =
        new window.Razorpay(options)

      razorpay.open()
    } catch (err: any) {
      console.error(err)

      setError(
        err.message ||
          'Unable to register for tournament.'
      )

      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-3xl">
          <p>Loading registration...</p>
        </div>
      </main>
    )
  }

  if (error && !tournament) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-red-600">
              {error}
            </p>

            <button
              onClick={() => router.back()}
              className="mt-4 rounded-lg bg-black px-4 py-2 text-white"
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-3xl">

        <button
          onClick={() => router.back()}
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back
        </button>

        <div className="mt-6 rounded-lg bg-white p-6 shadow">

          <h1 className="text-2xl font-bold">
            Register for {tournament?.name}
          </h1>

          <p className="mt-2 text-gray-600">
            📍 {tournament?.venue}
          </p>

          {/* Player */}
          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">
              Player
            </p>

            <p className="font-medium">
              {player?.full_name}
            </p>

            {player?.player_number && (
              <p className="text-sm text-gray-500">
                {player.player_number}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="mt-6">
            <label className="block text-sm font-medium">
              Select Category
            </label>

            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(
                  e.target.value
                )
                setSelectedPartner('')
                setError('')
                setSuccess('')
              }}
              className="mt-2 w-full rounded-lg border p-3"
              disabled={submitting}
            >
              <option value="">
                Select a category
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name} — ₹
                    {category.entry_fee}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Category details */}
          {selectedCategoryData && (
            <div className="mt-4 rounded-lg border p-4">
              <h2 className="font-semibold">
                {selectedCategoryData.name}
              </h2>

              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>
                  <strong>Event:</strong>{' '}
                  {selectedCategoryData.event_type.replace(
                    '_',
                    ' '
                  )}
                </p>

                <p>
                  <strong>Gender:</strong>{' '}
                  {selectedCategoryData.gender ||
                    'Any'}
                </p>

                <p>
                  <strong>Age Group:</strong>{' '}
                  {selectedCategoryData.age_group ||
                    'Open'}
                </p>

                <p>
                  <strong>Entry Fee:</strong>{' '}
                  ₹{selectedCategoryData.entry_fee}
                </p>
              </div>
            </div>
          )}

          {/* Partner */}
          {requiresPartner && (
            <div className="mt-6">
              <label className="block text-sm font-medium">
                Select Doubles Partner
              </label>

              <select
                value={selectedPartner}
                onChange={(e) =>
                  setSelectedPartner(
                    e.target.value
                  )
                }
                className="mt-2 w-full rounded-lg border p-3"
                disabled={submitting}
              >
                <option value="">
                  Select partner
                </option>

                {partners.map(
                  (partner) => (
                    <option
                      key={partner.id}
                      value={partner.id}
                    >
                      {partner.full_name}
                      {partner.player_number
                        ? ` (${partner.player_number})`
                        : ''}
                    </option>
                  )
                )}
              </select>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mt-5 rounded-lg bg-green-50 p-4 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* Payment summary */}
          {selectedCategoryData && (
            <div className="mt-6 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  Tournament Entry Fee
                </span>

                <span className="text-lg font-bold">
                  ₹{selectedCategoryData.entry_fee}
                </span>
              </div>
            </div>
          )}

          {/* Register / Pay */}
          <button
            onClick={registerForTournament}
            disabled={
              submitting ||
              !selectedCategory ||
              (requiresPartner &&
                !selectedPartner)
            }
            className="mt-6 w-full rounded-lg bg-black px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? 'Processing...'
              : selectedCategoryData?.entry_fee === 0
                ? 'Confirm Registration'
                : 'Register & Pay'}
          </button>

        </div>
      </div>
    </main>
  )
}