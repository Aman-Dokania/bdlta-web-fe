import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@/src/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Check logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in.' },
        { status: 401 }
      )
    }

    // Find player's profile
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select(`
        id,
        full_name,
        status,
        is_existing_member,
        existing_member_request_status
      `)
      .eq('user_id', user.id)
      .maybeSingle()

    if (playerError) {
      console.error(playerError)

      return NextResponse.json(
        { error: 'Could not find player profile.' },
        { status: 500 }
      )
    }

    if (!player) {
      return NextResponse.json(
        { error: 'Please complete player registration first.' },
        { status: 400 }
      )
    }

    // Already active
    if (player.status === 'active') {
      return NextResponse.json(
        { error: 'Your membership is already active.' },
        { status: 400 }
      )
    }

    // Existing member request is waiting for admin approval
    if (
      player.is_existing_member === true &&
      player.existing_member_request_status === 'pending'
    ) {
      return NextResponse.json(
        {
          error:
            'Your existing member request is pending admin approval. You do not need to pay the membership fee at this stage.',
        },
        { status: 400 }
      )
    }

    // Existing member request was rejected.
    // They are now allowed to apply as a new member and pay ₹1,000.
    if (
      player.is_existing_member === true &&
      player.existing_member_request_status === 'rejected'
    ) {
      // Allowed to continue with new membership payment.
    }

    // Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    // ₹1,000 = 100000 paise
    const order = await razorpay.orders.create({
      amount: 100000,
      currency: 'INR',
      receipt: `membership_${player.id}`,
      notes: {
        player_id: player.id,
        player_name: player.full_name,
        type: 'lifetime_membership',
      },
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error('Razorpay order error:', error)

    return NextResponse.json(
      { error: 'Unable to create payment order.' },
      { status: 500 }
    )
  }
}