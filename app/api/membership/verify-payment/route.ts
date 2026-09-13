import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/src/lib/supabase/server'
import { sendPlayerCardEmail } from '@/src/lib/email/playerCardEmail'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Check logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in.' },
        { status: 401 }
      )
    }

    // 2. Get Razorpay payment details
    const body = await request.json()

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        { error: 'Missing payment information.' },
        { status: 400 }
      )
    }

    // 3. Verify Razorpay signature
    const generatedSignature = crypto
      .createHmac(
        'sha256',
        process.env.RAZORPAY_KEY_SECRET!
      )
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest('hex')

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Payment verification failed.' },
        { status: 400 }
      )
    }

    // 4. Find the logged-in player's profile
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (playerError || !player) {
      return NextResponse.json(
        { error: 'Player profile not found.' },
        { status: 400 }
      )
    }

    // 5. Activate membership through secure database function
    const { data: playerNumber, error: activationError } =
      await supabase.rpc(
        'activate_lifetime_membership',
        {
          p_player_id: player.id,
          p_order_id: razorpay_order_id,
          p_payment_id: razorpay_payment_id,
          p_signature: razorpay_signature,
        }
      )

    if (activationError) {
      console.error('Activation error:', activationError)

      return NextResponse.json(
        { error: activationError.message },
        { status: 500 }
      )
    }

    // 6. Load the newly activated player details
    const { data: activatedPlayer, error: activatedPlayerError } =
      await supabase
        .from('players')
        .select(`
          id,
          player_number,
          full_name,
          date_of_birth,
          gender,
          phone,
          email,
          photo_url
        `)
        .eq('id', player.id)
        .single()

    if (activatedPlayerError || !activatedPlayer) {
      console.error('Could not load activated player:', activatedPlayerError)

      return NextResponse.json({
        success: true,
        message:
          'Membership activated, but Player Card could not be emailed.',
        playerNumber,
      })
    }

    // 7. Load active lifetime membership
    const { data: membership, error: membershipError } =
      await supabase
        .from('memberships')
        .select('membership_type, start_date')
        .eq('player_id', activatedPlayer.id)
        .eq('membership_type', 'lifetime')
        .eq('status', 'active')
        .single()

    if (membershipError || !membership) {
      console.error('Could not load membership:', membershipError)

      return NextResponse.json({
        success: true,
        message:
          'Membership activated, but Player Card could not be emailed.',
        playerNumber,
      })
    }

    // 8. Download player photo if available
    let photoBytes: Uint8Array | null = null
    let photoContentType: string | null = null

    if (activatedPlayer.photo_url) {
      const { data: photoData, error: photoError } =
        await supabase.storage
          .from('player-photos')
          .download(activatedPlayer.photo_url)

      if (!photoError && photoData) {
        photoBytes = new Uint8Array(
          await photoData.arrayBuffer()
        )

        photoContentType = photoData.type || null
      }
    }

    // 9. Send Player Card automatically
    try {
      await sendPlayerCardEmail({
        email: activatedPlayer.email || user.email || '',
        player: {
          fullName: activatedPlayer.full_name,
          playerNumber: activatedPlayer.player_number,
          gender: activatedPlayer.gender,
          dateOfBirth: activatedPlayer.date_of_birth,
          phone: activatedPlayer.phone,
          membershipType: membership.membership_type,
          membershipStartDate: membership.start_date,
          photoBytes,
          photoContentType,
        },
      })
    } catch (emailError) {
      console.error('Player Card email error:', emailError)

      // Membership payment succeeded, so do NOT mark the payment as failed
      return NextResponse.json({
        success: true,
        message:
          'Membership activated successfully, but Player Card email could not be sent.',
        playerNumber,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Membership activated successfully.',
      playerNumber,
    })
  } catch (error) {
    console.error('Payment verification error:', error)

    return NextResponse.json(
      { error: 'Something went wrong.' },
      { status: 500 }
    )
  }
}