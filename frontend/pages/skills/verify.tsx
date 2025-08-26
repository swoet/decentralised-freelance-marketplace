import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import AppShell from '../../components/layout/AppShell'

interface SkillItem { id: string; name: string; category?: string }
interface UserSkillItem { skill_id: string; skill_name: string; status: string; level?: number; years?: number; evidence_url?: string }
interface VerificationItem { id: string; skill_id: string; skill_name: string; method: string; status: string; score?: number; metadata?: any; created_at?: string }

export default function SkillsVerify() {
  const [skills, setSkills] = useState<SkillItem[]>([])
  const [mySkills, setMySkills] = useState<UserSkillItem[]>([])
  const [verifs, setVerifs] = useState<VerificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [s, m, v] = await Promise.all([
        fetch('/api/v1/skills', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/v1/skills/me', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/v1/skills/verification/status', { credentials: 'include' }).then(r => r.json()),
      ])
      setSkills(s.items || [])
      setMySkills(m.items || [])
      setVerifs(v.items || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const [selectedSkillId, setSelectedSkillId] = useState<string>('')
  const [level, setLevel] = useState<number | undefined>(undefined)
  const [years, setYears] = useState<number | undefined>(undefined)
  const [evidenceUrl, setEvidenceUrl] = useState<string>('')

  const startEvidence = async () => {
    try {
      const res = await fetch('/api/v1/skills/verification/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ skill_id: selectedSkillId, method: 'evidence', level, years, evidence_url: evidenceUrl })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await load()
      setEvidenceUrl('')
    } catch (e: any) {
      alert(e?.message || 'Failed to start verification')
    }
  }

  const submitEvidence = async (verificationId: string) => {
    try {
      const res = await fetch('/api/v1/skills/verification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ verification_id: verificationId, method: 'evidence', evidence_url: evidenceUrl, auto_verify: true })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await load()
      setEvidenceUrl('')
    } catch (e: any) {
      alert(e?.message || 'Failed to submit evidence')
    }
  }

  const submitQuiz = async (verificationId: string) => {
    const score = Number(prompt('Enter quiz score (0-100):', '85'))
    if (Number.isNaN(score)) return
    try {
      const res = await fetch('/api/v1/skills/verification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ verification_id: verificationId, method: 'quiz', score })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await load()
    } catch (e: any) {
      alert(e?.message || 'Failed to submit quiz')
    }
  }

  return (
    <AppShell>
      <Head>
        <title>Skill Verification</title>
      </Head>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Skill Verification</h1>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 space-y-6">
              <div className="rounded-lg border bg-white p-4 shadow-sm space-y-2">
                <h2 className="text-lg font-semibold">Start Verification</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select className="border rounded px-2 py-1" value={selectedSkillId} onChange={e => setSelectedSkillId(e.target.value)}>
                    <option value="">Select skill</option>
                    {skills.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>
                  <input className="border rounded px-2 py-1" placeholder="Level (1-5)" value={level ?? ''} onChange={e => setLevel(e.target.value ? Number(e.target.value) : undefined)} />
                  <input className="border rounded px-2 py-1" placeholder="Years" value={years ?? ''} onChange={e => setYears(e.target.value ? Number(e.target.value) : undefined)} />
                </div>
                <div className="flex gap-2">
                  <input className="flex-1 border rounded px-2 py-1" placeholder="Evidence URL (https://...)" value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)} />
                  <button className="px-3 py-1.5 rounded bg-indigo-600 text-white" onClick={startEvidence} disabled={!selectedSkillId}>Start</button>
                </div>
              </div>

              <div className="rounded-lg border bg-white p-4 shadow-sm space-y-2">
                <h2 className="text-lg font-semibold">Verifications</h2>
                {!verifs.length ? (<div>No verifications yet.</div>) : (
                  <ul className="space-y-2">
                    {verifs.map(v => (
                      <li key={v.id} className="border rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <div className="font-medium">{v.skill_name} <span className="text-gray-500">({v.method})</span></div>
                          <div className="text-sm text-gray-600">Status: {v.status}{v.score != null ? `, Score: ${v.score}` : ''}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {v.method === 'evidence' && (
                            <button className="px-3 py-1.5 rounded border" onClick={() => submitEvidence(v.id)}>Submit Evidence</button>
                          )}
                          {v.method === 'quiz' && (
                            <button className="px-3 py-1.5 rounded border" onClick={() => submitQuiz(v.id)}>Submit Quiz</button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
            <aside className="space-y-6">
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <h3 className="text-sm font-medium text-gray-700 mb-1">My Skills</h3>
                {!mySkills.length ? (<div className="text-sm text-gray-600">No skills yet.</div>) : (
                  <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                    {mySkills.map(m => (
                      <li key={m.skill_id}>{m.skill_name} — {m.status}{m.level ? `, L${m.level}` : ''}{m.years ? `, ${m.years}y` : ''}</li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </AppShell>
  )
}
