import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ReputationData {
  score: number
  breakdown?: {
    completion_rate?: number
    on_time_delivery?: number
    quality_score?: number
    communication?: number
  }
  badges?: string[]
  recent_reviews?: number
}

export default function ReputationCard() {
  const [reputation, setReputation] = useState<ReputationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadReputation = async () => {
      try {
        const res = await fetch('/api/v1/reputation/score', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setReputation(data)
        }
      } catch (error) {
        console.error('Failed to load reputation:', error)
      } finally {
        setLoading(false)
      }
    }

    loadReputation()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  const score = reputation?.score || 0
  const breakdown = reputation?.breakdown || {}

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Reputation</h3>
        <Link href="/reputation" className="text-sm text-indigo-600 hover:text-indigo-800">
          Details →
        </Link>
      </div>

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <div>
            <div className="text-3xl font-bold">{score.toFixed(1)}</div>
            <div className="text-xs">/ 5.0</div>
          </div>
        </div>
      </div>

      {Object.keys(breakdown).length > 0 && (
        <div className="space-y-3 mb-4">
          {breakdown.completion_rate !== undefined && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-medium">{Math.round(breakdown.completion_rate * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${breakdown.completion_rate * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {breakdown.on_time_delivery !== undefined && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">On-Time Delivery</span>
                <span className="font-medium">{Math.round(breakdown.on_time_delivery * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${breakdown.on_time_delivery * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {breakdown.quality_score !== undefined && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Quality Score</span>
                <span className="font-medium">{breakdown.quality_score.toFixed(1)}/5</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${(breakdown.quality_score / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {reputation?.badges && reputation.badges.length > 0 && (
        <div className="border-t pt-4 mt-4">
          <div className="text-sm text-gray-600 mb-2">Badges</div>
          <div className="flex flex-wrap gap-2">
            {reputation.badges.map((badge, idx) => (
              <span key={idx} className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                🏆 {badge}
              </span>
            ))}
          </div>
        </div>
      )}

      {reputation?.recent_reviews !== undefined && reputation.recent_reviews > 0 && (
        <div className="border-t pt-4 mt-4 text-sm text-gray-600">
          {reputation.recent_reviews} recent reviews
        </div>
      )}
    </div>
  )
}
