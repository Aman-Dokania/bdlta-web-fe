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
      className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
    >
      Logout
    </button>
  )
}