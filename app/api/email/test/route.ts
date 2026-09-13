import { NextResponse } from 'next/server'
import { sendEmail } from '@/src/lib/email/resend'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const email = body.email

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required.' },
        { status: 400 }
      )
    }

    await sendEmail({
      to: email,
      subject: 'BDLTA Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>BDLTA Email Test</h2>

          <p>
            Congratulations! Your BDLTA email notification
            system is working correctly.
          </p>

          <p>
            This is a test email sent through Resend.
          </p>

          <p>
            Regards,<br />
            <strong>BDLTA</strong>
          </p>
        </div>
      `,
    })

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully.',
    })
  } catch (error) {
    console.error('Email test error:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to send test email.',
      },
      { status: 500 }
    )
  }
}