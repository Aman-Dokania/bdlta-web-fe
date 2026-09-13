import { Resend } from 'resend'
import { generatePlayerCard } from '@/src/lib/player-card/generatePlayerCard'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL =
  process.env.EMAIL_FROM || 'BDLTA <onboarding@resend.dev>'

type PlayerCardEmailData = {
  email: string
  player: {
    fullName: string
    playerNumber: string
    gender?: string | null
    dateOfBirth?: string | null
    phone?: string | null
    membershipType?: string | null
    membershipStartDate?: string | null
    photoBytes?: Uint8Array | null
    photoContentType?: string | null
  }
}

export async function sendPlayerCardEmail({
  email,
  player,
}: PlayerCardEmailData) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured.')
  }

  if (!email) {
    throw new Error('Player email address is not available.')
  }

  const pdfBytes = await generatePlayerCard(player)

  const pdfBuffer = Buffer.from(pdfBytes)

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Your BDLTA Digital Player Card - ${player.playerNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Your BDLTA Digital Player Card</h2>

        <p>Hello <strong>${player.fullName}</strong>,</p>

        <p>
          Your BDLTA Digital Player Card is attached to this email.
        </p>

        <p>
          <strong>Player ID:</strong> ${player.playerNumber}<br />
          <strong>Membership:</strong> Lifetime
        </p>

        <p>
          Please keep this PDF safely for your records.
        </p>

        <p>
          Regards,<br />
          <strong>BDLTA</strong>
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `BDLTA-Player-Card-${player.playerNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  })

  if (error) {
    console.error('Resend Player Card error:', error)
    throw new Error(error.message || 'Failed to send Player Card email.')
  }

  return data
}