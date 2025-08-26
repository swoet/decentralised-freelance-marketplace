import Link from 'next/link'
import { ReactNode } from 'react'

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-bold">FreelanceX</Link>
            <nav className="hidden md:flex items-center gap-4 text-sm text-gray-600">
              <Link href="/projects" className="hover:text-gray-900">Projects</Link>
              <Link href="/dashboard/freelancer" className="hover:text-gray-900">Dashboard</Link>
              <Link href="/community" className="hover:text-gray-900">Community</Link>
              <Link href="/integrations" className="hover:text-gray-900">Integrations</Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-100">Sign in</Link>
            <Link href="/signup" className="px-3 py-1.5 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Sign up</Link>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
