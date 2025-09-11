import Head from 'next/head'
import { useState, useEffect } from 'react'
import AppShell from '../../components/layout/AppShell'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface SmartEscrow {
  id: string
  project_title?: string
  client_name?: string
  freelancer_name?: string
  total_amount: string
  currency_symbol?: string
  status: string
  milestone_count?: number
  completed_milestones?: number
  created_at: string
  is_automated: boolean
  automation_enabled: boolean
}

interface EscrowFilters {
  status?: string
  is_automated?: boolean
  project_id?: string
}

export default function SmartEscrowDashboard() {
  const [escrows, setEscrows] = useState<SmartEscrow[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<EscrowFilters>({})
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const fetchEscrows = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '20'
      })

      if (filters.status) params.append('status', filters.status)
      if (filters.is_automated !== undefined) params.append('is_automated', filters.is_automated.toString())
      if (filters.project_id) params.append('project_id', filters.project_id)

      const response = await fetch(`/api/v1/smart-escrow?${params}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch escrows')
      }

      const data = await response.json()
      setEscrows(data.escrows || [])
      setTotalCount(data.total_count || 0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEscrows()
  }, [page, filters])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'dispute_raised': return 'bg-red-100 text-red-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <AppShell>
      <Head>
        <title>Smart Escrow Dashboard</title>
      </Head>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Smart Escrow Dashboard</h1>
          <Link 
            href="/smart-escrow/create"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Create Smart Escrow
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Total Escrows</div>
            <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Active Escrows</div>
            <div className="text-2xl font-bold text-green-600">
              {escrows.filter(e => e.status === 'active').length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Automated</div>
            <div className="text-2xl font-bold text-blue-600">
              {escrows.filter(e => e.is_automated).length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">In Dispute</div>
            <div className="text-2xl font-bold text-red-600">
              {escrows.filter(e => e.status === 'dispute_raised').length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={filters.status || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="dispute_raised">In Dispute</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Automation</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={filters.is_automated === undefined ? '' : filters.is_automated.toString()}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  is_automated: e.target.value === '' ? undefined : e.target.value === 'true' 
                }))}
              >
                <option value="">All Types</option>
                <option value="true">Automated</option>
                <option value="false">Manual</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({})}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Escrow List */}
        <div className="bg-white shadow rounded-lg">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading escrows...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">
              <p>Error: {error}</p>
              <button
                onClick={fetchEscrows}
                className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded"
              >
                Retry
              </button>
            </div>
          ) : escrows.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No escrows found.</p>
              <Link
                href="/smart-escrow/create"
                className="mt-2 inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
              >
                Create Your First Smart Escrow
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parties
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {escrows.map((escrow) => (
                      <tr key={escrow.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {escrow.project_title || 'Untitled Project'}
                            </div>
                            <div className="text-xs text-gray-500">ID: {escrow.id.substring(0, 8)}...</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div><strong>Client:</strong> {escrow.client_name || 'Unknown'}</div>
                            <div><strong>Freelancer:</strong> {escrow.freelancer_name || 'Unknown'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {parseFloat(escrow.total_amount).toLocaleString()} {escrow.currency_symbol || 'ETH'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {escrow.completed_milestones || 0} / {escrow.milestone_count || 0} milestones
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full"
                              style={{ 
                                width: `${(escrow.milestone_count || 0) > 0 
                                  ? ((escrow.completed_milestones || 0) / (escrow.milestone_count || 1)) * 100 
                                  : 0}%` 
                              }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(escrow.status)}`}>
                              {escrow.status.replace('_', ' ').toUpperCase()}
                            </span>
                            {escrow.is_automated && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                🤖 AUTO
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDistanceToNow(new Date(escrow.created_at), { addSuffix: true })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/smart-escrow/${escrow.id}`}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            View
                          </Link>
                          <Link
                            href={`/smart-escrow/${escrow.id}/manage`}
                            className="text-green-600 hover:text-green-900"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={escrows.length < 20}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(page - 1) * 20 + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(page * 20, totalCount)}</span> of{' '}
                      <span className="font-medium">{totalCount}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={escrows.length < 20}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}
