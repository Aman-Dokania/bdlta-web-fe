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
      <main className="min-h-screen bg-gray-100 p-6">

        <div className="mx-auto max-w-lg">

          <div className="rounded-lg bg-white p-8 shadow">

            <h1 className="text-3xl font-bold">
              Membership
            </h1>

            <div className="mt-8 rounded-lg bg-green-50 p-6">

              <p className="text-lg font-semibold text-green-700">
                Membership Active
              </p>

              <p className="mt-2 text-green-600">
                Your lifetime BDLTA membership is already
                active.
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

  // Normal new-member payment page
  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <div className="mx-auto max-w-lg">

        <div className="rounded-lg bg-white p-8 shadow">

          <h1 className="text-3xl font-bold">
            BDLTA Membership
          </h1>

          <p className="mt-3 text-gray-600">
            Become a lifetime member of BDLTA.
          </p>

          <div className="mt-8 rounded-lg bg-gray-100 p-6">

            <p className="text-sm text-gray-500">
              Membership Type
            </p>

            <p className="mt-1 text-xl font-semibold">
              Lifetime Membership
            </p>

            <p className="mt-6 text-sm text-gray-500">
              Membership Fee
            </p>

            <p className="mt-1 text-3xl font-bold">
              ₹1,000
            </p>

          </div>

          <button
            onClick={handlePayment}
            disabled={paying}
            className="mt-8 w-full rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {paying
              ? 'Please wait...'
              : 'Pay ₹1,000'}
          </button>

          {message && (
            <p className="mt-5 rounded-lg bg-gray-100 p-4 text-center text-sm">
              {message}
            </p>
          )}

        </div>

      </div>

    </main>
  )
}