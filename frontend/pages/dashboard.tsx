import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Loader from '@/components/Loader';
import Toast from '@/components/Toast';
import Head from 'next/head';
import {
  Button,
  ButtonGroup,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardBadge,
  Badge,
  StatusBadge,
  SkillBadge,
  BadgeGroup,
  Motion,
  Stagger
} from '@/components/artisan-craft';

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
    <div className="min-h-screen bg-neutral-50 bg-craft-texture">
      <Head>
        <title>{isPublicMode ? 'Marketplace Dashboard' : 'My Dashboard'} - Decentralized Freelance Marketplace</title>
        <meta name="description" content={isPublicMode ? 'Explore the freelance marketplace with real-time projects, community activity, and integrations' : 'Your personalized freelance dashboard'} />
        
        {/* Artisan Craft Fonts */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+Pro:wght@400;500&family=Crimson+Text:wght@400;600&display=swap" 
          rel="stylesheet"
        />
      </Head>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Motion preset="slideInDown" className="mb-8">
          <div className="space-y-4">
            <h1 className="heading-craft text-4xl text-mahogany-800">
              {isPublicMode ? 'Marketplace Overview' : `Welcome back, ${user?.full_name || user?.email || 'Professional'}!`}
            </h1>
            <p className="body-craft text-lg text-copper-700">
              {isPublicMode ? (
                <>Explore CraftNexus with real-time projects and community discussions. <Button variant="link" onClick={() => router.push('/login')}>Sign in</Button> for personalized content.</>
              ) : (
                <>Ready to craft something amazing today?</>
              )}
            </p>
            {user?.wallet_address && (
              <p className="body-craft text-sm text-bronze-600">
                Wallet: {`${user.wallet_address.substring(0, 6)}...${user.wallet_address.substring(user.wallet_address.length - 4)}`}
              </p>
            )}
            {isPublicMode && (
              <Card variant="parchment" className="p-4 border-2 border-gold-300">
                <div className="flex items-center gap-3">
                  <Badge variant="accent" size="sm" shape="wax">Preview</Badge>
                  <p className="body-craft text-sm text-mahogany-700">
                    You're viewing public data. 
                    <Button variant="link" onClick={() => router.push('/signup')} className="ml-1">
                      Create an account
                    </Button> 
                    to access personalized features.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </Motion>

        {error && <Toast message={error} type="error" onClose={() => setError(null)} />}

        {/* Stats Grid */}
        <Stagger staggerDelay={100} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card variant="leather" interactive="hover" className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="body-craft text-sm font-medium text-copper-700">
                  {isPublicMode ? 'Platform Projects' : 'My Projects'}
                </p>
                <p className="heading-craft text-3xl text-mahogany-800">
                  {dashboardData?.stats?.total_projects || 0}
                </p>
              </div>
              <Badge variant="primary" size="lg" shape="wax">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm4-4a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM7 8a1 1 0 000 2h.01a1 1 0 000-2H7z" clipRule="evenodd" />
                </svg>
              </Badge>
            </div>
          </Card>

          <Card variant="filled" interactive="hover" className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="body-craft text-sm font-medium text-copper-700">
                  Community Threads
                </p>
                <p className="heading-craft text-3xl text-mahogany-800">
                  {dashboardData?.stats?.active_threads || 0}
                </p>
              </div>
              <Badge variant="success" size="lg" shape="wax">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                </svg>
              </Badge>
            </div>
          </Card>

          <Card variant="parchment" interactive="hover" className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="body-craft text-sm font-medium text-copper-700">
                  Upcoming Events
                </p>
                <p className="heading-craft text-3xl text-mahogany-800">
                  {dashboardData?.stats?.upcoming_events || 0}
                </p>
              </div>
              <Badge variant="warning" size="lg" shape="wax">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </Badge>
            </div>
          </Card>

          <Card variant="elevated" interactive="hover" className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="body-craft text-sm font-medium text-copper-700">
                  Platform Activity
                </p>
                <p className="heading-craft text-2xl text-mahogany-800">
                  {dashboardData?.stats?.platform_activity || 'Active'}
                </p>
              </div>
              <Badge variant="accent" size="lg" shape="wax">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </Badge>
            </div>
          </Card>
        </Stagger>

        {/* Quick Actions */}
        <Motion preset="scaleIn" className="mb-8">
          <Card variant="default" className="p-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Jump into your most common tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <ButtonGroup spacing="lg">
                <Button 
                  variant="primary" 
                  size="lg" 
                  shape="rounded"
                  onClick={() => router.push('/projects')}
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  }
                >
                  Browse Projects
                </Button>
                <Button 
                  variant="accent" 
                  size="lg" 
                  shape="leaf"
                  onClick={() => router.push('/profile')}
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                >
                  Edit Profile
                </Button>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  shape="wax"
                  onClick={() => router.push('/messages')}
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  }
                >
                  View Messages
                </Button>
              </ButtonGroup>
            </CardContent>
          </Card>
        </Motion>

        {/* Recent Activity / Community Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Projects */}
          <Motion preset="slideInUp">
            <Card variant="leather" interactive="float" className="h-full">
              <CardHeader divided>
                <CardTitle>
                  {isPublicMode ? 'Featured Projects' : 'Recent Projects'}
                </CardTitle>
                <CardDescription>
                  {isPublicMode ? 'Discover exciting opportunities' : 'Your latest project activity'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData?.projects?.featured_projects?.length || dashboardData?.projects?.user_projects?.length ? (
                  <div className="space-y-4">
                    {(dashboardData.projects.featured_projects || dashboardData.projects.user_projects || []).slice(0, 3).map((project, index) => (
                      <Motion key={project.id} preset="fadeIn" transition={{ delay: index * 100 }}>
                        <div className="border-l-4 border-gold-500 pl-4 py-2 hover:bg-mahogany-50 rounded-r-organic-gentle transition-colors duration-gentle">
                          <h4 className="heading-craft text-lg font-semibold text-mahogany-800 truncate">
                            {project.title}
                          </h4>
                          <p className="body-craft text-sm text-copper-700 mt-1 line-clamp-2">
                            {project.description}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <Badge variant="success" size="sm" shape="rounded">
                              {project.budget_range}
                            </Badge>
                            <span className="body-craft text-xs text-bronze-600">
                              {new Date(project.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </Motion>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl opacity-20 mb-4">📋</div>
                    <p className="body-craft text-bronze-600">No projects available yet.</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="ghost" fullWidth onClick={() => router.push('/projects')}>
                  View All Projects →
                </Button>
              </CardFooter>
            </Card>
          </Motion>

          {/* Community Activity */}
          <Motion preset="slideInUp" transition={{ delay: 200 }}>
            <Card variant="parchment" interactive="float" className="h-full">
              <CardHeader divided>
                <CardTitle>Community Activity</CardTitle>
                <CardDescription>Latest discussions and conversations</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData?.community?.recent_threads?.length ? (
                  <div className="space-y-4">
                    {dashboardData.community.recent_threads.slice(0, 4).map((thread, index) => (
                      <Motion key={thread.id} preset="fadeIn" transition={{ delay: (index + 3) * 100 }}>
                        <div className="border-l-4 border-forest-500 pl-4 py-2 hover:bg-neutral-50 rounded-r-organic-gentle transition-colors duration-gentle">
                          <h4 className="heading-craft text-base font-semibold text-mahogany-800">
                            {thread.title}
                          </h4>
                          <BadgeGroup className="mt-2">
                            {thread.tags?.slice(0, 3).map((tag) => (
                              <SkillBadge key={tag} size="sm">
                                {tag}
                              </SkillBadge>
                            ))}
                          </BadgeGroup>
                          <span className="body-craft text-xs text-bronze-600 mt-2 block">
                            {new Date(thread.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </Motion>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl opacity-20 mb-4">💬</div>
                    <p className="body-craft text-bronze-600">No community activity yet.</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="ghost" fullWidth onClick={() => router.push('/community')}>
                  Join Community →
                </Button>
              </CardFooter>
            </Card>
          </Motion>
        </div>
      </div>
    </div>
  );
}
