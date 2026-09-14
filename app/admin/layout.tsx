import TennisAnimation from '@/src/components/TennisAnimation'
import PortalShell from '@/src/components/PortalShell'

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="site-motion-shell">
      <TennisAnimation />
      <PortalShell mode="admin">{children}</PortalShell>
    </div>
  )
}