import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import AppShell from '../../../components/layout/AppShell'
import { useAuth } from '../../../context/AuthContext'

export default function ThreadView() {
  const router = useRouter()
  const { id } = router.query
  const [thread, setThread] = useState<{ id: string; title: string; tags?: string[] } | null>(null)
  const [posts, setPosts] = useState<{ id: string; body: string; author_id: string }[]>([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth()
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

  const load = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const [tRes, pRes] = await Promise.all([
        fetch(`${API_BASE}/community/threads/${id}`, { headers }),
        fetch(`${API_BASE}/community/threads/${id}/posts`, { headers })
      ])
      if (!tRes.ok || !pRes.ok) throw new Error(`HTTP ${tRes.status}/${pRes.status}`)
      const t = await tRes.json()
      const p = await pRes.json()
      setThread(t)
      setPosts(p.items || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load thread')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [id, token])

  const send = async () => {
    if (!id) return
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/community/threads/${id}/posts`, {
        method: 'POST', headers,
        body: JSON.stringify({ body })
      })
      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try { const err = await res.json(); msg = err?.detail || err?.message || msg } catch {}
        throw new Error(msg)
      }
      setBody(''); await load()
    } catch (e: any) {
      setError(e?.message || 'Failed to post reply')
    }
  }

  return (
    <AppShell>
      <Head><title>{thread?.title || 'Thread'}</title></Head>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">{thread?.title}</h1>
        {error ? (<div className="text-red-600">{error}</div>) : null}
        {loading ? (
          <div>Loading...</div>
        ) : !thread ? (
          <div className="rounded-lg border bg-white p-4 shadow-sm">Thread not found.</div>
        ) : (
          <div className="rounded-lg border bg-white p-4 shadow-sm space-y-2">
            <div className="flex gap-2">
              <input className="flex-1 border rounded px-2 py-1" placeholder="Write a reply..." value={body} onChange={e => setBody(e.target.value)} />
              <button className="px-3 py-1.5 rounded bg-indigo-600 text-white" onClick={send} disabled={!body}>Post</button>
            </div>
            {posts.length === 0 ? (
              <div className="rounded border p-3 text-gray-600">No posts yet.</div>
            ) : (
              <ul className="space-y-2">
                {posts.map(p => (
                  <li key={p.id} className="border rounded p-3">
                    <div className="text-gray-800 whitespace-pre-wrap">{p.body}</div>
                    <div className="text-xs text-gray-500">Author: {p.author_id}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
