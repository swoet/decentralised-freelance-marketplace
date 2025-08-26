import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import AppShell from '../../../components/layout/AppShell'

export default function ThreadView() {
  const router = useRouter()
  const { id } = router.query
  const [thread, setThread] = useState<{ id: string; title: string; tags?: string[] } | null>(null)
  const [posts, setPosts] = useState<{ id: string; body: string; author_id: string }[]>([])
  const [body, setBody] = useState('')

  const load = async () => {
    if (!id) return
    const [t, p] = await Promise.all([
      fetch(`/api/v1/community/threads/${id}`, { credentials: 'include' }).then(r => r.json()),
      fetch(`/api/v1/community/threads/${id}/posts`, { credentials: 'include' }).then(r => r.json())
    ])
    setThread(t)
    setPosts(p.items || [])
  }
  useEffect(() => { load() }, [id])

  const send = async () => {
    const res = await fetch(`/api/v1/community/threads/${id}/posts`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ body })
    })
    if (res.ok) { setBody(''); await load() }
  }

  return (
    <AppShell>
      <Head><title>{thread?.title || 'Thread'}</title></Head>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">{thread?.title}</h1>
        <div className="rounded-lg border bg-white p-4 shadow-sm space-y-2">
          <div className="flex gap-2">
            <input className="flex-1 border rounded px-2 py-1" placeholder="Write a reply..." value={body} onChange={e => setBody(e.target.value)} />
            <button className="px-3 py-1.5 rounded bg-indigo-600 text-white" onClick={send} disabled={!body}>Post</button>
          </div>
          <ul className="space-y-2">
            {posts.map(p => (
              <li key={p.id} className="border rounded p-3">
                <div className="text-gray-800 whitespace-pre-wrap">{p.body}</div>
                <div className="text-xs text-gray-500">Author: {p.author_id}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  )
}
