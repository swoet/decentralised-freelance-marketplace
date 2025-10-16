import Head from 'next/head'
import { useEffect, useState, useRef } from 'react'
import AppShell from '../../components/layout/AppShell'
import { useAuth } from '../../context/AuthContext'
import { useLocation } from '../../hooks/useLocation'
import LocationPermission from '../../components/LocationPermission'
import {
  Button,
  ButtonGroup,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardBadge,
  Input,
  Badge,
  StatusBadge,
  SkillBadge,
  BadgeGroup,
  Motion,
  Stagger
} from '../../components/artisan-craft'

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
  const refreshInterval = useRef<NodeJS.Timeout | null>(null)
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
      <Head>
        <title>Community Events - Artisan Marketplace</title>
        <meta name="description" content="Discover IT and business events tailored to your interests and location" />
      </Head>
      
      <div className="max-w-7xl mx-auto">
          <Motion preset="slideInDown" className="mb-8">
            <div className="text-center space-y-4">
              <h1 className="heading-craft text-4xl text-mahogany-800">
                Community Events
              </h1>
              <p className="body-craft text-lg text-copper-700 max-w-2xl mx-auto">
                Discover IT and business events tailored to your interests and location. Connect, learn, and grow with fellow artisans.
              </p>
              <div className="flex items-center justify-center gap-6 text-sm">
                {location && (
                  <Badge variant="success" size="md" shape="circle">
                    📍 {location.city}, {location.country}
                  </Badge>
                )}
                {refreshing && (
                  <Badge variant="warning" size="md" shape="circle">
                    🔄 Updating...
                  </Badge>
                )}
                <Button
                  variant="accent"
                  size="sm"
                  shape="rounded"
                  onClick={handleRefresh}
                  disabled={!token || refreshing}
                  loading={refreshing}
                >
                  Refresh Events
                </Button>
              </div>
            </div>
          </Motion>

          <LocationPermission onLocationGranted={() => load()} />

          {error && (
            <Motion preset="fadeIn" className="mb-6">
              <Card variant="outlined" className="p-4 border-red-300 bg-red-50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <p className="body-craft text-red-700">{error}</p>
                </div>
              </Card>
            </Motion>
          )}

          {/* Auto-refresh toggle */}
          <Motion preset="scaleIn" className="mb-6">
            <Card variant="parchment" className="p-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="h-4 w-4 text-mahogany-600 focus:ring-gold-500 border-mahogany-300 rounded"
                />
                <label htmlFor="autoRefresh" className="body-craft text-copper-700">
                  Auto-refresh events when online (every 5 minutes)
                </label>
              </div>
            </Card>
          </Motion>

          {/* Create event form */}
          <Motion preset="scaleIn" className="mb-8">
            <Card variant="leather" className="p-6">
              <CardHeader>
                <CardTitle>Create Community Event</CardTitle>
                <CardDescription>Share an event with the artisan community</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      variant="craft"
                      placeholder="Event title"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      label="Event Title"
                      required
                    />
                    <Input
                      variant="craft"
                      placeholder="Event link/URL"
                      value={link}
                      onChange={e => setLink(e.target.value)}
                      label="Event Link"
                    />
                  </div>
                  <Input
                    variant="craft"
                    placeholder="Event description (optional)"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    label="Description"
                  />
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isOnline"
                      checked={isOnline}
                      onChange={(e) => setIsOnline(e.target.checked)}
                      className="h-4 w-4 text-mahogany-600 focus:ring-gold-500 border-mahogany-300 rounded"
                    />
                    <label htmlFor="isOnline" className="body-craft text-sm text-copper-700">
                      Online event
                    </label>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="primary"
                  shape="leaf"
                  onClick={createEvent}
                  disabled={!title}
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  }
                >
                  Create Event
                </Button>
              </CardFooter>
            </Card>
          </Motion>

          {/* Events list */}
          {loading ? (
            <Motion preset="scaleIn" className="flex justify-center items-center py-16">
              <Card variant="parchment" className="p-8 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-mahogany-200 border-t-mahogany-600 rounded-full mx-auto mb-4"></div>
                <p className="body-craft text-copper-700">Loading events...</p>
              </Card>
            </Motion>
          ) : items.length === 0 ? (
            <Motion preset="fadeIn" className="flex justify-center items-center py-16">
              <Card variant="outlined" className="p-12 text-center max-w-md mx-auto">
                <div className="text-6xl opacity-30 mb-6">📅</div>
                <h3 className="heading-craft text-xl text-mahogany-800 mb-2">No Events Found</h3>
                <p className="body-craft text-copper-600 mb-6">
                  {location 
                    ? "No IT/business events found in your area. Try enabling auto-refresh or check back later."
                    : "Enable location access to see events near you, or create your own community event."
                  }
                </p>
                <Button variant="accent" shape="wax" onClick={() => {
                  const titleInput = document.querySelector('input[placeholder*="Event title"]') as HTMLInputElement;
                  titleInput?.focus();
                }}>
                  Create First Event
                </Button>
              </Card>
            </Motion>
          ) : (
            <Stagger staggerDelay={100} className="grid gap-6">
              {items.map((event, index) => (
                <Motion key={event.id} preset="slideInUp" transition={{ delay: index * 50 }}>
                  <Card variant="default" interactive="hover" className="group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-3">
                            <h3 className="heading-craft text-xl font-semibold text-mahogany-800 group-hover:text-copper-600 transition-colors flex-1">
                              {event.title}
                            </h3>
                            <BadgeGroup>
                              {event.is_free && (
                                <Badge variant="success" size="sm" shape="circle">FREE</Badge>
                              )}
                              {event.is_online && (
                                <Badge variant="primary" size="sm" shape="circle">ONLINE</Badge>
                              )}
                              {event.category && (
                                <SkillBadge skill={event.category || 'general'} size="sm">{event.category}</SkillBadge>
                              )}
                            </BadgeGroup>
                          </div>
                          
                          {event.description && (
                            <p className="body-craft text-copper-700 mb-3 text-sm line-clamp-2">
                              {event.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-bronze-600">
                            <span className="flex items-center gap-1">
                              📅 {formatEventDate(event.starts_at)}
                            </span>
                            {event.location_name && (
                              <span className="flex items-center gap-1">
                                📍 {event.location_name}
                              </span>
                            )}
                            {event.source && event.source !== 'user_created' && (
                              <Badge variant="subtle" size="xs">
                                via {event.source}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-6">
                          {getEventUrl(event) !== '#' && (
                            <Button
                              variant="accent"
                              size="sm"
                              shape="wax"
                              onClick={() => window.open(getEventUrl(event), '_blank')}
                              rightIcon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              }
                            >
                              {event.is_online ? 'Join Online' : 'View Details'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Motion>
              ))}
            </Stagger>
          )}
      </div>
    </AppShell>
  )
}
