'use client'

import { usePathname } from 'next/navigation'
import TennisAnimation from './TennisAnimation'

export default function SiteMotionShell({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()

  if (
    pathname === '/' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/player')
  ) {
    return children
  }

  return (
    <div className="site-motion-shell">
      <TennisAnimation />
      <div className="relative z-10">{children}</div>
    </div>
  )
}