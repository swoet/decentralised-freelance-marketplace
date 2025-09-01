import Head from 'next/head'
import { useEffect, useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import { useAuth } from '../../context/AuthContext'

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
        <title>Community</title>
      </Head>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Community</h1>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg border bg-white p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">Threads</div>
                  <div className="text-sm text-gray-600">Discuss topics with the community</div>
                </div>
                <span className="text-sm">{threadsCount}</span>
              </div>
              <a href="/community/threads" className="inline-block px-3 py-1.5 rounded bg-indigo-600 text-white">View Threads</a>
            </div>

            <div className="rounded-lg border bg-white p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">Events</div>
                  <div className="text-sm text-gray-600">Meetups, demos and more</div>
                </div>
                <span className="text-sm">{eventsCount}</span>
              </div>
              <a href="/community/events" className="inline-block px-3 py-1.5 rounded bg-indigo-600 text-white">View Events</a>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
