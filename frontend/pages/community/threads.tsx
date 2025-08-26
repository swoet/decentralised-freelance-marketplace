import Head from 'next/head'
import { useEffect, useState } from 'react'
import AppShell from '../../components/layout/AppShell'

export default function ThreadsPage() {
  const [items, setItems] = useState<{ id: string; title: string; tags?: string[] }[]>([])
  const [title, setTitle] = useState('')
  const [tag, setTag] = useState('')

  const load = async () => {
    const res = await fetch('/api/v1/community/threads', { credentials: 'include' })
    const data = await res.json()
    setItems(data.items || [])
  }
  useEffect(() => { load() }, [])

  const createThread = async () => {
    const tags = tag ? [tag] : []
    const res = await fetch('/api/v1/community/threads', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ title, tags })
    })
    if (res.ok) { setTitle(''); setTag(''); await load() }
  }

  return (
    <AppShell>
      <Head><title>Community Threads</title></Head>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Community Threads</h1>
        <div className="rounded-lg border bg-white p-4 shadow-sm flex gap-2">
          <input className="flex-1 border rounded px-2 py-1" placeholder="Thread title" value={title} onChange={e => setTitle(e.target.value)} />
          <input className="border rounded px-2 py-1" placeholder="Tag (optional)" value={tag} onChange={e => setTag(e.target.value)} />
          <button className="px-3 py-1.5 rounded bg-indigo-600 text-white" onClick={createThread} disabled={!title}>Create</button>
        </div>
        <ul className="space-y-2">
          {items.map(it => (
            <li key={it.id} className="border rounded p-3">
              <a className="font-medium text-indigo-700 hover:underline" href={`/community/threads/${it.id}`}>{it.title}</a>
              {it.tags?.length ? (<div className="text-sm text-gray-600">Tags: {it.tags.join(', ')}</div>) : null}
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  )
}
