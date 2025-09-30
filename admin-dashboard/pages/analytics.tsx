import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminLayout from '../components/AdminLayout';
import { useAdminAuth } from '../context/AdminAuthContext';

interface RevenueAnalytics {
  total_revenue: number;
  daily_breakdown: Record<string, number>;
  by_transaction_type: Record<string, number>;
  period_days: number;
}

interface UserAnalytics {
  total_users: number;
  by_role: Record<string, number>;
  new_users_30d: number;
  active_users: number;
  inactive_users: number;
}

interface ProjectAnalytics {
  total_projects: number;
  by_status: Record<string, number>;
  new_projects_30d: number;
  average_budget: number;
}

export default function Analytics() {
  const { admin, token, isLoading } = useAdminAuth();
  const router = useRouter();
  
  const [revenueData, setRevenueData] = useState<RevenueAnalytics | null>(null);
  const [userData, setUserData] = useState<UserAnalytics | null>(null);
  const [projectData, setProjectData] = useState<ProjectAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [revenuePeriod, setRevenuePeriod] = useState(30);

  useEffect(() => {
    if (!isLoading && !admin) {
      router.push('/login');
      return;
    }
    
    if (admin && token) {
      fetchAnalytics();
    }
  }, [admin, token, isLoading, router, revenuePeriod]);

  const fetchAnalytics = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const [revenueRes, userRes, projectRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/analytics/revenue?days=${revenuePeriod}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/analytics/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/analytics/projects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (revenueRes.ok) {
        const data = await revenueRes.json();
        setRevenueData(data);
      }

      if (userRes.ok) {
        const data = await userRes.json();
        setUserData(data);
      }

      if (projectRes.ok) {
        const data = await projectRes.json();
        setProjectData(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <AdminLayout title="Analytics">
      <Head>
        <title>Analytics - Admin Dashboard</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into platform performance</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Revenue Analytics */}
            {revenueData && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Revenue Analytics</h2>
                  <select
                    value={revenuePeriod}
                    onChange={(e) => setRevenuePeriod(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600">Total Revenue</p>
                        <p className="text-3xl font-bold text-green-900 mt-2">
                          {formatCurrency(revenueData.total_revenue)}
                        </p>
                        <p className="text-xs text-green-600 mt-1">{revenuePeriod} days period</p>
                      </div>
                      <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Daily Average</p>
                        <p className="text-3xl font-bold text-blue-900 mt-2">
                          {formatCurrency(revenueData.total_revenue / revenuePeriod)}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">Per day</p>
                      </div>
                      <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600">Transaction Types</p>
                        <p className="text-3xl font-bold text-purple-900 mt-2">
                          {Object.keys(revenueData.by_transaction_type).length}
                        </p>
                        <p className="text-xs text-purple-600 mt-1">Categories</p>
                      </div>
                      <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Revenue by Transaction Type */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Transaction Type</h3>
                  <div className="space-y-3">
                    {Object.entries(revenueData.by_transaction_type).map(([type, amount]) => {
                      const percentage = (amount / revenueData.total_revenue) * 100;
                      return (
                        <div key={type}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700 capitalize">{type.replace('_', ' ')}</span>
                            <span className="text-gray-600">{formatCurrency(amount)} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* User Analytics */}
            {userData && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">User Analytics</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-600">Total Users</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">{userData.total_users.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-600">Active Users</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">{userData.active_users.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-purple-600">New Users (30d)</p>
                    <p className="text-2xl font-bold text-purple-900 mt-1">{userData.new_users_30d.toLocaleString()}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-yellow-600">Inactive Users</p>
                    <p className="text-2xl font-bold text-yellow-900 mt-1">{userData.inactive_users.toLocaleString()}</p>
                  </div>
                </div>

                {/* Users by Role */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Users by Role</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(userData.by_role).map(([role, count]) => {
                      const percentage = (count / userData.total_users) * 100;
                      const colors: Record<string, string> = {
                        client: 'from-blue-500 to-blue-600',
                        freelancer: 'from-green-500 to-green-600',
                        admin: 'from-purple-500 to-purple-600',
                        super_admin: 'from-red-500 to-red-600',
                      };
                      return (
                        <div key={role} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {role.replace('_', ' ')}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r ${colors[role] || 'from-gray-500 to-gray-600'} text-white`}>
                              {count}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`bg-gradient-to-r ${colors[role] || 'from-gray-500 to-gray-600'} h-2 rounded-full`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}%</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Project Analytics */}
            {projectData && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Project Analytics</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-indigo-600">Total Projects</p>
                    <p className="text-2xl font-bold text-indigo-900 mt-1">{projectData.total_projects.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-600">New Projects (30d)</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">{projectData.new_projects_30d.toLocaleString()}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-yellow-600">Average Budget</p>
                    <p className="text-2xl font-bold text-yellow-900 mt-1">{formatCurrency(projectData.average_budget)}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-purple-600">Completion Rate</p>
                    <p className="text-2xl font-bold text-purple-900 mt-1">
                      {projectData.total_projects > 0
                        ? ((projectData.by_status.completed || 0) / projectData.total_projects * 100).toFixed(1)
                        : '0.0'}%
                    </p>
                  </div>
                </div>

                {/* Projects by Status */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Projects by Status</h3>
                  <div className="space-y-3">
                    {Object.entries(projectData.by_status).map(([status, count]) => {
                      const percentage = (count / projectData.total_projects) * 100;
                      const colors: Record<string, string> = {
                        active: 'from-blue-500 to-blue-600',
                        completed: 'from-green-500 to-green-600',
                        cancelled: 'from-red-500 to-red-600',
                        pending: 'from-yellow-500 to-yellow-600',
                      };
                      return (
                        <div key={status}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700 capitalize">{status}</span>
                            <span className="text-gray-600">{count} projects ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`bg-gradient-to-r ${colors[status] || 'from-gray-500 to-gray-600'} h-2 rounded-full`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Additional Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Health</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">User Activity Rate</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {userData ? ((userData.active_users / userData.total_users) * 100).toFixed(1) : '0'}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Project Success Rate</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {projectData && projectData.total_projects > 0
                        ? ((projectData.by_status.completed || 0) / projectData.total_projects * 100).toFixed(1)
                        : '0'}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Growth Rate (30d)</span>
                    <span className="text-sm font-semibold text-green-600">
                      +{userData?.new_users_30d || 0} users
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Insights</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Avg Revenue per User</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {revenueData && userData
                        ? formatCurrency(revenueData.total_revenue / userData.total_users)
                        : '$0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Avg Revenue per Project</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {revenueData && projectData && projectData.total_projects > 0
                        ? formatCurrency(revenueData.total_revenue / projectData.total_projects)
                        : '$0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Revenue Trend</span>
                    <span className="text-sm font-semibold text-green-600">
                      ↑ Growing
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
