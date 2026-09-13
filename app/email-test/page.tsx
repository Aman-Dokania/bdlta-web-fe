'use client'

import { useState } from 'react'

export default function EmailTestPage() {
  const [email, setEmail] = useState('abcaman234@gmail.com')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const sendTestEmail = async () => {
    try {
      setLoading(true)
      setMessage('')

      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email.')
      }

      setMessage('✅ Test email sent successfully!')
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `❌ ${error.message}`
          : '❌ Something went wrong.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-lg rounded-lg bg-white p-8 shadow">

        <h1 className="text-2xl font-bold">
          BDLTA Email Test
        </h1>

        <p className="mt-2 text-gray-600">
          Send a test email through Resend.
        </p>

        <div className="mt-6">
          <label className="mb-2 block font-medium">
            Email Address
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <button
          onClick={sendTestEmail}
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Test Email'}
        </button>

        {message && (
          <div className="mt-5 rounded-lg bg-gray-100 p-4 text-center">
            {message}
          </div>
        )}

      </div>
    </main>
  )
}