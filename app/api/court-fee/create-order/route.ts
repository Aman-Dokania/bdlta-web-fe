import { NextResponse } from 'next/server'
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

    const feeMonth = body.feeMonth

    if (!feeMonth) {
      return NextResponse.json(
        { error: 'Fee month is required.' },
        { status: 400 }
      )
    }

    // Find player
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id, full_name, status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (playerError || !player) {
      return NextResponse.json(
        { error: 'Player profile not found.' },
        { status: 400 }
      )
    }

    // Only active players can pay court fees
    if (player.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active members can pay court fees.' },
        { status: 403 }
      )
    }

    // Check if this month is already paid
    const { data: existingFee } = await supabase
      .from('court_fee_payments')
      .select('id, status')
      .eq('player_id', player.id)
      .eq('fee_month', feeMonth)
      .maybeSingle()

    if (existingFee?.status === 'paid') {
      return NextResponse.json(
        { error: 'Court fee for this month is already paid.' },
        { status: 400 }
      )
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    // ₹2,000 = 200000 paise
    const order = await razorpay.orders.create({
      amount: 200000,
      currency: 'INR',
      receipt: `court_${player.id}_${feeMonth}`,
      notes: {
        player_id: player.id,
        fee_month: feeMonth,
        type: 'monthly_court_fee',
      },
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      feeMonth,
    })

  } catch (error) {
    console.error('Court fee order error:', error)

    return NextResponse.json(
      { error: 'Unable to create court fee order.' },
      { status: 500 }
    )
  }
}