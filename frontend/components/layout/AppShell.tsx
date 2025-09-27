import Link from 'next/link'
import { ReactNode } from 'react'

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-30 border-b bg-white shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-amber-900 hover:text-amber-600 transition-colors">
              <span className="font-serif">CraftNexus</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/projects" className="text-orange-700 hover:text-amber-900 transition-colors">Projects</Link>
              <Link href="/dashboard/freelancer" className="text-orange-700 hover:text-amber-900 transition-colors">Dashboard</Link>
              <Link href="/community" className="text-orange-700 hover:text-amber-900 transition-colors">Community</Link>
              <Link href="/integrations" className="text-orange-700 hover:text-amber-900 transition-colors">Integrations</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-medium rounded-lg border border-amber-200 text-amber-900 hover:bg-amber-50 transition-colors">Sign in</Link>
            <Link href="/signup" className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-amber-600 to-orange-500 text-white hover:from-amber-700 hover:to-orange-600 transition-all transform hover:scale-105 shadow-md">Sign up</Link>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
