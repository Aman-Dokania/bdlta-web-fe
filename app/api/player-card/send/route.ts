import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { sendPlayerCardEmail } from '@/src/lib/email/playerCardEmail'

export async function POST() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in.' },
        { status: 401 }
      )
    }

    // Get player
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select(`
        id,
        player_number,
        full_name,
        date_of_birth,
        gender,
        phone,
        email,
        photo_url,
        status
      `)
      .eq('user_id', user.id)
      .maybeSingle()

    if (playerError) {
      console.error(playerError)
      return NextResponse.json(
        { error: 'Unable to load player profile.' },
        { status: 500 }
      )
    }

    if (!player) {
      return NextResponse.json(
        { error: 'Player profile not found.' },
        { status: 404 }
      )
    }

    if (!player.player_number) {
      return NextResponse.json(
        { error: 'Player ID has not been assigned yet.' },
        { status: 400 }
      )
    }

    if (player.status !== 'active') {
      return NextResponse.json(
        { error: 'Player membership is not active.' },
        { status: 400 }
      )
    }

    // Get active lifetime membership
    const { data: membership, error: membershipError } =
      await supabase
        .from('memberships')
        .select(`
          membership_type,
          start_date,
          status
        `)
        .eq('player_id', player.id)
        .eq('membership_type', 'lifetime')
        .eq('status', 'active')
        .maybeSingle()

    if (membershipError) {
      console.error(membershipError)
      return NextResponse.json(
        { error: 'Unable to verify membership.' },
        { status: 500 }
      )
    }

    if (!membership) {
      return NextResponse.json(
        { error: 'Active lifetime membership not found.' },
        { status: 400 }
      )
    }

    // Download private player photo
    let photoBytes: Uint8Array | null = null
    let photoContentType: string | null = null

    if (player.photo_url) {
      const { data: photoData, error: photoError } =
        await supabase.storage
          .from('player-photos')
          .download(player.photo_url)

      if (!photoError && photoData) {
        photoBytes = new Uint8Array(
          await photoData.arrayBuffer()
        )

        photoContentType = photoData.type || null
      }
    }

    await sendPlayerCardEmail({
      email: player.email || user.email || '',
      player: {
        fullName: player.full_name,
        playerNumber: player.player_number,
        gender: player.gender,
        dateOfBirth: player.date_of_birth,
        phone: player.phone,
        membershipType: membership.membership_type,
        membershipStartDate: membership.start_date,
        photoBytes,
        photoContentType,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Player Card has been sent to your email.',
    })
  } catch (error) {
    console.error('Player Card email error:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to send Player Card.',
      },
      { status: 500 }
    )
  }
}