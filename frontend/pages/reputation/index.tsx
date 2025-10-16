import Head from 'next/head'
import { useEffect, useState } from 'react'
import AppShell from '../../components/layout/AppShell'

export default function ReputationPage() {
  const [score, setScore] = useState<{ score: number; breakdown?: any } | null>(null)
  const [history, setHistory] = useState<{ items: any[] }>({ items: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [s, h] = await Promise.all([
          fetch('/api/v1/reputation/score', { credentials: 'include' }).then(r => r.json()),
          fetch('/api/v1/reputation/history', { credentials: 'include' }).then(r => r.json())
        ])
        setScore(s)
        setHistory(h)
      } catch (e: any) {
        setError(e?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <AppShell>
      <Head>
        <title>Reputation</title>
      </Head>
      <div className="space-y-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold">Reputation</h1>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 space-y-6">
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold">Current Score</h2>
                <div className="text-3xl font-bold">{(score?.score ?? 0).toFixed(2)}</div>
                <pre className="text-sm text-gray-700 bg-gray-50 rounded p-2 mt-2">{JSON.stringify(score?.breakdown, null, 2)}</pre>
              </div>
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold">History</h2>
                {!history.items.length ? (<div>No events yet.</div>) : (
                  <ul className="space-y-2">
                    {history.items.map((it, idx) => (
                      <li key={idx} className="border rounded p-3">
                        <div className="font-medium">{it.type} — {it.weight}</div>
                        <div className="text-sm text-gray-600">{it.created_at}</div>
                        <pre className="text-sm text-gray-700 bg-gray-50 rounded p-2 mt-2">{JSON.stringify(it.payload, null, 2)}</pre>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
            <aside className="space-y-6">
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <h3 className="text-sm font-medium text-gray-700 mb-1">Tips</h3>
                <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                  <li>Complete verifications to boost your score.</li>
                  <li>Maintain high review ratings for lasting reputation.</li>
                </ul>
              </div>
            </aside>
          </div>
        )}
      </div>
    </AppShell>
  )
}
