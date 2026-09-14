'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from './LogoutButton'

type PortalMode = 'admin' | 'player'

const navigation = {
  admin: [
    { href: '/admin/dashboard', label: 'Overview', icon: '⌂' },
    { href: '/admin/players', label: 'Players', icon: '◉' },
    { href: '/admin/memberships', label: 'Memberships', icon: '◆' },
    { href: '/admin/tournaments', label: 'Tournaments', icon: '▦' },
    { href: '/admin/payments', label: 'Payments', icon: '₹' },
    { href: '/admin/reports', label: 'Reports', icon: '↗' },
    { href: '/admin/announcements', label: 'Announcements', icon: '!' },
  ],
  player: [
    { href: '/player/dashboard', label: 'Overview', icon: '⌂' },
    { href: '/player/profile', label: 'My profile', icon: '◉' },
    { href: '/player/membership', label: 'Membership', icon: '◆' },
    { href: '/player/court-fees', label: 'Court fees', icon: '₹' },
    { href: '/player/card', label: 'Player card', icon: '▣' },
    { href: '/tournaments', label: 'Tournaments', icon: '▦' },
  ],
} satisfies Record<PortalMode, { href: string; label: string; icon: string }[]>

export default function PortalShell({
  children,
  mode,
}: Readonly<{ children: React.ReactNode; mode: PortalMode }>) {
  const pathname = usePathname()
  const links = navigation[mode]
  const title = mode === 'admin' ? 'Operations' : 'Player space'
  const subtitle = mode === 'admin' ? 'BDLTA admin' : 'BDLTA member'

  return (
    <div className="portal-shell relative z-10">
      <aside className="portal-sidebar">
        <Link href={mode === 'admin' ? '/admin/dashboard' : '/player/dashboard'} className="portal-brand">
          <span className="portal-brand-mark">B</span>
          <span>
            <strong>BDLTA</strong>
            <small>{subtitle}</small>
          </span>
        </Link>

        <div className="portal-section-label">{title}</div>
        <nav className="portal-nav" aria-label={`${title} navigation`}>
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== `/${mode}/dashboard` && pathname.startsWith(`${link.href}/`))
            return (
              <Link key={link.href} href={link.href} className={`portal-nav-link${active ? ' is-active' : ''}`}>
                <span className="portal-nav-icon" aria-hidden="true">{link.icon}</span>
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="portal-sidebar-footer">
          <Link href="/" className="portal-back-link">← Public website</Link>
          <LogoutButton />
        </div>
      </aside>

      <div className="portal-content">
        <div className="portal-mobile-bar">
          <Link href={mode === 'admin' ? '/admin/dashboard' : '/player/dashboard'} className="portal-brand">
            <span className="portal-brand-mark">B</span>
            <span><strong>BDLTA</strong><small>{subtitle}</small></span>
          </Link>
          <LogoutButton />
        </div>
        <div className="portal-mobile-nav" aria-label={`${title} navigation`}>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={pathname === link.href ? 'is-active' : ''}>
              <span aria-hidden="true">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
        {children}
      </div>
    </div>
  )
}