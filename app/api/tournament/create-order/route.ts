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

    const registrationId = body.registrationId

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required.' },
        { status: 400 }
      )
    }

    // Get the logged-in player's ID
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

    // Get registration + category + tournament
    const { data: registration, error: registrationError } =
      await supabase
        .from('tournament_registrations')
        .select(`
          id,
          player_id,
          status,
          tournament_id,
          category_id,
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
        .eq('id', registrationId)
        .maybeSingle()

    if (registrationError || !registration) {
      return NextResponse.json(
        { error: 'Tournament registration not found.' },
        { status: 404 }
      )
    }

    // Make sure this registration belongs to the logged-in player
    if (registration.player_id !== player.id) {
      return NextResponse.json(
        { error: 'You are not authorized for this registration.' },
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

    const tournament =
      Array.isArray(registration.tournaments)
        ? registration.tournaments[0]
        : registration.tournaments

    const category =
      Array.isArray(registration.tournament_categories)
        ? registration.tournament_categories[0]
        : registration.tournament_categories

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found.' },
        { status: 400 }
      )
    }

    if (tournament.status !== 'registration_open') {
      return NextResponse.json(
        { error: 'Tournament registration is closed.' },
        { status: 400 }
      )
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Tournament category not found.' },
        { status: 400 }
      )
    }

    const entryFee = Number(category.entry_fee)

    if (!Number.isFinite(entryFee) || entryFee < 0) {
      return NextResponse.json(
        { error: 'Invalid tournament entry fee.' },
        { status: 400 }
      )
    }

    // Razorpay amount is in paise
    const amountInPaise = Math.round(entryFee * 100)

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `tournament_${registration.id}`,
      notes: {
        registration_id: registration.id,
        player_id: player.id,
        tournament_id: tournament.id,
        category_id: category.id,
        type: 'tournament_entry_fee',
      },
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      registrationId: registration.id,
      tournamentName: tournament.name,
      categoryName: category.name,
    })
  } catch (error) {
    console.error(
      'Tournament payment order error:',
      error
    )

    return NextResponse.json(
      { error: 'Unable to create tournament payment order.' },
      { status: 500 }
    )
  }
}