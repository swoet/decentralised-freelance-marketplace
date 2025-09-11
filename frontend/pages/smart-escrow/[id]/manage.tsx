import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import AppShell from '../../../components/layout/AppShell'
import SmartMilestoneCard from '../../../components/smart-escrow/SmartMilestoneCard'
import DisputeModal from '../../../components/smart-escrow/DisputeModal'
import { formatDistanceToNow } from 'date-fns'

interface SmartEscrow {
  id: string
  project_title?: string
  client_name?: string
  freelancer_name?: string
  total_amount: string
  released_amount: string
  disputed_amount: string
  currency_symbol?: string
  status: string
  is_automated: boolean
  automation_enabled: boolean
  auto_release_delay_hours: number
  quality_threshold: number
  created_at: string
  updated_at?: string
  activated_at?: string
  completed_at?: string
}

interface SmartMilestone {
  id: string
  title: string
  description: string
  amount: string
  order_index: number
  status: string
  milestone_type: string
  is_automated: boolean
  auto_release_enabled: boolean
  approval_required: boolean
  due_date?: string
  auto_release_date?: string
  created_at: string
  submitted_at?: string
  approved_at?: string
  released_at?: string
}

interface AutomationEvent {
  id: string
  event_type: string
  event_name: string
  description: string
  success: boolean
  created_at: string
}

export default function ManageSmartEscrow() {
  const router = useRouter()
  const { id } = router.query
  
  const [escrow, setEscrow] = useState<SmartEscrow | null>(null)
  const [milestones, setMilestones] = useState<SmartMilestone[]>([])
  const [automationEvents, setAutomationEvents] = useState<AutomationEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('milestones')
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchEscrowData = async () => {
    if (!id) return
    
    try {
      setLoading(true)
      
      // Fetch escrow details
      const escrowResponse = await fetch(`/api/v1/smart-escrow/${id}`, {
        credentials: 'include'
      })
      if (!escrowResponse.ok) throw new Error('Failed to fetch escrow')
      const escrowData = await escrowResponse.json()
      setEscrow(escrowData)

      // Fetch milestones
      const milestonesResponse = await fetch(`/api/v1/smart-escrow/${id}/milestones`, {
        credentials: 'include'
      })
      if (!milestonesResponse.ok) throw new Error('Failed to fetch milestones')
      const milestonesData = await milestonesResponse.json()
      setMilestones(milestonesData.milestones || [])

      // Fetch automation events
      const eventsResponse = await fetch(`/api/v1/smart-escrow/${id}/automation-events`, {
        credentials: 'include'
      })
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        setAutomationEvents(eventsData || [])
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEscrowData()
  }, [id])

  const handleProcessAutomation = async () => {
    if (!escrow) return
    
    setActionLoading('automation')
    try {
      const response = await fetch(`/api/v1/smart-escrow/${escrow.id}/process-automation`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (!response.ok) throw new Error('Failed to process automation')
      
      await fetchEscrowData() // Refresh data
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReleaseFunds = async () => {
    if (!escrow) return
    
    setActionLoading('release')
    try {
      const response = await fetch(`/api/v1/smart-escrow/${escrow.id}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          release_notes: 'Manual release triggered',
          force_release: false
        })
      })
      
      if (!response.ok) throw new Error('Failed to release funds')
      
      await fetchEscrowData() // Refresh data
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

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

  const completedMilestones = milestones.filter(m => m.status === 'completed').length
  const progressPercentage = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AppShell>
    )
  }

  if (!escrow) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Escrow Not Found</h1>
          <p className="mt-2 text-gray-600">The escrow you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Head>
        <title>Manage Smart Escrow - {escrow.project_title || escrow.id}</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {escrow.project_title || 'Untitled Project'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">Escrow ID: {escrow.id}</p>
              <div className="flex items-center mt-2 space-x-4">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(escrow.status)}`}>
                  {escrow.status.replace('_', ' ').toUpperCase()}
                </span>
                {escrow.is_automated && (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    🤖 AUTOMATED
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleProcessAutomation}
                disabled={actionLoading === 'automation'}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {actionLoading === 'automation' ? 'Processing...' : 'Process Automation'}
              </button>
              
              <button
                onClick={handleReleaseFunds}
                disabled={actionLoading === 'release' || escrow.status === 'completed'}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {actionLoading === 'release' ? 'Releasing...' : 'Release Funds'}
              </button>
              
              <button
                onClick={() => setShowDisputeModal(true)}
                disabled={escrow.status === 'completed'}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Raise Dispute
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Total Amount</div>
            <div className="text-2xl font-bold text-gray-900">
              {parseFloat(escrow.total_amount).toLocaleString()} {escrow.currency_symbol || 'ETH'}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Released</div>
            <div className="text-2xl font-bold text-green-600">
              {parseFloat(escrow.released_amount).toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Progress</div>
            <div className="text-2xl font-bold text-blue-600">
              {progressPercentage.toFixed(1)}%
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Milestones</div>
            <div className="text-2xl font-bold text-gray-900">
              {completedMilestones} / {milestones.length}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium text-gray-900">Project Progress</h3>
            <span className="text-sm text-gray-500">{progressPercentage.toFixed(1)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-600">{error}</div>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-800 hover:text-red-900 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('milestones')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'milestones'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Milestones ({milestones.length})
              </button>
              <button
                onClick={() => setActiveTab('automation')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'automation'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Automation ({automationEvents.length})
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Details
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Milestones Tab */}
            {activeTab === 'milestones' && (
              <div className="space-y-4">
                {milestones.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No milestones defined for this escrow.
                  </div>
                ) : (
                  milestones.map((milestone, index) => (
                    <SmartMilestoneCard
                      key={milestone.id}
                      milestone={milestone}
                      escrowId={escrow.id}
                      onUpdate={fetchEscrowData}
                    />
                  ))
                )}
              </div>
            )}

            {/* Automation Tab */}
            {activeTab === 'automation' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">Automation Status</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {escrow.automation_enabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">Auto-Release Delay</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {escrow.auto_release_delay_hours} hours
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Events</h4>
                  {automationEvents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No automation events recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {automationEvents.map((event) => (
                        <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">{event.event_name}</span>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  event.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {event.success ? 'SUCCESS' : 'FAILED'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                Type: {event.event_type.replace('_', ' ').toLowerCase()}
                              </p>
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Escrow Information</h4>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Client</dt>
                      <dd className="text-sm text-gray-900">{escrow.client_name || 'Unknown'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Freelancer</dt>
                      <dd className="text-sm text-gray-900">{escrow.freelancer_name || 'Unknown'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                      <dd className="text-sm text-gray-900">
                        {parseFloat(escrow.total_amount).toLocaleString()} {escrow.currency_symbol || 'ETH'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Released Amount</dt>
                      <dd className="text-sm text-gray-900">
                        {parseFloat(escrow.released_amount).toLocaleString()} {escrow.currency_symbol || 'ETH'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Quality Threshold</dt>
                      <dd className="text-sm text-gray-900">{escrow.quality_threshold} / 5.0</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Timeline</h4>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created</dt>
                      <dd className="text-sm text-gray-900">
                        {formatDistanceToNow(new Date(escrow.created_at), { addSuffix: true })}
                      </dd>
                    </div>
                    {escrow.activated_at && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Activated</dt>
                        <dd className="text-sm text-gray-900">
                          {formatDistanceToNow(new Date(escrow.activated_at), { addSuffix: true })}
                        </dd>
                      </div>
                    )}
                    {escrow.completed_at && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Completed</dt>
                        <dd className="text-sm text-gray-900">
                          {formatDistanceToNow(new Date(escrow.completed_at), { addSuffix: true })}
                        </dd>
                      </div>
                    )}
                    {escrow.updated_at && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                        <dd className="text-sm text-gray-900">
                          {formatDistanceToNow(new Date(escrow.updated_at), { addSuffix: true })}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dispute Modal */}
      {showDisputeModal && (
        <DisputeModal
          escrowId={escrow.id}
          onClose={() => setShowDisputeModal(false)}
          onSuccess={() => {
            setShowDisputeModal(false)
            fetchEscrowData()
          }}
        />
      )}
    </AppShell>
  )
}
