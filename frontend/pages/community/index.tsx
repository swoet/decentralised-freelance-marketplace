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
        <title>Community - CraftNexus</title>
        <meta name="description" content="Connect with fellow artisans at CraftNexus, share knowledge, and grow together in our vibrant creative community" />
        
        {/* Fonts are now loaded globally in globals.css */}
      </Head>
      
      <div className="max-w-7xl mx-auto">
          <Motion preset="slideInDown" className="mb-8">
            <div className="mh-section p-8 text-center">
              <h1 className="text-5xl font-bold mb-4">
                CraftNexus Community
              </h1>
              <p className="text-xl max-w-2xl mx-auto mb-8">
                Where Artisans Connect. Join our vibrant community of creators, share knowledge, and build lasting partnerships with fellow artisans and innovators.
              </p>
              <div className="mh-divider-wood"></div>
            </div>
          </Motion>

          {loading ? (
            <Motion preset="scaleIn" className="flex justify-center items-center py-16">
              <div className="mh-card p-8 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-amber-600 rounded-full mx-auto mb-4"></div>
                <p>Gathering community insights...</p>
              </div>
            </Motion>
          ) : error ? (
            <Motion preset="fadeIn" className="flex justify-center items-center py-16">
              <div className="mh-card p-8 text-center border-red-300">
                <div className="text-6xl mb-4">⚠️</div>
                <p className="text-red-600 mb-4">{error}</p>
                <button className="mh-btn mh-btn-primary" onClick={() => window.location.reload()}>
                  Try Again
                </button>
              </div>
            </Motion>
          ) : (
            <Stagger staggerDelay={200} className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="mh-card group p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-2xl">
                          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold">Discussion Threads</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Share ideas, ask questions, and engage in meaningful conversations with fellow artisans
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      {threadsCount}
                    </span>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <span>💬</span>
                      <span>Active discussions on techniques, tools, and trends</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span>🤝</span>
                      <span>Get help from experienced community members</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span>💡</span>
                      <span>Share your knowledge and inspire others</span>
                    </div>
                  </div>
                </div>
                <div className="mt-auto">
                  <button 
                    className="mh-btn mh-btn-primary w-full"
                    onClick={() => window.location.href = '/community/threads'}
                  >
                    Explore Threads →
                  </button>
                </div>
              </div>

              <div className="mh-card group p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-100 rounded-2xl">
                          <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold">Community Events</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Join workshops, meetups, and collaborative sessions to enhance your craft
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                      {eventsCount}
                    </span>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <span>🎨</span>
                      <span>Hands-on workshops and skill-building sessions</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span>🌟</span>
                      <span>Networking events and collaboration opportunities</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span>📅</span>
                      <span>Regular meetups and community gatherings</span>
                    </div>
                  </div>
                </div>
                <div className="mt-auto">
                  <button 
                    className="mh-btn mh-btn-primary w-full"
                    onClick={() => window.location.href = '/community/events'}
                  >
                    Discover Events →
                  </button>
                </div>
              </div>
            </Stagger>
          )}
      </div>
    </AppShell>
  )
}
