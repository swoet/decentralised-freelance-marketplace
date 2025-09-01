import Head from 'next/head'
import { useEffect, useState, useRef } from 'react'
import AppShell from '../../components/layout/AppShell'
import { useAuth } from '../../context/AuthContext'
import { useLocation } from '../../hooks/useLocation'
import LocationPermission from '../../components/LocationPermission'

interface Event {
  id: string;
  title: string;
  description?: string;
  starts_at: string;
  ends_at?: string;
  link?: string;
  external_url?: string;
  location_name?: string;
  location_address?: string;
  is_online: boolean;
  is_free: boolean;
  category?: string;
  source?: string;
}

export default function EventsPage() {
  const [items, setItems] = useState<Event[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [link, setLink] = useState('')
  const [isOnline, setIsOnline] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const { token } = useAuth()
  const { location } = useLocation()
  const refreshInterval = useRef<NodeJS.Timeout>()
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

  const load = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      
      // Use new events API with auto-refresh and location filtering
      const params = new URLSearchParams({
        auto_refresh: autoRefresh.toString(),
        radius_km: '50'
      })
      
      const res = await fetch(`${API_BASE}/events/?${params}`, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setItems(Array.isArray(data) ? data : data.items || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load events')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Auto-refresh events when user is online and has location
  useEffect(() => {
    if (autoRefresh && location && token) {
      // Initial load
      load()
      
      // Set up auto-refresh every 5 minutes
      refreshInterval.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          load(true) // Show refreshing indicator
        }
      }, 5 * 60 * 1000)
      
      return () => {
        if (refreshInterval.current) {
          clearInterval(refreshInterval.current)
        }
      }
    } else {
      load()
    }
  }, [token, location, autoRefresh])

  // Manual refresh
  const handleRefresh = async () => {
    if (!token) return
    
    try {
      const headers = { 'Authorization': `Bearer ${token}` }
      await fetch(`${API_BASE}/events/refresh`, {
        method: 'POST',
        headers
      })
      // Reload events after refresh
      setTimeout(() => load(true), 2000)
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh events')
    }
  }

  const createEvent = async () => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      
      const eventData = {
        title,
        description,
        link,
        is_online: isOnline,
        is_free: true,
        category: 'user_created',
        starts_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Default to tomorrow
      }
      
      const res = await fetch(`${API_BASE}/events/`, {
        method: 'POST', headers,
        body: JSON.stringify(eventData)
      })
      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try { const err = await res.json(); msg = err?.detail || err?.message || msg } catch {}
        throw new Error(msg)
      }
      setTitle(''); setDescription(''); setLink(''); setIsOnline(false); await load()
    } catch (e: any) {
      setError(e?.message || 'Failed to create event')
    }
  }

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays < 7) return `In ${diffDays} days`
    return date.toLocaleDateString()
  }

  const getEventUrl = (event: Event) => {
    return event.external_url || event.link || '#'
  }

  return (
    <AppShell>
      <Head><title>Community Events</title></Head>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">IT & Business Events</h1>
          <div className="flex items-center gap-4">
            {location && (
              <span className="text-sm text-gray-600">
                📍 {location.city}, {location.country}
              </span>
            )}
            {refreshing && (
              <span className="text-sm text-blue-600">🔄 Updating...</span>
            )}
            <button
              onClick={handleRefresh}
              disabled={!token || refreshing}
              className="text-sm px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
            >
              Refresh Events
            </button>
          </div>
        </div>

        <LocationPermission onLocationGranted={() => load()} />

        {error && <div className="text-red-600 bg-red-50 p-3 rounded">{error}</div>}

        {/* Auto-refresh toggle */}
        <div className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            id="autoRefresh"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="autoRefresh" className="text-gray-700">
            Auto-refresh events when online (every 5 minutes)
          </label>
        </div>

        {/* Create event form */}
        <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
          <h3 className="font-medium">Create Community Event</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="border rounded px-3 py-2"
              placeholder="Event title"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="Event link/URL"
              value={link}
              onChange={e => setLink(e.target.value)}
            />
          </div>
          <textarea
            className="w-full border rounded px-3 py-2"
            placeholder="Event description (optional)"
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isOnline}
                onChange={(e) => setIsOnline(e.target.checked)}
              />
              <span className="text-sm">Online event</span>
            </label>
            <button
              className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              onClick={createEvent}
              disabled={!title}
            >
              Create Event
            </button>
          </div>
        </div>

        {/* Events list */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading events...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center text-gray-600">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="font-medium mb-2">No events found</h3>
            <p className="text-sm">
              {location 
                ? "No IT/business events found in your area. Try enabling auto-refresh or check back later."
                : "Enable location access to see events near you, or create your own community event."
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map(event => (
              <div key={event.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      {event.is_free && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">FREE</span>
                      )}
                      {event.is_online && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">ONLINE</span>
                      )}
                      {event.category && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded capitalize">
                          {event.category}
                        </span>
                      )}
                    </div>
                    
                    {event.description && (
                      <p className="text-gray-700 mb-2 text-sm">{event.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span>📅 {formatEventDate(event.starts_at)}</span>
                      {event.location_name && (
                        <span>📍 {event.location_name}</span>
                      )}
                      {event.source && event.source !== 'user_created' && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          via {event.source}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {getEventUrl(event) !== '#' && (
                      <a
                        href={getEventUrl(event)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 text-center"
                      >
                        {event.is_online ? 'Join Online' : 'View Details'}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
