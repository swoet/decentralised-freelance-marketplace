import Head from 'next/head'
import { useEffect, useState } from 'react'
import AppShell from '../components/layout/AppShell'
import ChainSelector from '../components/ChainSelector'
import { connectWallet, WalletConnection } from '../utils/wallet'

export default function WalletPage() {
  const [conn, setConn] = useState<WalletConnection | null>(null)
  const [balance, setBalance] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [txs, setTxs] = useState<any[]>([])

  const refresh = async () => {
    setError(null)
    try {
      const c = await connectWallet()
      if (!c) { setConn(null); setBalance(null); setTxs([]); return }
      setConn(c)
      const [bRes, tRes] = await Promise.all([
        fetch(`/api/v1/token/balance?address=${c.address}&chain_id=${c.chainId}`, { credentials: 'include' }),
        fetch('/api/v1/web3/txs', { credentials: 'include' })
      ])
      if (!bRes.ok) throw new Error(`HTTP ${bRes.status}`)
      const data = await bRes.json()
      setBalance(data)
      const tData = await tRes.json()
      setTxs(tData.items || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load wallet')
    }
  }

  useEffect(() => { refresh() }, [])

  return (
    <AppShell>
      <Head><title>Wallet</title></Head>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Wallet</h1>
          <ChainSelector />
        </div>
        {error ? (<div className="text-red-600">{error}</div>) : null}
        {balance ? (
          <div className="rounded-lg border bg-white p-4 shadow-sm space-y-4">
            <div>
              <div className="text-sm text-gray-600">Address</div>
              <div className="font-mono text-sm">{balance.address}</div>
              <div className="mt-2 text-sm text-gray-600">Balance</div>
              <div className="text-2xl font-bold">{balance.balance} {balance.symbol}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Recent Transactions</div>
              {!txs.length ? (
                <div className="text-sm text-gray-600">No transactions yet.</div>
              ) : (
                <ul className="text-sm space-y-2">
                  {txs.map((t, idx) => (
                    <li key={idx} className="border rounded p-2">
                      <div className="font-mono">{t.tx_hash}</div>
                      <div className="text-gray-600">{t.type} — {t.status} — chain {t.chain_id}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div>No wallet connected.</div>
            <button className="px-3 py-1.5 rounded border mt-2" onClick={refresh}>Connect</button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
