import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard" className="font-bold text-xl text-blue-600">FreelanceX</Link>
        
        {/* Always show these links for all users */}
        <Link href="/projects" className="text-gray-700 hover:text-blue-600">Browse Projects</Link>
        {user && (
          <Link href="/projects/create" className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Post Project
          </Link>
        )}
        <Link href="/ai-match" className="text-gray-700 hover:text-blue-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI Match
        </Link>
        <Link href="/community" className="text-gray-700 hover:text-blue-600">Community</Link>
        <Link href="/integrations" className="text-gray-700 hover:text-blue-600">Integrations</Link>
        
        {/* Role-specific authenticated user navigation */}
        {user?.role === 'client' && (
          <Link href="/orgs" className="text-gray-700 hover:text-blue-600">Organizations</Link>
        )}
        {user?.role === 'admin' && (
          <Link href="/admin/dashboard" className="text-gray-700 hover:text-blue-600">AI Admin</Link>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        {user ? (
          /* Authenticated user menu */
          <>
            <Link href="/wallet" className="bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Wallet
            </Link>
            <Link href="/profile" className="text-gray-700 hover:text-blue-600">Profile</Link>
            <Link href="/security" className="text-gray-700 hover:text-blue-600">Security</Link>
            <button 
              onClick={logout} 
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          /* Unauthenticated user menu */
          <>
            <Link 
              href="/login" 
              className="text-gray-700 hover:text-blue-600 px-3 py-1 rounded transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
