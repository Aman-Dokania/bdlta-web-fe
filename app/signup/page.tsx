'use client'

import { useState } from 'react'
import { supabase } from '@/src/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGoogleSignup() {
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setMessage('Creating your account...')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    /*
     * If email confirmation is disabled, the user will already
     * be logged in and can continue to player registration.
     */
    if (data.session) {
      router.push('/player/register')
      return
    }

    /*
     * If email confirmation is enabled, Supabase won't give us
     * a session yet.
     */
    setMessage(
      'Account created! Please check your email to confirm your account.'
    )

    setLoading(false)
  }

  return (
    <main className="signup-motion-page min-h-screen bg-gray-100 px-6 py-12">

      <div className="mx-auto max-w-md">

        {/* Header */}

        <div className="mb-8 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-700 font-bold text-white">
            LOGO
          </div>

          <h1 className="mt-5 text-3xl font-bold">
            Join BDLTA
          </h1>

          <p className="mt-2 text-gray-500">
            Create your player account and become a
            member of the Bhagalpur District Lawn Tennis Association.
          </p>

        </div>

        {/* Signup card */}

        <div className="rounded-xl bg-white p-6 shadow">

          <form
            onSubmit={handleSignup}
            className="space-y-4"
          >

            <div>
              <label className="mb-1 block text-sm font-medium">
                Full name
              </label>

              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-green-600"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Email
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-green-600"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Password
              </label>

              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-green-600"
                required
                minLength={6}
              />

              <p className="mt-1 text-xs text-gray-500">
                Minimum 6 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-green-700 p-3 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
            >
              {loading
                ? 'Creating account...'
                : 'Create Player Account'}
            </button>

          </form>

          {/* Divider */}

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-gray-300" />
            <span className="text-sm text-gray-500">
              OR
            </span>
            <span className="h-px flex-1 bg-gray-300" />
          </div>

          {/* Google */}

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full rounded-lg border p-3 font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Continue with Google
          </button>

          {/* Message */}

          {message && (
            <div className="mt-5 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
              {message}
            </div>
          )}

        </div>

        {/* Login */}

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-green-700 hover:underline"
          >
            Log in
          </Link>
        </p>

        <p className="mt-3 text-center text-sm text-gray-500">
          <Link href="/" className="font-medium text-green-700 hover:underline">
            Back to homepage
          </Link>
        </p>

        {/* Membership information */}

        <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-5">

          <h2 className="font-semibold text-green-900">
            BDLTA Lifetime Membership
          </h2>

          <p className="mt-2 text-sm text-green-800">
            After creating your account, complete your player
            profile and pay the ₹1,000 lifetime membership fee.
            Your player account will then be activated automatically.
          </p>

        </div>

      </div>

    </main>
  )
}