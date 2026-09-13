import { NextResponse } from 'next/server'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { createClient } from '@/src/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in.' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      fee_month,
    } = body

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !fee_month
    ) {
      return NextResponse.json(
        { error: 'Missing payment information.' },
        { status: 400 }
      )
    }

    // Verify Razorpay signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Payment verification failed.' },
        { status: 400 }
      )
    }

    // Find the logged-in player's profile
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

    if (player.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active members can pay court fees.' },
        { status: 403 }
      )
    }

    // Verify the payment/order with Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    const payment = await razorpay.payments.fetch(razorpay_payment_id)

    if (payment.order_id !== razorpay_order_id) {
      return NextResponse.json(
        { error: 'Payment does not match the order.' },
        { status: 400 }
      )
    }

    if (payment.amount !== 200000 || payment.currency !== 'INR') {
      return NextResponse.json(
        { error: 'Invalid payment amount.' },
        { status: 400 }
      )
    }

    if (
      payment.status !== 'captured' &&
      payment.status !== 'authorized'
    ) {
      return NextResponse.json(
        { error: 'Payment has not been successfully completed.' },
        { status: 400 }
      )
    }

    // Securely mark the current month's court fee as paid
    const { error: activationError } = await supabase.rpc(
      'activate_court_fee_payment',
      {
        p_player_id: player.id,
        p_fee_month: fee_month,
        p_order_id: razorpay_order_id,
        p_payment_id: razorpay_payment_id,
        p_signature: razorpay_signature,
      }
    )

    if (activationError) {
      console.error('Court fee activation error:', activationError)

      return NextResponse.json(
        { error: activationError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Court fee paid successfully.',
    })
  } catch (error) {
    console.error('Court fee verification error:', error)

    return NextResponse.json(
      { error: 'Unable to verify court fee payment.' },
      { status: 500 }
    )
  }
}