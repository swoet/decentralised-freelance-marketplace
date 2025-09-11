import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import AppShell from '../../../components/layout/AppShell'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Milestone {
  id: string
  title: string
  description: string
  amount: string
  currency_symbol: string
  status: string
  due_date?: string
  deliverables?: string[]
  submitted_at?: string
  approved_at?: string
  rejected_at?: string
  rejection_reason?: string
}

interface EscrowDetail {
  id: string
  project_title: string
  description?: string
  client_name: string
  client_id: string
  freelancer_name: string
  freelancer_id: string
  total_amount: string
  currency_symbol: string
  status: string
  is_automated: boolean
  automation_enabled: boolean
  created_at: string
  updated_at: string
  deadline?: string
  milestones: Milestone[]
  blockchain_address?: string
  transaction_hash?: string
}

interface Transaction {
  id: string
  type: string
  amount: string
  currency_symbol: string
  status: string
  created_at: string
  transaction_hash?: string
}

export default function EscrowDetail() {
  const router = useRouter()
  const { id } = router.query
  const [escrow, setEscrow] = useState<EscrowDetail | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (id) {
      fetchEscrowDetails()
    }
  }, [id])

  const fetchEscrowDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/smart-escrow/${id}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch escrow details')
      }

      const data = await response.json()
      setEscrow(data)
      
      // Fetch transactions
      const txResponse = await fetch(`/api/v1/smart-escrow/${id}/transactions`, {
        credentials: 'include'
      })
      
      if (txResponse.ok) {
        const txData = await txResponse.json()
        setTransactions(txData.transactions || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'dispute_raised': return 'bg-red-100 text-red-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      case 'funded': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'submitted': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMilestoneProgress = () => {
    if (!escrow?.milestones || escrow.milestones.length === 0) return 0
    const completed = escrow.milestones.filter(m => m.status === 'approved').length
    return (completed / escrow.milestones.length) * 100
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AppShell>
    )
  }

  if (error || !escrow) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <p className="text-red-600 text-lg">Error: {error || 'Escrow not found'}</p>
          <Link href="/smart-escrow/dashboard" className="text-indigo-600 hover:text-indigo-800 mt-4 inline-block">
            Return to Dashboard
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Head>
        <title>{escrow.project_title} - Smart Escrow</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4">
                <li>
                  <Link href="/smart-escrow/dashboard" className="text-gray-400 hover:text-gray-500">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <span className="text-gray-400">/</span>
                </li>
                <li>
                  <span className="text-gray-900 font-medium">{escrow.project_title}</span>
                </li>
              </ol>
            </nav>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">{escrow.project_title}</h1>
            <div className="mt-2 flex items-center space-x-4">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(escrow.status)}`}>
                {escrow.status.replace('_', ' ').toUpperCase()}
              </span>
              {escrow.is_automated && (
                <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                  🤖 Automated
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/smart-escrow/${escrow.id}/manage`}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Manage Escrow
            </Link>
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium">
              Export
            </button>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Total Value</div>
            <div className="text-2xl font-bold text-gray-900">
              {parseFloat(escrow.total_amount).toLocaleString()} {escrow.currency_symbol}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Progress</div>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(getMilestoneProgress())}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${getMilestoneProgress()}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Milestones</div>
            <div className="text-2xl font-bold text-gray-900">
              {escrow.milestones.filter(m => m.status === 'approved').length} / {escrow.milestones.length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Created</div>
            <div className="text-lg font-medium text-gray-900">
              {formatDistanceToNow(new Date(escrow.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'milestones', 'transactions', 'disputes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'overview' && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Project Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Description</dt>
                      <dd className="mt-1 text-sm text-gray-900">{escrow.description || 'No description provided'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Deadline</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {escrow.deadline ? formatDistanceToNow(new Date(escrow.deadline), { addSuffix: true }) : 'No deadline set'}
                      </dd>
                    </div>
                    {escrow.blockchain_address && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Blockchain Address</dt>
                        <dd className="mt-1 text-sm text-gray-900 font-mono">{escrow.blockchain_address}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Parties */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Parties</h3>
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-500">Client</div>
                      <div className="mt-1 text-lg font-medium text-gray-900">{escrow.client_name}</div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-500">Freelancer</div>
                      <div className="mt-1 text-lg font-medium text-gray-900">{escrow.freelancer_name}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'milestones' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Milestones</h3>
                <Link
                  href={`/smart-escrow/${escrow.id}/milestones/create`}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Add Milestone
                </Link>
              </div>
              {escrow.milestones.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No milestones created yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {escrow.milestones.map((milestone) => (
                    <div key={milestone.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-medium text-gray-900">{milestone.title}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(milestone.status)}`}>
                          {milestone.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{milestone.description}</p>
                      <div className="flex justify-between items-center">
                        <div className="text-lg font-bold text-gray-900">
                          {parseFloat(milestone.amount).toLocaleString()} {milestone.currency_symbol}
                        </div>
                        {milestone.due_date && (
                          <div className="text-sm text-gray-500">
                            Due: {formatDistanceToNow(new Date(milestone.due_date), { addSuffix: true })}
                          </div>
                        )}
                      </div>
                      {milestone.deliverables && milestone.deliverables.length > 0 && (
                        <div className="mt-3">
                          <div className="text-sm font-medium text-gray-700 mb-1">Deliverables:</div>
                          <ul className="text-sm text-gray-600 list-disc list-inside">
                            {milestone.deliverables.map((deliverable, idx) => (
                              <li key={idx}>{deliverable}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Transaction History</h3>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No transactions yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hash</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {tx.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {parseFloat(tx.amount).toLocaleString()} {tx.currency_symbol}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tx.status)}`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                            {tx.transaction_hash ? (
                              <a href={`https://etherscan.io/tx/${tx.transaction_hash}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                                {tx.transaction_hash.substring(0, 10)}...
                              </a>
                            ) : (
                              'N/A'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'disputes' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Dispute Management</h3>
              {escrow.status === 'dispute_raised' ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-lg font-medium text-red-800">Dispute Active</h4>
                      <p className="mt-1 text-sm text-red-700">This escrow is currently in dispute. Contact support for resolution.</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/smart-escrow/${escrow.id}/disputes`}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      View Dispute Details
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No active disputes.</p>
                  {escrow.status === 'active' && (
                    <Link
                      href={`/smart-escrow/${escrow.id}/disputes/create`}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      Raise Dispute
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
