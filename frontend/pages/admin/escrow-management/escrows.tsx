import Head from 'next/head'
import { useState, useEffect } from 'react'
import AppShell from '../../../components/layout/AppShell'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface AdminEscrow {
  id: string
  project_title: string
  client_name: string
  client_id: string
  freelancer_name: string
  freelancer_id: string
  total_amount: string
  released_amount: string
  currency_symbol: string
  status: string
  is_automated: boolean
  automation_enabled: boolean
  created_at: string
  updated_at: string
  milestone_count: number
  completed_milestones: number
  dispute_count: number
  last_activity: string
}

interface EscrowFilters {
  status?: string
  is_automated?: boolean
  has_disputes?: boolean
  min_amount?: number
  max_amount?: number
  created_after?: string
  search?: string
}

export default function AdminEscrows() {
  const [escrows, setEscrows] = useState<AdminEscrow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<EscrowFilters>({})
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedEscrows, setSelectedEscrows] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const pageSize = 20

  useEffect(() => {
    fetchEscrows()
  }, [page, filters])

  const fetchEscrows = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString()
      })

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/v1/admin/escrow/list?${params}`, {
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

  const performEscrowAction = async (escrowId: string, action: string, payload: any = {}) => {
    try {
      setActionLoading(`${action}-${escrowId}`)
      const response = await fetch(`/api/v1/admin/escrow/${escrowId}/actions/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || `Failed to ${action}`)
      }

      await fetchEscrows() // Refresh the list
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const performBulkAction = async (action: string) => {
    if (selectedEscrows.size === 0) return

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${selectedEscrows.size} escrow(s)?`
    )
    if (!confirmed) return

    try {
      setActionLoading(`bulk-${action}`)
      const response = await fetch(`/api/v1/admin/escrow/bulk-actions/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          escrow_ids: Array.from(selectedEscrows)
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || `Failed to ${action}`)
      }

      setSelectedEscrows(new Set())
      setShowBulkActions(false)
      await fetchEscrows()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSelectEscrow = (escrowId: string) => {
    const newSelected = new Set(selectedEscrows)
    if (newSelected.has(escrowId)) {
      newSelected.delete(escrowId)
    } else {
      newSelected.add(escrowId)
    }
    setSelectedEscrows(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }

  const handleSelectAll = () => {
    if (selectedEscrows.size === escrows.length) {
      setSelectedEscrows(new Set())
      setShowBulkActions(false)
    } else {
      setSelectedEscrows(new Set(escrows.map(e => e.id)))
      setShowBulkActions(true)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'dispute_raised': return 'bg-red-100 text-red-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      case 'frozen': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const canPerformAction = (escrow: AdminEscrow, action: string) => {
    switch (action) {
      case 'freeze':
        return escrow.status === 'active'
      case 'unfreeze':
        return escrow.status === 'frozen'
      case 'force_complete':
        return ['active', 'dispute_raised'].includes(escrow.status)
      case 'override_dispute':
        return escrow.status === 'dispute_raised'
      default:
        return true
    }
  }

  return (
    <AppShell>
      <Head>
        <title>Escrow Management - Admin</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Escrows</h1>
            <p className="text-gray-600">Manage and monitor all platform escrows</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/escrow-management/dashboard"
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/escrow-management/analytics"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              View Analytics
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={filters.search || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Project, client, or freelancer"
              />
            </div>
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
                <option value="frozen">Frozen</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Disputes</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={filters.has_disputes === undefined ? '' : filters.has_disputes.toString()}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  has_disputes: e.target.value === '' ? undefined : e.target.value === 'true' 
                }))}
              >
                <option value="">All</option>
                <option value="true">With Disputes</option>
                <option value="false">No Disputes</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({})
                  setPage(1)
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedEscrows.size} escrow(s) selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => performBulkAction('freeze')}
                  disabled={actionLoading === 'bulk-freeze'}
                  className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
                >
                  Freeze
                </button>
                <button
                  onClick={() => performBulkAction('unfreeze')}
                  disabled={actionLoading === 'bulk-unfreeze'}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
                >
                  Unfreeze
                </button>
                <button
                  onClick={() => setSelectedEscrows(new Set())}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Escrow Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
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
              <p>No escrows found matching your criteria.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedEscrows.size === escrows.length && escrows.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                      </th>
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
                        Last Activity
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
                          <input
                            type="checkbox"
                            checked={selectedEscrows.has(escrow.id)}
                            onChange={() => handleSelectEscrow(escrow.id)}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              <Link
                                href={`/admin/escrow-management/escrows/${escrow.id}`}
                                className="hover:text-indigo-600"
                              >
                                {escrow.project_title}
                              </Link>
                            </div>
                            <div className="text-xs text-gray-500">ID: {escrow.id.substring(0, 8)}...</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div><strong>Client:</strong> {escrow.client_name}</div>
                            <div><strong>Freelancer:</strong> {escrow.freelancer_name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {parseFloat(escrow.total_amount).toLocaleString()} {escrow.currency_symbol}
                          </div>
                          <div className="text-xs text-gray-500">
                            Released: {parseFloat(escrow.released_amount).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {escrow.completed_milestones} / {escrow.milestone_count} milestones
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-green-600 h-2 rounded-full"
                              style={{ 
                                width: `${escrow.milestone_count > 0 
                                  ? (escrow.completed_milestones / escrow.milestone_count) * 100 
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
                            {escrow.dispute_count > 0 && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                {escrow.dispute_count} dispute(s)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDistanceToNow(new Date(escrow.last_activity), { addSuffix: true })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2 justify-end">
                            <Link
                              href={`/admin/escrow-management/escrows/${escrow.id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View
                            </Link>
                            
                            {canPerformAction(escrow, 'freeze') && (
                              <button
                                onClick={() => performEscrowAction(escrow.id, 'freeze')}
                                disabled={actionLoading === `freeze-${escrow.id}`}
                                className="text-yellow-600 hover:text-yellow-900 disabled:text-gray-400"
                              >
                                Freeze
                              </button>
                            )}
                            
                            {canPerformAction(escrow, 'unfreeze') && (
                              <button
                                onClick={() => performEscrowAction(escrow.id, 'unfreeze')}
                                disabled={actionLoading === `unfreeze-${escrow.id}`}
                                className="text-green-600 hover:text-green-900 disabled:text-gray-400"
                              >
                                Unfreeze
                              </button>
                            )}
                            
                            {canPerformAction(escrow, 'override_dispute') && (
                              <button
                                onClick={() => performEscrowAction(escrow.id, 'override_dispute')}
                                disabled={actionLoading === `override_dispute-${escrow.id}`}
                                className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                              >
                                Override
                              </button>
                            )}
                          </div>
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
                    disabled={escrows.length < pageSize}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span> of{' '}
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
                        disabled={escrows.length < pageSize}
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
