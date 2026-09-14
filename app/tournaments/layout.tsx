import { createClient } from '@/src/lib/supabase/server'
import PortalShell from '@/src/components/PortalShell'
import TennisAnimation from '@/src/components/TennisAnimation'
import Navbar from '@/app/components/Navbar'

export default async function TournamentsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <>
        <Navbar />
        {children}
      </>
    )
  }

  return (
    <div className="site-motion-shell">
      <TennisAnimation />
      <PortalShell mode="player">{children}</PortalShell>
    </div>
  )
}