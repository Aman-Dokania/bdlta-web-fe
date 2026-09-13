import { createClient } from '@/src/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('OAuth callback error:', error.message)

    return NextResponse.redirect(
      `${origin}/login?error=oauth_callback_failed`
    )
  }

  // Get the logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`)
  }

  // Get their role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile) {
    return NextResponse.redirect(
      `${origin}/login?error=profile_not_found`
    )
  }

  const role = profile.role?.toLowerCase().replace(/[-\s]/g, '_')

  // Send them to the correct dashboard
  if (role === 'admin' || role === 'super_admin') {
    return NextResponse.redirect(`${origin}/admin/dashboard`)
  }

  return NextResponse.redirect(`${origin}/player/dashboard`)
}