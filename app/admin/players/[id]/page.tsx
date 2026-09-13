'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/src/lib/supabase/client'
import LogoutButton from '@/src/components/LogoutButton'

export default function AdminPlayerDetailsPage() {
  const params = useParams()
  const router = useRouter()

  const playerId = params.id as string

  const [player, setPlayer] = useState<any>(null)
  const [membership, setMembership] = useState<any>(null)
  const [membershipPayment, setMembershipPayment] = useState<any>(null)
  const [courtFees, setCourtFees] = useState<any[]>([])
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    const loadPlayer = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Check admin access
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (
        profileError ||
        !profile ||
        !['admin', 'super_admin'].includes(profile.role)
      ) {
        router.push('/player/dashboard')
        return
      }

      // Load player
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select(`
          id,
          player_number,
          full_name,
          date_of_birth,
          gender,
          email,
          address,
          photo_url,
          status,
          created_at
        `)
        .eq('id', playerId)
        .maybeSingle()

      if (playerError || !playerData) {
        console.error('Player loading error:', playerError)
        setLoading(false)
        return
      }

      setPlayer(playerData)

      // Generate signed photo URL
      if (playerData.photo_url) {
        const { data: signedPhoto } = await supabase.storage
          .from('player-photos')
          .createSignedUrl(playerData.photo_url, 60 * 60)

        setPhotoUrl(signedPhoto?.signedUrl || null)
      }

      // Load membership
      const { data: membershipData } = await supabase
        .from('memberships')
        .select(`
          id,
          membership_type,
          start_date,
          end_date,
          fee,
          status
        `)
        .eq('player_id', playerId)
        .maybeSingle()

      setMembership(membershipData)

      // Load membership payment
      if (membershipData) {
        const { data: paymentData } = await supabase
          .from('payments')
          .select(`
            amount,
            currency,
            status,
            paid_at,
            gateway_payment_id
          `)
          .eq('membership_id', membershipData.id)
          .maybeSingle()

        setMembershipPayment(paymentData)
      }

      // Load court fee history
      const { data: courtFeeData, error: courtFeeError } =
        await supabase
          .from('court_fee_payments')
          .select(`
            id,
            fee_month,
            amount,
            currency,
            status,
            paid_at,
            gateway_payment_id
          `)
          .eq('player_id', playerId)
          .order('fee_month', { ascending: false })

      if (courtFeeError) {
        console.error('Court fee loading error:', courtFeeError)
      }

      setCourtFees(courtFeeData || [])

      setLoading(false)
    }

    loadPlayer()
  }, [playerId, router])

  const updatePlayerStatus = async (newStatus: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to change this player's status to "${newStatus}"?`
    )

    if (!confirmed) {
      return
    }

    try {
      setUpdatingStatus(true)

      const { error } = await supabase.rpc(
        'update_player_status',
        {
          p_player_id: playerId,
          p_status: newStatus,
        }
      )

      if (error) {
        throw error
      }

      setPlayer((current: any) => ({
        ...current,
        status: newStatus,
      }))

      alert('Player status updated successfully.')
    } catch (error: any) {
      console.error('Status update error:', error)

      alert(
        error.message || 'Unable to update player status.'
      )
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-gray-500">
            Loading player...
          </p>
        </div>
      </main>
    )
  }

  if (!player) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-lg bg-white p-8 shadow">
            <h1 className="text-xl font-semibold">
              Player not found
            </h1>

            <button
              onClick={() => router.push('/admin/players')}
              className="mt-4 rounded bg-black px-4 py-2 text-white"
            >
              Back to Players
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              onClick={() => router.push('/admin/players')}
              className="mb-3 text-sm text-gray-600 hover:underline"
            >
              ← Back to Players
            </button>

            <h1 className="text-3xl font-bold">
              Player Details
            </h1>
          </div>

          <LogoutButton />
        </div>

        {/* Player Profile */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <div className="flex flex-col gap-6 sm:flex-row">

            {/* Photo */}
            <div className="flex justify-center sm:justify-start">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={player.full_name}
                  className="h-40 w-40 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-lg bg-gray-200 text-4xl font-bold text-gray-500">
                  {player.full_name?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Basic Information */}
            <div className="flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {player.full_name}
                  </h2>

                  <p className="mt-1 text-gray-500">
                    {player.player_number || 'Player ID not assigned'}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-sm font-medium ${
                    player.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : player.status === 'suspended'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {player.status}
                </span>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => updatePlayerStatus('active')}
                    disabled={updatingStatus || player.status === 'active'}
                    className="rounded bg-green-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Set Active
                  </button>

                  <button
                    onClick={() => updatePlayerStatus('inactive')}
                    disabled={updatingStatus || player.status === 'inactive'}
                    className="rounded bg-gray-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Set Inactive
                  </button>

                  <button
                    onClick={() => updatePlayerStatus('suspended')}
                    disabled={updatingStatus || player.status === 'suspended'}
                    className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Suspend Player
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">
                    Date of Birth
                  </p>

                  <p className="font-medium">
                    {player.date_of_birth
                      ? new Date(
                          player.date_of_birth
                        ).toLocaleDateString('en-IN')
                      : '-'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Gender
                  </p>

                  <p className="font-medium">
                    {player.gender || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Email
                  </p>

                  <p className="font-medium">
                    {player.email || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Registered On
                  </p>

                  <p className="font-medium">
                    {new Date(
                      player.created_at
                    ).toLocaleDateString('en-IN')}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-500">
                    Address
                  </p>

                  <p className="font-medium">
                    {player.address || '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Membership */}
        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">
            Membership
          </h2>

          {membership ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-gray-500">
                  Type
                </p>

                <p className="font-medium">
                  {membership.membership_type}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Fee
                </p>

                <p className="font-medium">
                  ₹{membership.fee}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Start Date
                </p>

                <p className="font-medium">
                  {new Date(
                    membership.start_date
                  ).toLocaleDateString('en-IN')}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Status
                </p>

                <p className="font-medium text-green-600">
                  {membership.status}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-gray-500">
              Membership not found.
            </p>
          )}
        </div>

        {/* Membership Payment */}
        {membershipPayment && (
          <div className="mt-6 rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-semibold">
              Membership Payment
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-gray-500">
                  Amount
                </p>

                <p className="font-medium">
                  ₹{membershipPayment.amount}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Status
                </p>

                <p className="font-medium">
                  {membershipPayment.status}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Paid On
                </p>

                <p className="font-medium">
                  {membershipPayment.paid_at
                    ? new Date(
                        membershipPayment.paid_at
                      ).toLocaleDateString('en-IN')
                    : '-'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Court Fee History */}
        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">
            Court Fee History
          </h2>

          {courtFees.length === 0 ? (
            <p className="mt-4 text-gray-500">
              No court fee payments recorded.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-3 font-semibold">
                      Month
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Amount
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Status
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Paid On
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {courtFees.map((fee) => (
                    <tr
                      key={fee.id}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-3 py-4">
                        {new Date(
                          fee.fee_month
                        ).toLocaleDateString('en-IN', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="px-3 py-4">
                        ₹{fee.amount}
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            fee.status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : fee.status === 'failed'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {fee.status}
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        {fee.paid_at
                          ? new Date(
                              fee.paid_at
                            ).toLocaleDateString('en-IN')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}