import Head from 'next/head'
import { useState, useEffect } from 'react'
import AppShell from '../../../components/layout/AppShell'
import Link from 'next/link'

interface AnalyticsData {
  period_stats: {
    total_escrows: number
    completed_escrows: number
    cancelled_escrows: number
    disputed_escrows: number
    total_volume: string
    average_project_size: string
    completion_rate: number
  }
  trends: {
    date: string
    created: number
    completed: number
    disputed: number
    volume: string
  }[]
  dispute_analysis: {
    most_common_types: { type: string; count: number; percentage: number }[]
    resolution_times: { avg_hours: number; median_hours: number }
    client_vs_freelancer: { client_favor: number; freelancer_favor: number; split: number }
  }
  automation_stats: {
    automated_percentage: number
    auto_released_payments: number
    manual_interventions: number
    automation_success_rate: number
  }
  revenue_breakdown: {
    platform_fees: string
    dispute_fees: string
    premium_features: string
    total_revenue: string
  }
}

export default function EscrowAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('30d')
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/admin/escrow/analytics?range=${timeRange}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: 'csv' | 'pdf') => {
    try {
      setExportLoading(true)
      const response = await fetch(`/api/v1/admin/escrow/analytics/export?format=${format}&range=${timeRange}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to export report')
      }

      // Trigger download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `escrow-analytics-${timeRange}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(`Export failed: ${err.message}`)
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <AppShell>
      <Head>
        <title>Escrow Analytics - Admin</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Escrow Analytics</h1>
            <p className="text-gray-600">Comprehensive reporting and insights</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <div className="flex space-x-2">
              <button
                onClick={() => exportReport('csv')}
                disabled={exportLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Export CSV
              </button>
              <button
                onClick={() => exportReport('pdf')}
                disabled={exportLoading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Export PDF
              </button>
            </div>
            <Link
              href="/admin/escrow-management/dashboard"
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Error loading analytics: {error}</p>
            <button
              onClick={fetchAnalytics}
              className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded"
            >
              Retry
            </button>
          </div>
        ) : analytics ? (
          <>
            {/* Key Metrics */}
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Volume</dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {parseFloat(analytics.period_stats.total_volume).toLocaleString()} ETH
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600">Avg size:</span>
                    <span className="text-gray-900 ml-1 font-medium">
                      {parseFloat(analytics.period_stats.average_project_size).toLocaleString()} ETH
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Completion Rate</dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {analytics.period_stats.completion_rate.toFixed(1)}%
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm">
                    <span className="text-green-600 font-medium">{analytics.period_stats.completed_escrows}</span>
                    <span className="text-gray-500 ml-1">/ {analytics.period_stats.total_escrows} completed</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Automation Rate</dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {analytics.automation_stats.automated_percentage.toFixed(1)}%
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm">
                    <span className="text-purple-600 font-medium">{analytics.automation_stats.auto_released_payments}</span>
                    <span className="text-gray-500 ml-1">auto-released</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Platform Revenue</dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {parseFloat(analytics.revenue_breakdown.total_revenue).toLocaleString()} ETH
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm">
                    <span className="text-yellow-600 font-medium">
                      {parseFloat(analytics.revenue_breakdown.platform_fees).toLocaleString()}
                    </span>
                    <span className="text-gray-500 ml-1">from fees</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trends Chart Placeholder */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Escrow Activity Trends</h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    <p className="text-sm">Chart visualization would go here</p>
                    <p className="text-xs text-gray-400">
                      Shows {analytics.trends.length} data points over {timeRange}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dispute Analysis */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Dispute Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Most Common Types</h4>
                    <div className="space-y-2">
                      {analytics.dispute_analysis.most_common_types.slice(0, 3).map((type, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 capitalize">{type.type.replace('_', ' ')}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">{type.count}</span>
                            <span className="text-xs text-gray-500">({type.percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Resolution Performance</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Avg Resolution:</span>
                        <span className="ml-1 font-medium">{analytics.dispute_analysis.resolution_times.avg_hours}h</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Median:</span>
                        <span className="ml-1 font-medium">{analytics.dispute_analysis.resolution_times.median_hours}h</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Resolution Outcomes</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Client Favor:</span>
                        <span className="font-medium">{analytics.dispute_analysis.client_vs_freelancer.client_favor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Freelancer Favor:</span>
                        <span className="font-medium">{analytics.dispute_analysis.client_vs_freelancer.freelancer_favor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Split Decision:</span>
                        <span className="font-medium">{analytics.dispute_analysis.client_vs_freelancer.split}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Revenue Breakdown</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {parseFloat(analytics.revenue_breakdown.platform_fees).toLocaleString()} ETH
                    </div>
                    <div className="text-sm text-gray-500">Platform Fees</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {parseFloat(analytics.revenue_breakdown.dispute_fees).toLocaleString()} ETH
                    </div>
                    <div className="text-sm text-gray-500">Dispute Fees</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {parseFloat(analytics.revenue_breakdown.premium_features).toLocaleString()} ETH
                    </div>
                    <div className="text-sm text-gray-500">Premium Features</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {parseFloat(analytics.revenue_breakdown.total_revenue).toLocaleString()} ETH
                    </div>
                    <div className="text-sm text-gray-500">Total Revenue</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Insights */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    <div>
                      <div className="text-lg font-semibold text-blue-900">
                        {analytics.automation_stats.automation_success_rate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-blue-700">Automation Success Rate</div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path>
                    </svg>
                    <div>
                      <div className="text-lg font-semibold text-green-900">
                        {((analytics.period_stats.disputed_escrows / analytics.period_stats.total_escrows) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-green-700">Dispute Rate</div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                    </svg>
                    <div>
                      <div className="text-lg font-semibold text-purple-900">
                        {analytics.automation_stats.manual_interventions}
                      </div>
                      <div className="text-sm text-purple-700">Manual Interventions</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  )
}
