import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Milestone {
  id: string
  description: string
  amount: number
  status: string
  due_date?: string
}

interface EscrowContract {
  id: string
  project_id: string
  project_title: string
  total_amount: number
  milestones: Milestone[]
  chain_id?: number
  contract_address?: string
}

export default function EscrowStatus() {
  const [contracts, setContracts] = useState<EscrowContract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadEscrow = async () => {
      try {
        const res = await fetch('/api/v1/smart-escrow?status=active&limit=5', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setContracts(data.items || [])
        }
      } catch (error) {
        console.error('Failed to load escrow data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadEscrow()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  if (contracts.length === 0) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Active Escrows</h3>
        <div className="text-center py-8 text-gray-600">
          <p>No active escrow contracts</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Active Escrows</h3>
        <Link href="/smart-escrow" className="text-sm text-indigo-600 hover:text-indigo-800">
          View All →
        </Link>
      </div>

      <div className="space-y-4">
        {contracts.map((contract) => {
          const completedMilestones = contract.milestones.filter(m => m.status === 'completed').length
          const totalMilestones = contract.milestones.length
          const progressPercent = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0

          return (
            <div key={contract.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Link 
                    href={`/projects/${contract.project_id}`}
                    className="font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    {contract.project_title}
                  </Link>
                  <div className="text-sm text-gray-600 mt-1">
                    Total: ${contract.total_amount.toFixed(2)}
                  </div>
                </div>
                {contract.chain_id && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    Chain {contract.chain_id}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{completedMilestones} / {totalMilestones} milestones</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              {contract.milestones.length > 0 && (
                <div className="mt-3 space-y-1">
                  {contract.milestones.slice(0, 2).map((milestone) => (
                    <div key={milestone.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          milestone.status === 'completed' ? 'bg-green-500' :
                          milestone.status === 'in_progress' ? 'bg-blue-500' :
                          'bg-gray-300'
                        }`}></span>
                        <span className="text-gray-700 truncate">{milestone.description}</span>
                      </div>
                      <span className="text-gray-600 ml-2">${milestone.amount}</span>
                    </div>
                  ))}
                  {contract.milestones.length > 2 && (
                    <div className="text-xs text-gray-500 pl-4">
                      +{contract.milestones.length - 2} more milestones
                    </div>
                  )}
                </div>
              )}

              {contract.contract_address && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Contract:</span>
                    <code className="bg-gray-100 px-2 py-0.5 rounded font-mono">
                      {contract.contract_address.slice(0, 6)}...{contract.contract_address.slice(-4)}
                    </code>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
