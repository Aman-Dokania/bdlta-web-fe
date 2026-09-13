import { createClient } from '../../../src/lib/supabase/server'
import { redirect } from 'next/navigation'

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

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <div className="mx-auto max-w-md">

        <div className="mb-6">
          <a
            href="/player/dashboard"
            className="text-sm text-gray-600 hover:text-black"
          >
            ← Back to Dashboard
          </a>
        </div>

        {/* Player Card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">

          {/* Header */}
          <div className="bg-black px-6 py-5 text-center text-white">

            <h1 className="text-2xl font-bold">
              BDLTA
            </h1>

            <p className="mt-1 text-sm">
              BHAGALPUR DISTRICT LAWN TENNIS ASSOCIATION
            </p>

            <p className="mt-3 text-xs tracking-widest text-gray-300">
              PLAYER MEMBERSHIP CARD
            </p>

          </div>

          {/* Photo */}
          <div className="flex justify-center pt-8">

            {photoUrl ? (
              <img
                src={photoUrl}
                alt={player.full_name}
                className="h-32 w-32 rounded-full object-cover ring-4 ring-gray-100"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-200 text-4xl font-bold text-gray-500">
                {player.full_name.charAt(0).toUpperCase()}
              </div>
            )}

          </div>

          {/* Player Information */}
          <div className="px-8 py-6">

            <div className="text-center">

              <h2 className="text-2xl font-bold">
                {player.full_name}
              </h2>

              <p className="mt-2 text-lg font-semibold">
                {player.player_number}
              </p>

              <span className="mt-3 inline-block rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-700">
                ACTIVE MEMBER
              </span>

            </div>

            <div className="mt-8 space-y-4 border-t pt-6">

              <div className="flex justify-between">
                <span className="text-gray-500">
                  Membership
                </span>

                <span className="font-medium">
                  {membership?.membership_type === 'lifetime'
                    ? 'Lifetime'
                    : membership?.membership_type || '-'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">
                  Member Since
                </span>

                <span className="font-medium">
                  {membership?.start_date
                    ? new Date(
                        membership.start_date
                      ).toLocaleDateString('en-IN')
                    : '-'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">
                  Status
                </span>

                <span className="font-medium text-green-600">
                  Active
                </span>
              </div>

            </div>

          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 px-6 py-4 text-center">

            <p className="text-xs text-gray-500">
              This card is issued by BDLTA.
            </p>

          </div>

        </div>

      </div>

    </main>
  )
}