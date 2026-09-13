'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../../../src/lib/supabase/client'

type Player = {
  id: string
  full_name: string
  date_of_birth: string | null
  gender: string | null
  phone: string | null
  email: string | null
  address: string | null
  photo_url: string | null
  status: string
  is_existing_member: boolean
  existing_member_request_status: string
  created_at: string
}

export default function ExistingMemberRequestsPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  async function loadRequests() {
    setLoading(true)
    setMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setMessage('Please login first.')
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      setMessage('Could not verify admin access.')
      setLoading(false)
      return
    }

    if (!['admin', 'super_admin'].includes(profile.role)) {
      setMessage('You are not authorized to view this page.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('players')
      .select(`
        id,
        full_name,
        date_of_birth,
        gender,
        phone,
        email,
        address,
        photo_url,
        status,
        is_existing_member,
        existing_member_request_status,
        created_at
      `)
      .eq('is_existing_member', true)
      .eq('existing_member_request_status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setMessage(error.message)
      setLoading(false)
      return
    }

    setPlayers(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadRequests()
  }, [])

  async function reviewRequest(
    playerId: string,
    decision: 'approved' | 'rejected'
  ) {
    const action =
      decision === 'approved' ? 'approve' : 'reject'

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this existing member request?`
    )

    if (!confirmed) return

    setProcessingId(playerId)
    setMessage('')

    const { error } = await supabase.rpc(
      'review_existing_member_request',
      {
        p_player_id: playerId,
        p_decision: decision,
      }
    )

    if (error) {
      console.error(error)
      setMessage(error.message)
      setProcessingId(null)
      return
    }

    setMessage(
      decision === 'approved'
        ? 'Existing member approved successfully.'
        : 'Existing member request rejected.'
    )

    await loadRequests()

    setProcessingId(null)
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <div className="mx-auto max-w-7xl">

        <div className="mb-6">

          <Link
            href="/admin/dashboard"
            className="text-sm text-gray-600 hover:underline"
          >
            ← Back to Admin Dashboard
          </Link>

          <h1 className="mt-3 text-3xl font-bold">
            Existing Member Requests
          </h1>

          <p className="mt-2 text-gray-600">
            Review players who have requested verification as existing BDLTA
            members.
          </p>

        </div>

        {message && (
          <div className="mb-6 rounded-lg bg-white p-4 shadow">
            {message}
          </div>
        )}

        {loading ? (
          <div className="rounded-lg bg-white p-6 shadow">
            Loading requests...
          </div>
        ) : players.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <h2 className="text-xl font-semibold">
              No pending requests
            </h2>

            <p className="mt-2 text-gray-600">
              There are currently no existing member requests waiting for
              approval.
            </p>
          </div>
        ) : (
          <div className="space-y-6">

            {players.map((player) => (
              <div
                key={player.id}
                className="rounded-lg bg-white p-6 shadow"
              >

                <div className="flex flex-col gap-6 md:flex-row">

                  {/* Photo */}
                  <div className="shrink-0">

                    {player.photo_url ? (
                      <PlayerPhoto
                        photoPath={player.photo_url}
                      />
                    ) : (
                      <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-gray-200 text-sm text-gray-500">
                        No Photo
                      </div>
                    )}

                  </div>

                  {/* Details */}
                  <div className="flex-1">

                    <h2 className="text-xl font-bold">
                      {player.full_name}
                    </h2>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">

                      <Detail
                        label="Phone"
                        value={player.phone}
                      />

                      <Detail
                        label="Email"
                        value={player.email}
                      />

                      <Detail
                        label="Date of Birth"
                        value={player.date_of_birth}
                      />

                      <Detail
                        label="Gender"
                        value={player.gender}
                      />

                      <Detail
                        label="Address"
                        value={player.address}
                      />

                      <Detail
                        label="Registration Date"
                        value={new Date(
                          player.created_at
                        ).toLocaleDateString()}
                      />

                    </div>

                    {/* Status */}
                    <div className="mt-5">

                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                        Existing Member — Pending Verification
                      </span>

                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex flex-wrap gap-3">

                      <button
                        onClick={() =>
                          reviewRequest(player.id, 'approved')
                        }
                        disabled={processingId === player.id}
                        className="rounded bg-green-600 px-5 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {processingId === player.id
                          ? 'Processing...'
                          : 'Approve Existing Membership'}
                      </button>

                      <button
                        onClick={() =>
                          reviewRequest(player.id, 'rejected')
                        }
                        disabled={processingId === player.id}
                        className="rounded bg-red-600 px-5 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject Request
                      </button>

                    </div>

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </main>
  )
}

function Detail({
  label,
  value,
}: {
  label: string
  value: string | null
}) {
  return (
    <div>
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="font-medium">
        {value || 'Not provided'}
      </p>
    </div>
  )
}

function PlayerPhoto({
  photoPath,
}: {
  photoPath: string
}) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    async function getPhoto() {
      const { data, error } = await supabase.storage
        .from('player-photos')
        .createSignedUrl(photoPath, 60 * 60)

      if (!error && data?.signedUrl) {
        setUrl(data.signedUrl)
      }
    }

    getPhoto()
  }, [photoPath])

  if (!url) {
    return (
      <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-gray-200 text-sm text-gray-500">
        Loading...
      </div>
    )
  }

  return (
    <img
      src={url}
      alt="Player"
      className="h-32 w-32 rounded-lg object-cover"
    />
  )
}