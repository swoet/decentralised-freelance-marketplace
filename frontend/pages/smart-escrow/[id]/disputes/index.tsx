import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import AppShell from '../../../../components/layout/AppShell'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Dispute {
  id: string
  dispute_type: string
  title: string
  description: string
  disputed_amount: string
  priority: string
  status: string
  raised_by: string
  raised_at: string
  resolved_at?: string
  resolution_notes?: string
  mediator_assigned?: string
  evidence_urls: string[]
}

export default function DisputesIndex() {
  const router = useRouter()
  const { id } = router.query
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchDisputes()
    }
  }, [id])

  const fetchDisputes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/smart-escrow/${id}/disputes`, {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800'
      case 'in_review': return 'bg-blue-100 text-blue-800'
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
        <title>Disputes - Smart Escrow</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4">
                <li>
                  <Link href="/smart-escrow/dashboard" className="text-gray-400 hover:text-gray-500">Dashboard</Link>
                </li>
                <li><span className="text-gray-400">/</span></li>
                <li>
                  <Link href={`/smart-escrow/${id}`} className="text-gray-400 hover:text-gray-500">Escrow</Link>
                </li>
                <li><span className="text-gray-400">/</span></li>
                <li><span className="text-gray-900 font-medium">Disputes</span></li>
              </ol>
            </nav>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">Dispute Management</h1>
          </div>
          <Link
            href={`/smart-escrow/${id}/disputes/create`}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Raise New Dispute
          </Link>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
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
            <div className="p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No disputes</h3>
              <p className="mt-1 text-sm text-gray-500">
                Great! This escrow has no active or historical disputes. All parties are working together smoothly.
              </p>
              <div className="mt-6">
                <Link
                  href={`/smart-escrow/${id}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back to Escrow Details
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{dispute.title}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(dispute.status)}`}>
                          {dispute.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(dispute.priority)}`}>
                          {dispute.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{dispute.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase">Type</div>
                          <div className="text-sm text-gray-900">{dispute.dispute_type.replace('_', ' ')}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase">Amount</div>
                          <div className="text-sm font-medium text-gray-900">{dispute.disputed_amount} ETH</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase">Raised By</div>
                          <div className="text-sm text-gray-900">{dispute.raised_by}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase">Date Raised</div>
                          <div className="text-sm text-gray-900">
                            {formatDistanceToNow(new Date(dispute.raised_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>

                      {dispute.mediator_assigned && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                          <div className="flex">
                            <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            <div className="text-sm">
                              <p className="text-blue-800 font-medium">Mediator Assigned</p>
                              <p className="text-blue-700">{dispute.mediator_assigned} is reviewing this dispute</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {dispute.resolved_at && dispute.resolution_notes && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                          <div className="flex">
                            <svg className="w-5 h-5 text-green-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div className="text-sm">
                              <p className="text-green-800 font-medium">
                                Resolved {formatDistanceToNow(new Date(dispute.resolved_at), { addSuffix: true })}
                              </p>
                              <p className="text-green-700 mt-1">{dispute.resolution_notes}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {dispute.evidence_urls.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs font-medium text-gray-500 uppercase mb-2">Evidence</div>
                          <div className="space-y-1">
                            {dispute.evidence_urls.map((url, index) => (
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

                    <div className="ml-6 flex flex-col space-y-2">
                      {dispute.status === 'open' && (
                        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                          Add Response
                        </button>
                      )}
                      <button className="text-sm text-gray-600 hover:text-gray-800">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dispute Process Info */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">How Dispute Resolution Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">1</div>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900">File Dispute</h4>
                <p className="text-sm text-gray-500">Submit your dispute with evidence. The escrow is immediately paused.</p>
              </div>
            </div>
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">2</div>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900">Review & Mediation</h4>
                <p className="text-sm text-gray-500">A qualified mediator reviews all evidence and communications.</p>
              </div>
            </div>
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">3</div>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900">Resolution</h4>
                <p className="text-sm text-gray-500">The mediator makes a binding decision and funds are distributed accordingly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
