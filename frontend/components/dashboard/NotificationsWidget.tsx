import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link?: string
  read: boolean
  created_at: string
}

export default function NotificationsWidget() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/v1/notifications?limit=5', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.items || [])
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/v1/notifications/${id}/read`, {
        method: 'POST',
        credentials: 'include'
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        <Link href="/notifications" className="text-sm text-indigo-600 hover:text-indigo-800">
          View All →
        </Link>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          <div className="text-4xl mb-2">🔔</div>
          <p className="text-sm">No notifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div 
              key={notification.id}
              className={`p-3 rounded-lg border transition ${
                notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
              } hover:bg-gray-50`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{notification.title}</span>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </span>
                    {notification.link && (
                      <Link href={notification.link} className="text-xs text-indigo-600 hover:text-indigo-800">
                        View →
                      </Link>
                    )}
                  </div>
                </div>
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="ml-2 text-xs text-gray-500 hover:text-gray-700"
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
