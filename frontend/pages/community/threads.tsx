import Head from 'next/head'
import { useEffect, useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import { useAuth } from '../../context/AuthContext'

export default function ThreadsPage() {
  const [items, setItems] = useState<{ id: string; title: string; tags?: string[] }[]>([])
  const [title, setTitle] = useState('')
  const [tag, setTag] = useState('')
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
      const res = await fetch(`${API_BASE}/community/threads`, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setItems(data.items || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load threads')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [token])

  const createThread = async () => {
    const tags = tag ? [tag] : []
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/community/threads`, {
        method: 'POST', headers,
        body: JSON.stringify({ title, tags })
      })
      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try { const err = await res.json(); msg = err?.detail || err?.message || msg } catch {}
        throw new Error(msg)
      }
      setTitle(''); setTag(''); await load()
    } catch (e: any) {
      setError(e?.message || 'Failed to create thread')
    }
  }

  return (
    <AppShell>
      <Head><title>Community Threads</title></Head>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Community Threads</h1>
        {error ? (<div className="text-red-600">{error}</div>) : null}
        <div className="rounded-lg border bg-white p-4 shadow-sm flex gap-2">
          <input className="flex-1 border rounded px-2 py-1" placeholder="Thread title" value={title} onChange={e => setTitle(e.target.value)} />
          <input className="border rounded px-2 py-1" placeholder="Tag (optional)" value={tag} onChange={e => setTag(e.target.value)} />
          <button className="px-3 py-1.5 rounded bg-indigo-600 text-white" onClick={createThread} disabled={!title}>Create</button>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border bg-white p-4 text-gray-600">No threads yet.</div>
        ) : (
          <ul className="space-y-2">
            {items.map(it => (
              <li key={it.id} className="border rounded p-3">
                <a className="font-medium text-indigo-700 hover:underline" href={`/community/threads/${it.id}`}>{it.title}</a>
                {it.tags?.length ? (<div className="text-sm text-gray-600">Tags: {it.tags.join(', ')}</div>) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  )
}
