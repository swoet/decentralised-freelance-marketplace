import Head from 'next/head'
import { useEffect, useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import toast from 'react-hot-toast'

interface CarbonEstimate {
  chain_id: number
  chain_name: string
  tx_hash: string
  estimate_kg: number
  timestamp: string
}

interface OffsetRecommendation {
  provider: string
  cost_usd: number
  blockchain_native: boolean
  rate_per_kg: number
}

export default function SustainabilityPage() {
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [estimating, setEstimating] = useState(false)
  const [chainId, setChainId] = useState('1')
  const [txHash, setTxHash] = useState('')
  const [estimate, setEstimate] = useState<CarbonEstimate | null>(null)
  const [recommendations, setRecommendations] = useState<OffsetRecommendation[]>([])

  useEffect(() => {
    loadSummary()
  }, [])

  const loadSummary = async () => {
    try {
      const res = await fetch('/api/v1/sustainability/summary', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setSummary(data)
      }
    } catch (error) {
      console.error('Failed to load summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const estimateTransaction = async () => {
    if (!txHash) {
      toast.error('Please enter a transaction hash')
      return
    }

    setEstimating(true)
    try {
      const res = await fetch(
        `/api/v1/sustainability/estimate-tx?chain_id=${chainId}&tx_hash=${txHash}`,
        { credentials: 'include' }
      )
      
      if (!res.ok) throw new Error('Failed to estimate')
      
      const data = await res.json()
      setEstimate(data)
      
      // Get recommendations
      if (data.estimate_kg > 0) {
        const recRes = await fetch(
          `/api/v1/sustainability/offset/recommendations?amount_kg=${data.estimate_kg}`,
          { credentials: 'include' }
        )
        if (recRes.ok) {
          const recData = await recRes.json()
          setRecommendations(recData.recommendations || [])
        }
      }
      
      toast.success('Carbon footprint estimated!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to estimate carbon footprint')
    } finally {
      setEstimating(false)
    }
  }

  const offsetCarbon = async (provider: string, amount_kg: number) => {
    try {
      const res = await fetch('/api/v1/sustainability/offset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount_kg, provider })
      })
      
      if (!res.ok) throw new Error('Failed to create offset')
      
      const data = await res.json()
      toast.success(`Offset intent created: $${data.estimated_cost_usd}`)
      loadSummary()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create offset')
    }
  }

  return (
    <AppShell>
      <Head>
        <title>Sustainability - CraftNexus</title>
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">🌱 Sustainability Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Track and offset your blockchain carbon footprint
          </p>
        </div>

        {/* Summary Cards */}
        {!loading && summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">Total Footprint</div>
              <div className="text-3xl font-bold text-red-600">
                {summary.total_footprint_kg.toFixed(3)} kg
              </div>
              <div className="text-xs text-gray-500 mt-2">CO₂ emissions</div>
            </div>
            
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">Total Offset</div>
              <div className="text-3xl font-bold text-green-600">
                {summary.total_offset_kg.toFixed(3)} kg
              </div>
              <div className="text-xs text-gray-500 mt-2">CO₂ offset</div>
            </div>
            
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">Net Impact</div>
              <div className={`text-3xl font-bold ${summary.carbon_neutral ? 'text-green-600' : 'text-orange-600'}`}>
                {summary.net_footprint_kg.toFixed(3)} kg
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {summary.carbon_neutral ? '✓ Carbon Neutral' : 'Not yet neutral'}
              </div>
            </div>
          </div>
        )}

        {/* Transaction Estimator */}
        <section className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Estimate Transaction Footprint</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blockchain
              </label>
              <select
                value={chainId}
                onChange={(e) => setChainId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="1">Ethereum</option>
                <option value="137">Polygon</option>
                <option value="56">BSC</option>
                <option value="42161">Arbitrum</option>
                <option value="10">Optimism</option>
                <option value="8453">Base</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Hash
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="0x..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={estimateTransaction}
                  disabled={estimating || !txHash}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {estimating ? 'Estimating...' : 'Estimate'}
                </button>
              </div>
            </div>
          </div>

          {estimate && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-blue-900">Carbon Footprint Estimate</div>
                  <div className="text-3xl font-bold text-blue-600 mt-2">
                    {estimate.estimate_kg.toFixed(6)} kg CO₂
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    <div>Chain: {estimate.chain_name}</div>
                    <div className="text-xs mt-1 font-mono">
                      Tx: {estimate.tx_hash.slice(0, 10)}...{estimate.tx_hash.slice(-8)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Equivalent to</div>
                  <div className="text-sm mt-1">
                    🚗 {(estimate.estimate_kg / 0.12).toFixed(1)} km driven
                  </div>
                  <div className="text-sm">
                    🌳 {(estimate.estimate_kg / 21 * 365).toFixed(0)} days of tree absorption
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Offset Recommendations */}
        {recommendations.length > 0 && (
          <section className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Offset Providers</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.map((rec) => (
                <div key={rec.provider} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold capitalize">{rec.provider}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {rec.blockchain_native ? '⛓️ On-chain' : '🌐 Off-chain'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Cost</div>
                      <div className="font-bold text-green-600">${rec.cost_usd}</div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-3">
                    ${rec.rate_per_kg}/kg CO₂
                  </div>
                  
                  <button
                    onClick={() => estimate && offsetCarbon(rec.provider, estimate.estimate_kg)}
                    className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                  >
                    Offset with {rec.provider}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Impact Information */}
        <section className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🌍 Our Commitment</h2>
          
          <div className="space-y-3 text-gray-700">
            <p>
              <strong>Transparency:</strong> All carbon calculations are based on publicly available 
              data for each blockchain's consensus mechanism and energy consumption.
            </p>
            <p>
              <strong>Impact:</strong> A portion of platform fees is automatically allocated to 
              carbon offset projects and social causes through our Treasury smart contract.
            </p>
            <p>
              <strong>Choices:</strong> Choose from blockchain-native offset providers (like KlimaDAO) 
              or traditional certified offset projects (like Patch, Nori).
            </p>
          </div>
          
          <div className="mt-6 pt-6 border-t border-green-300">
            <div className="text-sm text-gray-600">Carbon Offset Partners</div>
            <div className="flex items-center gap-4 mt-3">
              <div className="px-4 py-2 bg-white rounded-lg border text-sm font-medium">
                KlimaDAO
              </div>
              <div className="px-4 py-2 bg-white rounded-lg border text-sm font-medium">
                Patch
              </div>
              <div className="px-4 py-2 bg-white rounded-lg border text-sm font-medium">
                Nori
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
