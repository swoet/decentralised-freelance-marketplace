import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Button } from './artisan-craft';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-neutral-50 border-b-2 border-mahogany-200 px-4 py-3 shadow-craft-soft">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href={user ? "/dashboard" : "/"} className="heading-craft text-2xl font-display font-bold text-mahogany-800 hover:text-copper-600 transition-colors">
            Artisan Marketplace
          </Link>
        
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/projects" className="body-craft text-copper-700 hover:text-mahogany-800 transition-colors">
              Browse Projects
            </Link>
            {user && (
              <Button variant="success" size="sm" shape="rounded">
                <Link href="/projects/create" className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Post Project
                </Link>
              </Button>
            )}
            <Link href="/community" className="body-craft text-copper-700 hover:text-mahogany-800 transition-colors">
              Community
            </Link>
            <Link href="/integrations" className="body-craft text-copper-700 hover:text-mahogany-800 transition-colors">
              Integrations
            </Link>
          </div>
        
        {/* Role-specific authenticated user navigation */}
        {user?.role === 'client' && (
          <Link href="/orgs" className="text-gray-700 hover:text-blue-600">Organizations</Link>
        )}
        {user?.role === 'admin' && (
          <>
            <Link href="/admin/ai-dashboard" className="text-gray-700 hover:text-blue-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Admin
            </Link>
            <Link href="/admin/analytics" className="text-gray-700 hover:text-blue-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics
            </Link>
            <Link href="/admin/reputation" className="text-gray-700 hover:text-blue-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Reputation
            </Link>
            <Link href="/admin/escrow" className="text-gray-700 hover:text-blue-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Escrow
            </Link>
          </>
        )}
      </div>
      
        <div className="flex items-center space-x-3">
          {user ? (
            /* Authenticated user menu */
            <>
              <Link href="/profile" className="body-craft text-copper-700 hover:text-mahogany-800 transition-colors">
                Profile
              </Link>
              <Button variant="ghost" size="sm" shape="rounded">
                <Link href="/wallet" className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Wallet
                </Link>
              </Button>
              <Button variant="secondary" size="sm" shape="rounded" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            /* Unauthenticated user menu */
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" shape="rounded">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary" size="sm" shape="wax">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
