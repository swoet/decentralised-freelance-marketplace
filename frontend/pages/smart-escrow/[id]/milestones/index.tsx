import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import AppShell from '../../../../components/layout/AppShell'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Milestone {
  id: string
  title: string
  description: string
  amount: string
  currency_symbol?: string
  order_index: number
  status: string
  milestone_type: string
  is_automated: boolean
  approval_required: boolean
  due_date?: string
  created_at: string
}

export default function MilestonesIndex() {
  const router = useRouter()
  const { id } = router.query
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMilestones = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/v1/smart-escrow/${id}/milestones`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch milestones')
      const data = await res.json()
      setMilestones(data.milestones || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchMilestones()
  }, [id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'submitted': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AppShell>
      <Head>
        <title>Milestones - Smart Escrow</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4">
                <li>
                  <Link href={`/smart-escrow/dashboard`} className="text-gray-400 hover:text-gray-500">Dashboard</Link>
                </li>
                <li><span className="text-gray-400">/</span></li>
                <li>
                  <Link href={`/smart-escrow/${id}`} className="text-gray-400 hover:text-gray-500">Escrow</Link>
                </li>
                <li><span className="text-gray-400">/</span></li>
                <li><span className="text-gray-900 font-medium">Milestones</span></li>
              </ol>
            </nav>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">Milestones</h1>
          </div>
          <Link href={`/smart-escrow/${id}/milestones/create`} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium">
            Add Milestone
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading milestones...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">
              <p>Error: {error}</p>
              <button onClick={fetchMilestones} className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded">Retry</button>
            </div>
          ) : milestones.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No milestones yet.</p>
              <Link href={`/smart-escrow/${id}/milestones/create`} className="mt-2 inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded">Create your first milestone</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {milestones.map((m) => (
                <div key={m.id} className="p-6 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="text-lg font-medium text-gray-900">{m.order_index + 1}. {m.title}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(m.status)}`}>
                        {m.status.toUpperCase()}
                      </span>
                      {m.is_automated && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">🤖 AUTO</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{m.description}</p>
                    <div className="text-sm text-gray-500 flex items-center space-x-4">
                      <span className="font-medium text-gray-900">Amount: {parseFloat(m.amount).toLocaleString()} {m.currency_symbol || 'ETH'}</span>
                      {m.due_date && (
                        <span>Due {formatDistanceToNow(new Date(m.due_date), { addSuffix: true })}</span>
                      )}
                      <span>Type: {m.milestone_type.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="ml-6 flex items-center space-x-2">
                    <Link href={`/smart-escrow/${id}/manage`} className="text-indigo-600 hover:text-indigo-800 text-sm">Open</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

