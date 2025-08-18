import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Loader from '@/components/Loader';
import Toast from '@/components/Toast';

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalEarnings: number;
  totalBids: number;
  acceptedBids: number;
}

type ActivityItem = {
  id: string;
  type: 'project' | 'bid' | 'message' | 'payment';
  title: string;
  subtitle?: string;
  time?: string;
  createdAtMs: number;
};

export default function Dashboard() {
  const { user, token, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    // If no user or token, redirect to login
    if (!loading && (!user || !token)) {
      router.push('/login');
      return;
    }

    if (user && token) {
      fetchDashboardData();
    }
  }, [user, token, loading, router]);

  const fetchDashboardData = async () => {
    try {
      setDataLoading(true);
      // Derive simple stats from available endpoints; default to 0 if unavailable
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const [projectsRes, bidsRes] = await Promise.all([
        fetch(`${API_URL}/projects/?limit=50`, { headers }).catch(() => null),
        fetch(`${API_URL}/bids/`, { headers }).catch(() => null),
      ]);

      const projectsJson = projectsRes && projectsRes.ok ? await projectsRes.json() : [];
      const bidsJson = bidsRes && bidsRes.ok ? await bidsRes.json() : [];
      const totalBids = Array.isArray(bidsJson) ? bidsJson.length : 0;

      const computed: DashboardStats = {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalEarnings: 0,
        totalBids,
        acceptedBids: 0,
      };
      setStats(computed);

      // Build recent activity from projects and bids
      const projectItems: ActivityItem[] = (Array.isArray(projectsJson) ? projectsJson : []).map((p: any) => {
        const ts = Date.parse(p.created_at || p.createdAt || '') || 0;
        return {
          id: String(p.id || Math.random()),
          type: 'project',
          title: 'Project created',
          subtitle: String(p.title || ''),
          time: ts ? new Date(ts).toLocaleString() : undefined,
          createdAtMs: ts,
        };
      });
      const bidItems: ActivityItem[] = (Array.isArray(bidsJson) ? bidsJson : []).map((b: any) => {
        const ts = Date.parse(b.created_at || b.createdAt || '') || 0;
        const amount = typeof b.amount === 'number' ? b.amount : Number(b.amount || 0);
        return {
          id: String(b.id || Math.random()),
          type: 'bid',
          title: 'Bid submitted',
          subtitle: `$${amount || 0} on project ${b.project_id || ''}`,
          time: ts ? new Date(ts).toLocaleString() : undefined,
          createdAtMs: ts,
        };
      });
      const combined = [...projectItems, ...bidItems]
        .sort((a, b) => b.createdAtMs - a.createdAtMs)
        .slice(0, 5);
      setActivity(combined);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setDataLoading(false);
    }
  };

  // Show loading while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Show loading while fetching dashboard data
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader />
          </div>
        </div>
      </div>
    );
  }

  // If no user, redirect to login (this should be handled by useEffect, but just in case)
  if (!user || !token) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user?.full_name || user?.email || 'User'}!
          </p>
          {user?.wallet_address && (
            <p className="mt-1 text-sm text-gray-500">
              Wallet: {`${user.wallet_address.substring(0, 6)}...${user.wallet_address.substring(user.wallet_address.length - 4)}`}
            </p>
          )}
        </div>

        {error && <Toast message={error} type="error" onClose={() => setError(null)} />}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Projects</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.totalProjects || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Projects</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.activeProjects || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                <p className="text-2xl font-semibold text-gray-900">${stats?.totalEarnings?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Accepted Bids</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.acceptedBids || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/projects')}
              className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Browse Projects
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Edit Profile
            </button>
            <button
              onClick={() => router.push('/messages')}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              View Messages
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {!activity.length && (
            <div className="text-gray-500 text-sm">No recent activity.</div>
          )}
          <div className="space-y-4">
            {activity.map((a) => (
              <div key={a.id} className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${a.type === 'project' ? 'bg-green-100' : a.type === 'bid' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <svg className={`w-4 h-4 ${a.type === 'project' ? 'text-green-600' : a.type === 'bid' ? 'text-blue-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{a.title}</p>
                  {a.subtitle && <p className="text-sm text-gray-500">{a.subtitle}</p>}
                </div>
                <div className="text-sm text-gray-500">{a.time || ''}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
