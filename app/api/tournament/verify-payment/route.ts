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
      registration_id,
    } = body

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !registration_id
    ) {
      return NextResponse.json(
        { error: 'Missing payment information.' },
        { status: 400 }
      )
    }

    // Verify Razorpay signature
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

    // Get logged-in player
    const { data: player, error: playerError } =
      await supabase
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

    if (player.status !== 'active') {
      return NextResponse.json(
        {
          error:
            'Only active members can register for tournaments.',
        },
        { status: 403 }
      )
    }

    // Get registration
    const { data: registration, error: registrationError } =
      await supabase
        .from('tournament_registrations')
        .select(`
          id,
          player_id,
          tournament_id,
          category_id,
          status,
          tournament_categories (
            id,
            name,
            entry_fee
          ),
          tournaments (
            id,
            name,
            status
          )
        `)
        .eq('id', registration_id)
        .maybeSingle()

    if (registrationError || !registration) {
      return NextResponse.json(
        { error: 'Tournament registration not found.' },
        { status: 404 }
      )
    }

    // Registration must belong to logged-in player
    if (registration.player_id !== player.id) {
      return NextResponse.json(
        {
          error:
            'You are not authorized for this registration.',
        },
        { status: 403 }
      )
    }

    if (registration.status !== 'pending_payment') {
      return NextResponse.json(
        {
          error:
            'This registration is not awaiting payment.',
        },
        { status: 400 }
      )
    }

    const category =
      Array.isArray(registration.tournament_categories)
        ? registration.tournament_categories[0]
        : registration.tournament_categories

    const tournament =
      Array.isArray(registration.tournaments)
        ? registration.tournaments[0]
        : registration.tournaments

    if (!category) {
      return NextResponse.json(
        { error: 'Tournament category not found.' },
        { status: 400 }
      )
    }

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found.' },
        { status: 400 }
      )
    }

    if (tournament.status !== 'registration_open') {
      return NextResponse.json(
        {
          error:
            'Tournament registration is no longer open.',
        },
        { status: 400 }
      )
    }

    const entryFee = Number(category.entry_fee)

    if (!Number.isFinite(entryFee) || entryFee <= 0) {
      return NextResponse.json(
        { error: 'Invalid tournament entry fee.' },
        { status: 400 }
      )
    }

    // Verify payment directly with Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    const payment =
      await razorpay.payments.fetch(
        razorpay_payment_id
      )

    // Payment must belong to the correct order
    if (payment.order_id !== razorpay_order_id) {
      return NextResponse.json(
        {
          error:
            'Payment does not match the order.',
        },
        { status: 400 }
      )
    }

    // Verify exact amount
    const expectedAmount = Math.round(
      entryFee * 100
    )

    if (
      payment.amount !== expectedAmount ||
      payment.currency !== 'INR'
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid payment amount.',
        },
        { status: 400 }
      )
    }

    // Payment must be successful
    if (
      payment.status !== 'captured' &&
      payment.status !== 'authorized'
    ) {
      return NextResponse.json(
        {
          error:
            'Payment has not been successfully completed.',
        },
        { status: 400 }
      )
    }

    // Securely confirm registration and save payment
    const { error: confirmationError } =
      await supabase.rpc(
        'confirm_tournament_payment',
        {
          p_registration_id: registration.id,
          p_order_id: razorpay_order_id,
          p_payment_id: razorpay_payment_id,
          p_signature: razorpay_signature,
          p_amount: entryFee,
        }
      )

    if (confirmationError) {
      console.error(
        'Tournament registration confirmation error:',
        confirmationError
      )

      return NextResponse.json(
        {
          error:
            'Payment succeeded, but registration confirmation failed.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message:
        'Tournament registration confirmed successfully.',
      registrationId: registration.id,
      tournamentName: tournament.name,
      categoryName: category.name,
    })
  } catch (error) {
    console.error(
      'Tournament payment verification error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Unable to verify tournament payment.',
      },
      { status: 500 }
    )
  }
}