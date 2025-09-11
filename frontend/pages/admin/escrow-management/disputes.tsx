import Head from 'next/head'
import { useState, useEffect } from 'react'
import AppShell from '../../../components/layout/AppShell'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface AdminDispute {
  id: string
  escrow_id: string
  project_title: string
  dispute_type: string
  title: string
  description: string
  disputed_amount: string
  currency_symbol: string
  priority: string
  status: string
  raised_by: string
  raised_by_name: string
  raised_at: string
  mediator_assigned?: string
  mediator_assigned_at?: string
  resolved_at?: string
  resolution_notes?: string
  evidence_urls: string[]
  client_name: string
  freelancer_name: string
  last_activity: string
}

interface DisputeResolution {
  decision: 'client_favor' | 'freelancer_favor' | 'split_decision' | 'escalate'
  resolution_notes: string
  client_payout: string
  freelancer_payout: string
  platform_fee_adjustment?: string
}

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState<AdminDispute[]>([])
  const [selectedDispute, setSelectedDispute] = useState<AdminDispute | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [resolutionForm, setResolutionForm] = useState<DisputeResolution>({
    decision: 'client_favor',
    resolution_notes: '',
    client_payout: '',
    freelancer_payout: '',
    platform_fee_adjustment: ''
  })
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    fetchDisputes()
  }, [filter])

  const fetchDisputes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/admin/disputes?status=${filter}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch disputes')
      }

      const data = await response.json()
      setDisputes(data.disputes || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const assignMediator = async (disputeId: string, mediatorId?: string) => {
    try {
      const response = await fetch(`/api/v1/admin/disputes/${disputeId}/assign-mediator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mediator_id: mediatorId || null })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to assign mediator')
      }

      await fetchDisputes()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const resolveDispute = async (disputeId: string) => {
    if (!resolutionForm.resolution_notes.trim()) {
      alert('Please provide resolution notes')
      return
    }

    try {
      setResolving(true)
      const response = await fetch(`/api/v1/admin/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...resolutionForm,
          client_payout: parseFloat(resolutionForm.client_payout) || 0,
          freelancer_payout: parseFloat(resolutionForm.freelancer_payout) || 0,
          platform_fee_adjustment: parseFloat(resolutionForm.platform_fee_adjustment || '0')
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to resolve dispute')
      }

      setSelectedDispute(null)
      setResolutionForm({
        decision: 'client_favor',
        resolution_notes: '',
        client_payout: '',
        freelancer_payout: '',
        platform_fee_adjustment: ''
      })
      await fetchDisputes()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setResolving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800'
      case 'assigned': return 'bg-blue-100 text-blue-800'
      case 'in_review': return 'bg-purple-100 text-purple-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'escalated': return 'bg-red-100 text-red-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'urgent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AppShell>
      <Head>
        <title>Dispute Resolution - Admin</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dispute Resolution</h1>
            <p className="text-gray-600">Review and resolve platform disputes</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Disputes</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
            </select>
            <Link
              href="/admin/escrow-management/dashboard"
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium"
            >
              Dashboard
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Disputes List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Active Disputes</h2>
              </div>
              
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading disputes...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-600">
                  <p>Error: {error}</p>
                  <button
                    onClick={fetchDisputes}
                    className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded"
                  >
                    Retry
                  </button>
                </div>
              ) : disputes.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No disputes found.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {disputes.map((dispute) => (
                    <div
                      key={dispute.id}
                      className={`p-6 cursor-pointer hover:bg-gray-50 ${
                        selectedDispute?.id === dispute.id ? 'bg-blue-50 border-l-4 border-indigo-500' : ''
                      }`}
                      onClick={() => setSelectedDispute(dispute)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-sm font-medium text-gray-900">{dispute.title}</h3>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(dispute.status)}`}>
                              {dispute.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(dispute.priority)}`}>
                              {dispute.priority.toUpperCase()}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">{dispute.project_title}</p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Amount: {dispute.disputed_amount} {dispute.currency_symbol}</span>
                            <span>Raised by: {dispute.raised_by_name}</span>
                            <span>{formatDistanceToNow(new Date(dispute.raised_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                        
                        {dispute.status === 'open' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              assignMediator(dispute.id, 'current_admin')
                            }}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                          >
                            Assign to Me
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dispute Details & Resolution */}
          <div className="space-y-6">
            {selectedDispute ? (
              <>
                {/* Dispute Details */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Dispute Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Type & Priority</div>
                      <div className="flex space-x-2 mt-1">
                        <span className="text-sm text-gray-900 capitalize">{selectedDispute.dispute_type.replace('_', ' ')}</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedDispute.priority)}`}>
                          {selectedDispute.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-500">Description</div>
                      <p className="text-sm text-gray-900 mt-1">{selectedDispute.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-500">Client</div>
                        <div className="text-sm text-gray-900">{selectedDispute.client_name}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">Freelancer</div>
                        <div className="text-sm text-gray-900">{selectedDispute.freelancer_name}</div>
                      </div>
                    </div>

                    {selectedDispute.evidence_urls.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-2">Evidence</div>
                        <div className="space-y-1">
                          {selectedDispute.evidence_urls.map((url, index) => (
                            <div key={index}>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                              >
                                Evidence #{index + 1}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resolution Form */}
                {['open', 'assigned', 'in_review'].includes(selectedDispute.status) && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Resolve Dispute</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Decision</label>
                        <select
                          value={resolutionForm.decision}
                          onChange={(e) => setResolutionForm(prev => ({ 
                            ...prev, 
                            decision: e.target.value as any 
                          }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                          <option value="client_favor">In Client&apos;s Favor</option>
                          <option value="freelancer_favor">In Freelancer&apos;s Favor</option>
                          <option value="split_decision">Split Decision</option>
                          <option value="escalate">Escalate to Senior Admin</option>
                        </select>
                      </div>

                      {resolutionForm.decision !== 'escalate' && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Client Payout ({selectedDispute.currency_symbol})
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={resolutionForm.client_payout}
                                onChange={(e) => setResolutionForm(prev => ({ 
                                  ...prev, 
                                  client_payout: e.target.value 
                                }))}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Freelancer Payout ({selectedDispute.currency_symbol})
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={resolutionForm.freelancer_payout}
                                onChange={(e) => setResolutionForm(prev => ({ 
                                  ...prev, 
                                  freelancer_payout: e.target.value 
                                }))}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                placeholder="0.00"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Platform Fee Adjustment (Optional)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={resolutionForm.platform_fee_adjustment}
                              onChange={(e) => setResolutionForm(prev => ({ 
                                ...prev, 
                                platform_fee_adjustment: e.target.value 
                              }))}
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              placeholder="0.00"
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Notes *</label>
                        <textarea
                          rows={4}
                          value={resolutionForm.resolution_notes}
                          onChange={(e) => setResolutionForm(prev => ({ 
                            ...prev, 
                            resolution_notes: e.target.value 
                          }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="Explain your decision and reasoning..."
                          required
                        />
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={() => resolveDispute(selectedDispute.id)}
                          disabled={resolving || !resolutionForm.resolution_notes.trim()}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md font-medium"
                        >
                          {resolving ? 'Resolving...' : 'Resolve Dispute'}
                        </button>
                        <button
                          onClick={() => setSelectedDispute(null)}
                          disabled={resolving}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link
                      href={`/admin/escrow-management/escrows/${selectedDispute.escrow_id}`}
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      View Escrow Details
                    </Link>
                    
                    {selectedDispute.status === 'open' && (
                      <button
                        onClick={() => assignMediator(selectedDispute.id)}
                        className="w-full flex items-center justify-center px-4 py-2 border border-indigo-300 rounded-md text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                      >
                        Assign to Me
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No dispute selected</h3>
                  <p className="mt-1 text-sm text-gray-500">Select a dispute from the list to review and resolve it.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
