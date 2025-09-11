import Head from 'next/head'
import { useEffect, useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import { useAuth } from '../../context/AuthContext'

interface ConnectedItem { id: string; provider: string; status: string }
interface IntegrationsResp { providers: string[]; connected: ConnectedItem[] }

export default function IntegrationsIndex() {
  const [data, setData] = useState<IntegrationsResp>({ providers: [], connected: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth()

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/integrations`, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const j = await res.json()
      setData(j)
    } catch (e: any) {
      setError(e?.message || 'Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token])

  const connectGitHub = async () => {
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/integrations/github/connect`, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const j = await res.json()
      if (j.url) {
        window.location.href = j.url
      } else {
        alert('No authorization URL returned')
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to start GitHub OAuth')
    }
  }

  const disconnectGitHub = async () => {
    if (!confirm('Disconnect GitHub?')) return
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/integrations/github`, { method: 'DELETE', headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await load()
    } catch (e: any) {
      alert(e?.message || 'Failed to disconnect GitHub')
    }
  }

  const connectSlack = async () => {
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/integrations/slack/connect`, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const j = await res.json()
      if (j.url) {
        window.location.href = j.url
      } else {
        alert('No authorization URL returned')
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to start Slack OAuth')
    }
  }

  const disconnectSlack = async () => {
    if (!confirm('Disconnect Slack?')) return
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/integrations/slack`, { method: 'DELETE', headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await load()
    } catch (e: any) {
      alert(e?.message || 'Failed to disconnect Slack')
    }
  }

  const connectJira = async () => {
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/integrations/jira/connect`, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const j = await res.json()
      if (j.url) {
        window.location.href = j.url
      } else {
        alert('No authorization URL returned')
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to start Jira OAuth')
    }
  }

  const disconnectJira = async () => {
    if (!confirm('Disconnect Jira?')) return
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/integrations/jira`, { method: 'DELETE', headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await load()
    } catch (e: any) {
      alert(e?.message || 'Failed to disconnect Jira')
    }
  }

  const isConnected = (provider: string) => data.connected?.some(c => c.provider === provider)

  return (
    <AppShell>
      <Head>
        <title>Integrations</title>
      </Head>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Integrations</h1>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* GitHub */}
            <div className="rounded-lg border bg-white p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">GitHub</div>
                  <div className="text-sm text-gray-600">OAuth connection for profile/verification</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${isConnected('github') ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {isConnected('github') ? 'Connected' : 'Not connected'}
                </span>
              </div>
              <div className="flex gap-2">
                {!isConnected('github') ? (
                  <button className="px-3 py-1.5 rounded bg-indigo-600 text-white" onClick={connectGitHub}>Connect</button>
                ) : (
                  <button className="px-3 py-1.5 rounded border" onClick={disconnectGitHub}>Disconnect</button>
                )}
              </div>
            </div>

            {/* Slack */}
            <div className="rounded-lg border bg-white p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">Slack</div>
                  <div className="text-sm text-gray-600">Team communication and project notifications</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${isConnected('slack') ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {isConnected('slack') ? 'Connected' : 'Not connected'}
                </span>
              </div>
              <div className="flex gap-2">
                {!isConnected('slack') ? (
                  <button className="px-3 py-1.5 rounded bg-indigo-600 text-white" onClick={connectSlack}>Connect</button>
                ) : (
                  <button className="px-3 py-1.5 rounded border" onClick={disconnectSlack}>Disconnect</button>
                )}
              </div>
            </div>

            {/* Jira */}
            <div className="rounded-lg border bg-white p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">Jira</div>
                  <div className="text-sm text-gray-600">Issue tracking and project management</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${isConnected('jira') ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {isConnected('jira') ? 'Connected' : 'Not connected'}
                </span>
              </div>
              <div className="flex gap-2">
                {!isConnected('jira') ? (
                  <button className="px-3 py-1.5 rounded bg-indigo-600 text-white" onClick={connectJira}>Connect</button>
                ) : (
                  <button className="px-3 py-1.5 rounded border" onClick={disconnectJira}>Disconnect</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
