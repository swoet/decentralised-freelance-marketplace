import Head from 'next/head'
import { useEffect, useState } from 'react'
import AppShell from '../../components/layout/AppShell'

interface KeyItem { id: string; prefix: string; revoked: boolean; scopes: string[]; last_used_at?: string }
interface UsageItem { prefix: string; route: string; status_code: number; latency_ms: number; created_at?: string }

export default function DevelopersIndex() {
  const [keys, setKeys] = useState<KeyItem[]>([])
  const [prefixFilter, setPrefixFilter] = useState<string>('')
  const [routeFilter, setRouteFilter] = useState<string>('')
  const [usage, setUsage] = useState<{ items: UsageItem[]; aggregates?: any }>({ items: [] })
  const [newScopes, setNewScopes] = useState<string>('read:*')

  const loadKeys = async () => {
    const res = await fetch('/api/v1/developers/api-keys', { credentials: 'include' })
    const data = await res.json()
    setKeys(data.items || [])
  }

  const loadUsage = async () => {
    const params = new URLSearchParams()
    if (prefixFilter) params.set('prefix', prefixFilter)
    if (routeFilter) params.set('route', routeFilter)
    const res = await fetch(`/api/v1/developers/api-keys/usage?${params.toString()}`, { credentials: 'include' })
    const data = await res.json()
    setUsage(data)
  }

  useEffect(() => { loadKeys() }, [])
  useEffect(() => { loadUsage() }, [prefixFilter, routeFilter])

  const issue = async () => {
    const scopes = newScopes.split(',').map(s => s.trim()).filter(Boolean)
    const res = await fetch('/api/v1/developers/api-keys', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ scopes })
    })
    const data = await res.json()
    alert(`New key issued. Save this secret now:\n${data.prefix}.${data.secret}`)
    await loadKeys()
  }

  const revoke = async (prefix: string) => {
    if (!confirm(`Revoke key ${prefix}?`)) return
    const res = await fetch(`/api/v1/developers/api-keys/${prefix}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) await loadKeys()
  }

  return (
    <AppShell>
      <Head>
        <title>Developers</title>
      </Head>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Developers</h1>
        <div className="rounded-lg border bg-white p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-gray-700">OpenAPI</div>
            <a className="text-indigo-600 hover:underline" href="/api/v1/openapi.json">OpenAPI JSON</a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
            <h2 className="text-lg font-semibold">API Keys</h2>
            <div className="flex gap-2 items-center">
              <input className="flex-1 border rounded px-2 py-1" placeholder="Scopes (comma separated)" value={newScopes} onChange={e => setNewScopes(e.target.value)} />
              <button className="px-3 py-1.5 rounded bg-indigo-600 text-white" onClick={issue}>Issue</button>
            </div>
            {!keys.length ? (
              <div className="text-sm text-gray-600">No keys yet.</div>
            ) : (
              <ul className="text-sm space-y-2">
                {keys.map(k => (
                  <li key={k.id} className="border rounded p-2 flex items-center justify-between">
                    <div>
                      <div className="font-mono">{k.prefix}</div>
                      <div className="text-gray-600">Scopes: {k.scopes?.join(', ') || '—'}</div>
                      <div className="text-gray-600">Last used: {k.last_used_at || 'never'}</div>
                    </div>
                    <div>
                      <button className="px-3 py-1.5 rounded border" onClick={() => revoke(k.prefix)} disabled={k.revoked}>{k.revoked ? 'Revoked' : 'Revoke'}</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
            <h2 className="text-lg font-semibold">Usage</h2>
            <div className="flex gap-2 items-center">
              <select className="border rounded px-2 py-1" value={prefixFilter} onChange={e => setPrefixFilter(e.target.value)}>
                <option value="">All keys</option>
                {keys.map(k => (<option key={k.id} value={k.prefix}>{k.prefix}</option>))}
              </select>
              <input className="border rounded px-2 py-1" placeholder="Route filter" value={routeFilter} onChange={e => setRouteFilter(e.target.value)} />
              <button className="px-3 py-1.5 rounded border" onClick={loadUsage}>Refresh</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded border p-2">
                <div className="font-medium mb-1">Top Routes</div>
                {!usage.aggregates?.by_route?.length ? (<div className="text-gray-600">—</div>) : (
                  <ul className="space-y-1">
                    {usage.aggregates.by_route.map((r: any, idx: number) => (
                      <li key={idx} className="flex justify-between"><span className="truncate">{r.route}</span><span>{r.count}</span></li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded border p-2">
                <div className="font-medium mb-1">Status Codes</div>
                {!usage.aggregates?.by_status?.length ? (<div className="text-gray-600">—</div>) : (
                  <ul className="space-y-1">
                    {usage.aggregates.by_status.map((s: any, idx: number) => (
                      <li key={idx} className="flex justify-between"><span>{s.status_code}</span><span>{s.count}</span></li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">Prefix</th>
                    <th className="p-2">Route</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Latency</th>
                    <th className="p-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {usage.items?.map((u, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2 font-mono">{u.prefix}</td>
                      <td className="p-2">{u.route}</td>
                      <td className="p-2">{u.status_code}</td>
                      <td className="p-2">{u.latency_ms} ms</td>
                      <td className="p-2">{u.created_at || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  )
}
