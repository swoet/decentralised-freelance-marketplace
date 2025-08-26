import Head from 'next/head'
import { useEffect, useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import ChainSelector from '../../components/ChainSelector'

export default function EscrowCreatePage() {
  const [client, setClient] = useState('')
  const [freelancer, setFreelancer] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [chainId, setChainId] = useState<number | undefined>(undefined)
  const [paymentMode, setPaymentMode] = useState<'native' | 'token'>('native')
  const [milestones, setMilestones] = useState<{ description: string; amount: number }[]>([{ description: '', amount: 0 }])
  const [factory, setFactory] = useState<string>('')
  const [allowanceInfo, setAllowanceInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const total = milestones.reduce((acc, m) => acc + (Number(m.amount) || 0), 0)

  const addMilestone = () => setMilestones(prev => [...prev, { description: '', amount: 0 }])
  const updateMilestone = (idx: number, key: 'description' | 'amount', val: string) => {
    setMilestones(prev => prev.map((m, i) => i === idx ? { ...m, [key]: key === 'amount' ? Number(val) : val } : m))
  }

  useEffect(() => {
    const fetchFactory = async () => {
      if (!chainId) return
      const res = await fetch(`/api/v1/web3/factory?chain_id=${chainId}`, { credentials: 'include' })
      if (res.ok) {
        const j = await res.json()
        setFactory(j.factory)
      }
    }
    fetchFactory()
  }, [chainId])

  const checkAllowance = async () => {
    if (!client || !factory || !chainId) return
    const res = await fetch(`/api/v1/token/allowance?owner=${client}&spender=${factory}&chain_id=${chainId}`, { credentials: 'include' })
    if (res.ok) {
      const j = await res.json()
      setAllowanceInfo(j)
    }
  }

  const approve = async () => {
    if (!chainId || !factory) return
    const amountWei = total // assumes token has 18 decimals and total is already in wei for demo; adjust as needed
    const res = await fetch('/api/v1/token/approve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ chain_id: chainId, owner_private_key: privateKey, spender: factory, amount_wei: amountWei })
    })
    if (res.ok) {
      const j = await res.json()
      alert(`Approve tx hash: ${j.tx_hash}`)
      await checkAllowance()
    } else {
      const j = await res.json().catch(() => ({}))
      alert(j.detail || 'Failed to approve')
    }
  }

  const deploy = async () => {
    setError(null)
    setResult(null)
    try {
      const payload = {
        client,
        freelancer,
        private_key: privateKey,
        chain_id: chainId,
        payment_mode: paymentMode,
        milestone_descriptions: milestones.map(m => m.description),
        milestone_amounts: milestones.map(m => Number(m.amount)),
      }
      const res = await fetch('/api/v1/web3/deploy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(payload)
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.detail || `HTTP ${res.status}`)
      setResult(j)
    } catch (e: any) {
      setError(e?.message || 'Failed to deploy escrow')
    }
  }

  return (
    <AppShell>
      <Head><title>Create Escrow</title></Head>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Create Escrow</h1>
        <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border rounded px-2 py-1" placeholder="Client address" value={client} onChange={e => setClient(e.target.value)} />
            <input className="border rounded px-2 py-1" placeholder="Freelancer address" value={freelancer} onChange={e => setFreelancer(e.target.value)} />
            <input className="border rounded px-2 py-1" type="password" placeholder="Client private key" value={privateKey} onChange={e => setPrivateKey(e.target.value)} />
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Payment</label>
              <select className="border rounded px-2 py-1" value={paymentMode} onChange={e => setPaymentMode(e.target.value as any)}>
                <option value="native">Native</option>
                <option value="token">Token</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Chain</label>
              <input className="border rounded px-2 py-1" placeholder="Chain ID" value={chainId ?? ''} onChange={e => setChainId(e.target.value ? Number(e.target.value) : undefined)} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-medium">Milestones</div>
            {milestones.map((m, idx) => (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2" key={idx}>
                <input className="border rounded px-2 py-1" placeholder="Description" value={m.description} onChange={e => updateMilestone(idx, 'description', e.target.value)} />
                <input className="border rounded px-2 py-1" placeholder="Amount (wei)" value={m.amount} onChange={e => updateMilestone(idx, 'amount', e.target.value)} />
              </div>
            ))}
            <button className="px-3 py-1.5 rounded border" onClick={addMilestone}>Add Milestone</button>
          </div>

          {paymentMode === 'token' && (
            <div className="border rounded p-3">
              <div className="text-sm text-gray-700">Escrow Factory Spender</div>
              <div className="font-mono text-sm break-all">{factory || '—'}</div>
              <div className="flex gap-2 mt-2">
                <button className="px-3 py-1.5 rounded border" onClick={checkAllowance} disabled={!client || !factory || !chainId}>Check Allowance</button>
                <button className="px-3 py-1.5 rounded border" onClick={approve} disabled={!client || !factory || !chainId}>Approve</button>
              </div>
              {allowanceInfo ? (
                <div className="text-sm text-gray-700 mt-2">Allowance: {allowanceInfo.allowance} {allowanceInfo.symbol}</div>
              ) : null}
            </div>
          )}

          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded bg-indigo-600 text-white" onClick={deploy}>Deploy</button>
            {error ? (<div className="text-red-600">{error}</div>) : null}
          </div>

          {result ? (
            <div className="mt-2 text-sm text-gray-700">Result: <pre>{JSON.stringify(result, null, 2)}</pre></div>
          ) : null}
        </div>
      </div>
    </AppShell>
  )
}
