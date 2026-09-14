'use client'

import { useState } from 'react'
import { supabase } from '@/src/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGoogleLogin() {
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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)
    setMessage('Signing you in...')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setMessage('Login succeeded, but the user session could not be loaded.')
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      setMessage(profileError.message)
      setLoading(false)
      return
    }

    if (!profile) {
      setMessage('Your account has no profile record.')
      setLoading(false)
      return
    }

    const role = profile.role?.toLowerCase().replace(/[-\s]/g, '_')
    setMessage('Login successful!')

    router.push(
      role === 'admin' || role === 'super_admin'
        ? '/admin/dashboard'
        : '/'
    )
  }

  return (
    <main className="login-motion-page relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-100 px-6 py-12">
      <form
        onSubmit={handleLogin}
        className="relative z-10 w-full max-w-md space-y-4"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-700 text-lg font-black text-white shadow-lg">
            B
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-green-700">
            Bhagalpur District Lawn Tennis Association
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage your BDLTA player account.
          </p>
        </div>

        <label htmlFor="email" className="sr-only">Email</label>
        <input
          id="email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border p-3"
          required
        />

        <label htmlFor="password" className="sr-only">Password</label>
        <input
          id="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border p-3"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black p-3 font-semibold text-white shadow-sm disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Login'}
        </button>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full rounded-lg border p-3 font-medium disabled:opacity-60"
        >
          Continue with Google
        </button>

        <p className="pt-2 text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-semibold text-green-700 hover:underline">
            Create account
          </Link>
        </p>
        <p className="text-center text-sm text-slate-500">
          <Link href="/" className="font-medium text-green-700 hover:underline">
            Back to homepage
          </Link>
        </p>
        {message && (
          <p className="rounded-lg bg-green-50 p-3 text-center text-sm text-green-800">
            {message}
          </p>
        )}
      </form>
    </main>
  )
}