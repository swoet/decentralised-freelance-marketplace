import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Activity {
  id: string
  type: string
  title: string
  description: string
  link?: string
  user_name?: string
  timestamp: string
  metadata?: any
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      const res = await fetch('/api/v1/activity/feed?limit=10', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setActivities(data.items || [])
      }
    } catch (error) {
      console.error('Failed to load activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      project_created: '📋',
      bid_submitted: '💼',
      milestone_completed: '✅',
      payment_released: '💰',
      review_received: '⭐',
      message_received: '💬',
      contract_deployed: '⛓️',
      skill_verified: '🎓',
      default: '•'
    }
    return icons[type] || icons.default
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <Link href="/activity" className="text-sm text-indigo-600 hover:text-indigo-800">
          View All →
        </Link>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{activity.description}</p>
                    {activity.user_name && (
                      <p className="text-xs text-gray-500 mt-1">by {activity.user_name}</p>
                    )}
                  </div>
                  <time className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                    {new Date(activity.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </time>
                </div>
                {activity.link && (
                  <Link 
                    href={activity.link}
                    className="text-xs text-indigo-600 hover:text-indigo-800 mt-1 inline-block"
                  >
                    View details →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
