import Link from 'next/link'
import { ReactNode } from 'react'

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col mh-wood text-black">
      {/* Clean Mahogany Header */}
      <header className="mh-header">
        <div className="max-w-7xl mx-auto flex h-8 items-center justify-between px-3 relative z-10">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
              <div className="w-4 h-4 bg-gradient-to-br from-amber-600 to-orange-500 rounded flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
              <span className="text-sm font-bold">CraftNexus</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-3">
            <Link href="/projects" className="text-sm font-medium hover:text-accent transition-colors">
              Projects
            </Link>
            <Link href="/dashboard/freelancer" className="text-sm font-medium hover:text-accent transition-colors">
              Dashboard
            </Link>
            <Link href="/community" className="text-sm font-medium hover:text-accent transition-colors">
              Community
            </Link>
            <Link href="/integrations" className="text-sm font-medium hover:text-accent transition-colors">
              Integrations
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-1.5">
            <Link href="/login">
              <div className="px-2 py-0.5 text-sm font-medium hover:bg-gray-50 rounded transition-colors">
                Sign in
              </div>
            </Link>
            <Link href="/signup">
              <div className="px-2 py-0.5 text-sm font-medium bg-gradient-to-r from-amber-600 to-orange-500 text-white rounded hover:shadow-md transition-all">
                Sign up
              </div>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        <div className="mh-divider"></div>
      </header>

      {/* Content area */}
      <main className="flex-1 relative px-6 py-8">
        {children}
      </main>

      {/* Compact Footer */}
      <footer className="mh-footer mt-auto">
        <div className="mh-divider-thick"></div>
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="font-medium">CraftNexus</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
            <span>Made with ❤️ for artisans worldwide</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
