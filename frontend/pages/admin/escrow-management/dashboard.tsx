import Head from 'next/head'
import { useState, useEffect } from 'react'
import AppShell from '../../../components/layout/AppShell'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface EscrowMetrics {
  total_escrows: number
  active_escrows: number
  completed_escrows: number
  disputed_escrows: number
  total_value_locked: string
  total_value_released: string
  average_completion_time: number
  automation_percentage: number
}

interface RecentActivity {
  id: string
  type: 'created' | 'completed' | 'disputed' | 'released'
  escrow_id: string
  project_title: string
  amount?: string
  timestamp: string
  details?: string
}

interface DisputeStats {
  open_disputes: number
  resolved_disputes: number
  average_resolution_time: number
  most_common_type: string
}

export default function AdminEscrowDashboard() {
  const [metrics, setMetrics] = useState<EscrowMetrics | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [disputeStats, setDisputeStats] = useState<DisputeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    fetchDashboardData()
  }, [timeRange])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch metrics
      const metricsResponse = await fetch(`/api/v1/admin/escrow/metrics?range=${timeRange}`, {
        credentials: 'include'
      })
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setMetrics(metricsData)
      }

      // Fetch recent activity
      const activityResponse = await fetch(`/api/v1/admin/escrow/activity?limit=10`, {
        credentials: 'include'
      })
      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setRecentActivity(activityData.activities || [])
      }

      // Fetch dispute stats
      const disputeResponse = await fetch(`/api/v1/admin/escrow/dispute-stats?range=${timeRange}`, {
        credentials: 'include'
      })
      if (disputeResponse.ok) {
        const disputeData = await disputeResponse.json()
        setDisputeStats(disputeData)
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
      case 'completed':
        return <div className="w-2 h-2 bg-green-400 rounded-full"></div>
      case 'disputed':
        return <div className="w-2 h-2 bg-red-400 rounded-full"></div>
      case 'released':
        return <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'created': return 'text-blue-600'
      case 'completed': return 'text-green-600'
      case 'disputed': return 'text-red-600'
      case 'released': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <AppShell>
      <Head>
        <title>Escrow Management Dashboard - Admin</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Escrow Management Dashboard</h1>
            <p className="text-gray-600">Monitor and manage all smart escrows across the platform</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <Link
              href="/admin/escrow-management/escrows"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              View All Escrows
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Error loading dashboard: {error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path>
                          <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Escrows</dt>
                        <dd className="text-2xl font-semibold text-gray-900">{metrics.total_escrows.toLocaleString()}</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center text-sm">
                      <span className="text-green-600 font-medium">{metrics.active_escrows}</span>
                      <span className="text-gray-500 ml-1">active</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Value Locked</dt>
                        <dd className="text-2xl font-semibold text-gray-900">{parseFloat(metrics.total_value_locked).toLocaleString()} ETH</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center text-sm">
                      <span className="text-gray-600">{parseFloat(metrics.total_value_released).toLocaleString()} ETH</span>
                      <span className="text-gray-500 ml-1">released</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Disputes</dt>
                        <dd className="text-2xl font-semibold text-gray-900">{metrics.disputed_escrows}</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center text-sm">
                      <span className="text-red-600 font-medium">
                        {disputeStats ? disputeStats.open_disputes : 0}
                      </span>
                      <span className="text-gray-500 ml-1">active</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Automation</dt>
                        <dd className="text-2xl font-semibold text-gray-900">{metrics.automation_percentage.toFixed(1)}%</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center text-sm">
                      <span className="text-gray-600">
                        {Math.round(metrics.average_completion_time / 24)}d
                      </span>
                      <span className="text-gray-500 ml-1">avg completion</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                    <Link href="/admin/escrow-management/activity" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                      View all
                    </Link>
                  </div>
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {recentActivity.map((activity, index) => (
                        <li key={activity.id}>
                          <div className="relative pb-8">
                            {index !== recentActivity.length - 1 && (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                            )}
                            <div className="relative flex space-x-3">
                              <div className="flex items-center justify-center">
                                {getActivityIcon(activity.type)}
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-sm text-gray-900">
                                    <span className={`font-medium ${getActivityColor(activity.type)}`}>
                                      {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                                    </span>
                                    {' '}escrow for{' '}
                                    <Link href={`/admin/escrow-management/escrows/${activity.escrow_id}`} className="font-medium text-gray-900 hover:text-indigo-600">
                                      {activity.project_title}
                                    </Link>
                                    {activity.amount && (
                                      <span className="text-gray-600"> ({activity.amount} ETH)</span>
                                    )}
                                  </p>
                                  {activity.details && (
                                    <p className="text-sm text-gray-500">{activity.details}</p>
                                  )}
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Alerts */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link
                      href="/admin/escrow-management/disputes"
                      className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                        </svg>
                        <span className="text-sm font-medium">Resolve Disputes</span>
                      </div>
                      {disputeStats && disputeStats.open_disputes > 0 && (
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                          {disputeStats.open_disputes}
                        </span>
                      )}
                    </Link>

                    <Link
                      href="/admin/escrow-management/automation"
                      className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
                        </svg>
                        <span className="text-sm font-medium">Automation Rules</span>
                      </div>
                    </Link>

                    <Link
                      href="/admin/escrow-management/analytics"
                      className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path>
                        </svg>
                        <span className="text-sm font-medium">View Analytics</span>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* System Status */}
                {disputeStats && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Dispute Resolution</span>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {disputeStats.average_resolution_time}h avg
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Most Common Issue</span>
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {disputeStats.most_common_type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">System Health</span>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                          <span className="text-sm font-medium text-green-600">Operational</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
