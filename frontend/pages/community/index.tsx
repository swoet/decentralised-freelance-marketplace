import Head from 'next/head'
import { useEffect, useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import { useAuth } from '../../context/AuthContext'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  StatusBadge,
  Motion,
  Stagger
} from '../../components/artisan-craft'

export default function CommunityIndex() {
  const { token } = useAuth()
  const [threadsCount, setThreadsCount] = useState<number>(0)
  const [eventsCount, setEventsCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const headers: Record<string, string> = {}
        if (token) headers['Authorization'] = `Bearer ${token}`
        const [tRes, eRes] = await Promise.all([
          fetch(`${API_BASE}/community/threads`, { headers }),
          fetch(`${API_BASE}/community/events`, { headers })
        ])
        if (!tRes.ok || !eRes.ok) throw new Error(`HTTP ${tRes.status}/${eRes.status}`)
        const t = await tRes.json()
        const e = await eRes.json()
        setThreadsCount(Array.isArray(t?.items) ? t.items.length : 0)
        setEventsCount(Array.isArray(e?.items) ? e.items.length : 0)
      } catch (err: any) {
        setError(err?.message || 'Failed to load community data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  return (
    <AppShell>
      <Head>
        <title>Community - Artisan Marketplace</title>
        <meta name="description" content="Connect with fellow artisans, share knowledge, and grow together in our vibrant community" />
        
        {/* Artisan Craft Fonts */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+Pro:wght@400;500&family=Crimson+Text:wght@400;600&display=swap" 
          rel="stylesheet"
        />
      </Head>
      
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Motion preset="slideInDown" className="mb-8">
            <div className="text-center space-y-4">
              <h1 className="heading-craft text-5xl text-mahogany-800">
                Artisan Community
              </h1>
              <p className="body-craft text-xl text-copper-700 max-w-2xl mx-auto">
                Connect with fellow artisans, share knowledge, and grow together in our vibrant community of creators and innovators.
              </p>
            </div>
          </Motion>

          {loading ? (
            <Motion preset="scaleIn" className="flex justify-center items-center py-16">
              <Card variant="parchment" className="p-8 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-mahogany-200 border-t-mahogany-600 rounded-full mx-auto mb-4"></div>
                <p className="body-craft text-copper-700">Gathering community insights...</p>
              </Card>
            </Motion>
          ) : error ? (
            <Motion preset="fadeIn" className="flex justify-center items-center py-16">
              <Card variant="outlined" className="p-8 text-center border-red-300">
                <div className="text-6xl mb-4">⚠️</div>
                <p className="body-craft text-red-600">{error}</p>
                <Button variant="secondary" onClick={() => window.location.reload()} className="mt-4">
                  Try Again
                </Button>
              </Card>
            </Motion>
          ) : (
            <Stagger staggerDelay={200} className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card variant="leather" interactive="float" className="group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-3 bg-forest-100 rounded-organic-leaf group-hover:bg-forest-200 transition-colors">
                          <svg className="w-6 h-6 text-forest-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                          </svg>
                        </div>
                        Discussion Threads
                      </CardTitle>
                      <CardDescription>
                        Share ideas, ask questions, and engage in meaningful conversations with fellow artisans
                      </CardDescription>
                    </div>
                    <StatusBadge status="active" size="lg">
                      {threadsCount}
                    </StatusBadge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-copper-600">
                      <span>💬</span>
                      <span>Active discussions on techniques, tools, and trends</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-copper-600">
                      <span>🤝</span>
                      <span>Get help from experienced community members</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-copper-600">
                      <span>💡</span>
                      <span>Share your knowledge and inspire others</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="primary" 
                    fullWidth 
                    shape="leaf"
                    onClick={() => window.location.href = '/community/threads'}
                  >
                    Explore Threads →
                  </Button>
                </CardFooter>
              </Card>

              <Card variant="parchment" interactive="float" className="group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-3 bg-gold-100 rounded-organic-wax group-hover:bg-gold-200 transition-colors">
                          <svg className="w-6 h-6 text-gold-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        Community Events
                      </CardTitle>
                      <CardDescription>
                        Join workshops, meetups, and collaborative sessions to enhance your craft
                      </CardDescription>
                    </div>
                    <StatusBadge status="pending" size="lg">
                      {eventsCount}
                    </StatusBadge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-copper-600">
                      <span>🎨</span>
                      <span>Hands-on workshops and skill-building sessions</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-copper-600">
                      <span>🌟</span>
                      <span>Networking events and collaboration opportunities</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-copper-600">
                      <span>📅</span>
                      <span>Regular meetups and community gatherings</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="accent" 
                    fullWidth 
                    shape="wax"
                    onClick={() => window.location.href = '/community/events'}
                  >
                    Discover Events →
                  </Button>
                </CardFooter>
              </Card>
            </Stagger>
          )}
        </div>
      </div>
    </AppShell>
  )
}
