import Link from 'next/link'
import { ReactNode } from 'react'

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen mh-wood text-black">
      {/* Header */}
      <header className="mh-header">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="logo">
              <span className="font-serif">CraftNexus</span>
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
              <Link href="/projects" className="transition-colors">Projects</Link>
              <Link href="/dashboard/freelancer" className="transition-colors">Dashboard</Link>
              <Link href="/community" className="transition-colors">Community</Link>
              <Link href="/integrations" className="transition-colors">Integrations</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="mh-btn mh-btn-ghost">Sign in</Link>
            <Link href="/signup" className="mh-btn mh-btn-primary">Sign up</Link>
          </div>
        </div>
      </header>
      {/* Content area on clean parchment surface */}
      <main className="container mx-auto px-4 py-8 mh-surface">
        {children}
      </main>
      <footer className="mh-footer mt-8">
        <div className="container mx-auto px-4 py-6 text-sm text-black/80">
          © {new Date().getFullYear()} CraftNexus. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
