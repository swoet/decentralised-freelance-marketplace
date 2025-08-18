import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard" className="font-bold text-xl text-blue-600">FreelanceX</Link>
        <Link href="/projects" className="text-gray-700 hover:text-blue-600">Projects</Link>
        {user?.role === 'client' && (
          <Link href="/orgs" className="text-gray-700 hover:text-blue-600">Organizations</Link>
        )}
        {user?.role === 'admin' && (
          <Link href="/admin" className="text-gray-700 hover:text-blue-600">Admin</Link>
        )}
      </div>
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <Link href="/profile" className="text-gray-700 hover:text-blue-600">Profile</Link>
            <button onClick={logout} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Logout</button>
          </>
        ) : (
          <Link href="/login" className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Login</Link>
        )}
      </div>
    </nav>
  );
} 