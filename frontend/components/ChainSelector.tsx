import { useEffect, useState } from 'react'
import { connectWallet, switchChain, WalletConnection } from '../utils/wallet'

export default function ChainSelector() {
  const [conn, setConn] = useState<WalletConnection | null>(null)
  const [targetChain, setTargetChain] = useState<number>(0)

  const onConnect = async () => {
    const res = await connectWallet()
    if (res) setConn(res)
  }

  const onSwitch = async () => {
    if (!targetChain) return
    const ok = await switchChain(targetChain)
    if (ok) {
      const res = await connectWallet()
      if (res) setConn(res)
    }
  }

  useEffect(() => {
    // Try to get existing connection
    (async () => {
      try {
        const eth: any = (globalThis as any).ethereum
        if (!eth) return
        const accs: string[] = await eth.request({ method: 'eth_accounts' })
        if (accs && accs.length) {
          const chainIdHex: string = await eth.request({ method: 'eth_chainId' })
          const chainId = parseInt(chainIdHex, 16)
          setConn({ address: accs[0], chainId })
        }
      } catch {}
    })()
  }, [])

  return (
    <div className="flex items-center gap-2">
      {conn ? (
        <>
          <span className="text-xs text-gray-600">{conn.address.slice(0,6)}...{conn.address.slice(-4)} on {conn.chainId}</span>
          <input className="border rounded px-2 py-1 text-sm w-28" placeholder="Chain ID" value={targetChain || ''} onChange={e => setTargetChain(Number(e.target.value))} />
          <button className="px-3 py-1.5 rounded border text-sm" onClick={onSwitch}>Switch</button>
        </>
      ) : (
        <button className="px-3 py-1.5 rounded border text-sm" onClick={onConnect}>Connect Wallet</button>
      )}
    </div>
  )
}
