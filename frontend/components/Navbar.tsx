import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard" className="font-bold text-xl text-blue-600">FreelanceX</Link>
        
        {/* Always show these links for all users */}
        <Link href="/projects" className="text-gray-700 hover:text-blue-600">Projects</Link>
        <Link href="/community" className="text-gray-700 hover:text-blue-600">Community</Link>
        <Link href="/integrations" className="text-gray-700 hover:text-blue-600">Integrations</Link>
        <Link href="/about" className="text-gray-700 hover:text-blue-600">About</Link>
        
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
