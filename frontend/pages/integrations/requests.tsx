import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import AppShell from '../../components/layout/AppShell'
import { useAuth } from '../../context/AuthContext'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Motion,
  Stagger,
  StatusBadge
} from '../../components/artisan-craft'

interface IntegrationRequest {
  id: string
  user_id: string
  integration_name: string
  description: string | null
  use_case: string | null
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'implemented'
  upvotes: number
  created_at: string
}

export default function IntegrationRequestsPage() {
  const router = useRouter()
  const { token, user } = useAuth()
  const [requests, setRequests] = useState<IntegrationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

  const loadRequests = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = filter === 'all' 
        ? `${API_BASE}/integrations/requests`
        : `${API_BASE}/integrations/requests?status=${filter}`
      
      const response = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (!response.ok) throw new Error('Failed to load requests')
      
      const data = await response.json()
      setRequests(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load integration requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [filter, token])

  const handleUpvote = async (requestId: string) => {
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const response = await fetch(`${API_BASE}/integrations/requests/${requestId}/upvote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to upvote')
      
      // Reload requests to get updated upvote count
      await loadRequests()
    } catch (err) {
      console.error('Upvote failed:', err)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'implemented': return <StatusBadge status="completed" size="sm">Implemented</StatusBadge>
      case 'approved': return <StatusBadge status="active" size="sm">Approved</StatusBadge>
      case 'reviewing': return <StatusBadge status="pending" size="sm">Reviewing</StatusBadge>
      case 'rejected': return <StatusBadge status="cancelled" size="sm">Rejected</StatusBadge>
      default: return <StatusBadge status="inactive" size="sm">Pending</StatusBadge>
    }
  }

  return (
    <AppShell>
      <Head>
        <title>Integration Requests - CraftNexus</title>
        <meta name="description" content="View and vote on integration requests" />
      </Head>

      <div className="min-h-screen mh-surface">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <Motion preset="slideInDown" className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-mahogany-800 heading-craft">Integration Requests</h1>
                <p className="text-copper-600 mt-2">Vote on integrations you'd like to see added</p>
              </div>
              <Button 
                variant="primary" 
                size="md" 
                shape="wax"
                onClick={() => router.push('/integrations')}
              >
                Back to Integrations
              </Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['all', 'pending', 'reviewing', 'approved', 'implemented'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    filter === status
                      ? 'bg-amber-600 text-white'
                      : 'bg-white text-copper-600 hover:bg-copper-50 border border-copper-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </Motion>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-16">
              <div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-amber-600 rounded-full mx-auto mb-4"></div>
              <p className="text-copper-600">Loading requests...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Motion preset="fadeIn" className="text-center py-16">
              <div className="mh-card max-w-md mx-auto p-8 border-red-200 bg-red-50">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold mb-2">Error</h3>
                <p className="mb-4">{error}</p>
                <Button onClick={loadRequests} variant="primary">
                  Try Again
                </Button>
              </div>
            </Motion>
          )}

          {/* Requests List */}
          {!loading && !error && (
            <Stagger staggerDelay={100} className="space-y-4">
              {requests.length === 0 ? (
                <Motion preset="fadeIn" className="text-center py-16">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-mahogany-800 mb-2">No Requests Found</h3>
                  <p className="text-copper-600">No integration requests match this filter</p>
                </Motion>
              ) : (
                requests.map((request) => (
                  <Motion key={request.id} preset="slideInUp">
                    <Card variant="elevated" interactive="hover" className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          {/* Upvote Section */}
                          <div className="flex flex-col items-center gap-1 min-w-[60px]">
                            <button
                              onClick={() => handleUpvote(request.id)}
                              disabled={!token}
                              className="p-2 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title={!token ? 'Login to upvote' : 'Upvote this request'}
                            >
                              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <span className="text-lg font-bold text-mahogany-800">{request.upvotes}</span>
                            <span className="text-xs text-copper-600">votes</span>
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div>
                                <h3 className="text-xl font-bold text-mahogany-800 mb-1">
                                  {request.integration_name}
                                </h3>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {getStatusBadge(request.status)}
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(request.priority)}`}>
                                    {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)} Priority
                                  </span>
                                </div>
                              </div>
                            </div>

                            {request.description && (
                              <p className="text-copper-700 mb-2">{request.description}</p>
                            )}

                            {request.use_case && (
                              <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                                <p className="text-sm text-mahogany-700">
                                  <span className="font-semibold">Use case:</span> {request.use_case}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center gap-4 mt-4 text-xs text-copper-600">
                              <span>Requested {new Date(request.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Motion>
                ))
              )}
            </Stagger>
          )}
        </div>
      </div>
    </AppShell>
  )
}
