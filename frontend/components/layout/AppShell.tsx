import Link from 'next/link'
import { ReactNode } from 'react'

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen mh-wood text-black">
      {/* Clean Mahogany Header */}
      <header className="mh-header">
        <div className="max-w-7xl mx-auto flex h-12 items-center justify-between px-6 relative z-10">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 bg-gradient-to-br from-amber-600 to-orange-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
              <span className="text-lg font-bold">CraftNexus</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
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
          <div className="flex items-center gap-2">
            <Link href="/login">
              <div className="px-3 py-1.5 text-sm font-medium hover:bg-gray-50 rounded-md transition-colors">
                Sign in
              </div>
            </Link>
            <Link href="/signup">
              <div className="px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-amber-600 to-orange-500 text-white rounded-md hover:shadow-md transition-all">
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
      <main className="flex-1 relative">
        {children}
      </main>

      {/* Clean Footer */}
      <footer className="mh-footer mt-auto">
        <div className="mh-divider-thick"></div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-gradient-to-br from-amber-600 to-orange-500 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <span className="text-lg font-bold">CraftNexus</span>
              </div>
              <p className="text-sm text-gray-600 max-w-md">
                The premier decentralized marketplace where skilled artisans connect with clients for handcrafted excellence.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Platform</h3>
              <div className="space-y-2 text-sm">
                <Link href="/projects" className="block hover:text-accent transition-colors">Browse Projects</Link>
                <Link href="/dashboard/freelancer" className="block hover:text-accent transition-colors">Freelancer Hub</Link>
                <Link href="/dashboard/client" className="block hover:text-accent transition-colors">Client Portal</Link>
                <Link href="/community" className="block hover:text-accent transition-colors">Community</Link>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Support</h3>
              <div className="space-y-2 text-sm">
                <Link href="/help" className="block hover:text-accent transition-colors">Help Center</Link>
                <Link href="/contact" className="block hover:text-accent transition-colors">Contact Us</Link>
                <Link href="/terms" className="block hover:text-accent transition-colors">Terms of Service</Link>
                <Link href="/privacy" className="block hover:text-accent transition-colors">Privacy Policy</Link>
              </div>
            </div>
          </div>
          
          <div className="mh-divider mt-8"></div>
          <div className="flex flex-col md:flex-row justify-between items-center mt-6 text-sm text-gray-600">
            <p>© {new Date().getFullYear()} CraftNexus. All rights reserved.</p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <span>Made with ❤️ for artisans worldwide</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
