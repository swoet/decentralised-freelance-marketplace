import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Loader from '@/components/Loader';
import Toast from '@/components/Toast';
import Head from 'next/head';

interface DashboardData {
  user: {
    authenticated: boolean;
    preview_mode: boolean;
  };
  projects: {
    featured_projects?: Array<{
      id: string;
      title: string;
      description: string;
      budget_range: string;
      created_at: string;
    }>;
    user_projects?: Array<{
      id: string;
      title: string;
      description: string;
      budget_range: string;
      status: string;
      created_at: string;
    }>;
    recommended_projects?: Array<{
      id: string;
      title: string;
      description: string;
      budget_range: string;
      created_at: string;
    }>;
  };
  community: {
    recent_threads: Array<{
      id: string;
      title: string;
      tags: string[];
      created_at: string;
    }>;
    upcoming_events: Array<{
      id: string;
      title: string;
      starts_at: string;
      is_online: boolean;
      is_free: boolean;
      category: string;
    }>;
  };
  integrations: {
    connected_count?: number;
    available_providers: Array<{
      name: string;
      description: string;
      category: string;
    }> | string[];
  };
  stats: {
    total_projects: number;
    active_threads: number;
    upcoming_events: number;
    platform_activity: string;
  };
}

export default function Dashboard() {
  const { user, token, loading } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const isPublicMode = !user || !token;

  const fetchDashboardData = useCallback(async () => {
    try {
      setDataLoading(true);
      setError(null);
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';
      const headers: Record<string, string> = {};
      
      // Add auth header if user is logged in
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Call the new dashboard API with preview mode for anonymous users
      const response = await fetch(`${API_URL}/dashboard?preview=${isPublicMode}`, {
        headers,
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: DashboardData = await response.json();
      setDashboardData(data);
      
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err?.message || 'Failed to load dashboard data');
    } finally {
      setDataLoading(false);
    }
  }, [isPublicMode, token]);

  useEffect(() => {
    // Always load dashboard data (public or authenticated)
    fetchDashboardData();
  }, [fetchDashboardData]);

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

  // Allow public mode (preview) to continue rendering
  // Only redirect if we're not in public mode and there's no user/token

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{isPublicMode ? 'Marketplace Dashboard' : 'My Dashboard'} - Decentralized Freelance Marketplace</title>
        <meta name="description" content={isPublicMode ? 'Explore the freelance marketplace with real-time projects, community activity, and integrations' : 'Your personalized freelance dashboard'} />
      </Head>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isPublicMode ? 'Marketplace Overview' : 'My Dashboard'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isPublicMode ? (
              <>Discover the latest projects, community discussions, and integrations. <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link> for personalized content.</>
            ) : (
              <>Welcome back, {user?.full_name || user?.email || 'User'}!</>
            )}
          </p>
          {user?.wallet_address && (
            <p className="mt-1 text-sm text-gray-500">
              Wallet: {`${user.wallet_address.substring(0, 6)}...${user.wallet_address.substring(user.wallet_address.length - 4)}`}
            </p>
          )}
          {isPublicMode && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                🎯 <strong>Preview Mode:</strong> You&apos;re viewing public data. <Link href="/signup" className="underline hover:no-underline">Create an account</Link> to access personalized features.
              </p>
            </div>
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
                <p className="text-sm font-medium text-gray-500">
                  {isPublicMode ? 'Platform Projects' : 'My Projects'}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData?.stats?.total_projects || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {isPublicMode ? 'Active Discussions' : 'Community Threads'}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData?.stats?.active_threads || 0}
                </p>
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
                <p className="text-sm font-medium text-gray-500">
                  {isPublicMode ? 'Upcoming Events' : 'Total Earnings'}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isPublicMode ? (dashboardData?.stats?.upcoming_events || 0) : '$0'}
                </p>
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
                <p className="text-sm font-medium text-gray-500">
                  {isPublicMode ? 'Platform Activity' : 'Accepted Bids'}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isPublicMode ? (dashboardData?.stats?.platform_activity || 'Moderate') : '0'}
                </p>
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

        {/* Recent Activity / Community Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {isPublicMode ? 'Featured Projects' : 'Recent Projects'}
            </h2>
            {dashboardData?.projects?.featured_projects?.length || dashboardData?.projects?.user_projects?.length ? (
              <div className="space-y-4">
                {(dashboardData.projects.featured_projects || dashboardData.projects.user_projects || []).slice(0, 3).map((project) => (
                  <div key={project.id} className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-medium text-gray-900 truncate">{project.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-medium text-green-600">{project.budget_range}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No projects available.</div>
            )}
          </div>

          {/* Community Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Community Activity</h2>
            {dashboardData?.community?.recent_threads?.length ? (
              <div className="space-y-4">
                {dashboardData.community.recent_threads.slice(0, 4).map((thread) => (
                  <div key={thread.id} className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-medium text-gray-900">{thread.title}</h3>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {thread.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 mt-1 block">
                      {new Date(thread.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No community activity.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
