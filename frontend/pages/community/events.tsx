import Head from 'next/head'
import { useEffect, useState } from 'react'
import AppShell from '../../components/layout/AppShell'

export default function EventsPage() {
  const [items, setItems] = useState<{ id: string; title: string; starts_at?: string; link?: string }[]>([])
  const [title, setTitle] = useState('')
  const [link, setLink] = useState('')

  const load = async () => {
    const res = await fetch('/api/v1/community/events', { credentials: 'include' })
    const data = await res.json()
    setItems(data.items || [])
  }
  useEffect(() => { load() }, [])

  const createEvent = async () => {
    const res = await fetch('/api/v1/community/events', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ title, link })
    })
    if (res.ok) { setTitle(''); setLink(''); await load() }
  }

  return (
    <AppShell>
      <Head><title>Community Events</title></Head>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Events</h1>
        <div className="rounded-lg border bg-white p-4 shadow-sm flex gap-2">
          <input className="flex-1 border rounded px-2 py-1" placeholder="Event title" value={title} onChange={e => setTitle(e.target.value)} />
          <input className="border rounded px-2 py-1" placeholder="Link" value={link} onChange={e => setLink(e.target.value)} />
          <button className="px-3 py-1.5 rounded bg-indigo-600 text-white" onClick={createEvent} disabled={!title}>Create</button>
        </div>
        <ul className="space-y-2">
          {items.map(it => (
            <li key={it.id} className="border rounded p-3">
              <div className="font-medium">{it.title}</div>
              <div className="text-sm text-gray-600">{it.starts_at}</div>
              {it.link ? (<a className="text-indigo-700 hover:underline" href={it.link} target="_blank">Join</a>) : null}
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  )
}
