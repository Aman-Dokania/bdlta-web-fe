'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/src/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error.message)
      return
    }

    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="portal-logout rounded-lg px-3 py-2 text-sm font-semibold transition"
    >
      Sign out
    </button>
  )
}