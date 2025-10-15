import { useEffect, useState } from 'react'

interface KPIData {
  label: string
  value: string | number
  trend?: number
  icon?: string
  color?: string
}

interface KPIsProps {
  userRole: 'freelancer' | 'client'
}

export default function KPIs({ userRole }: KPIsProps) {
  const [kpis, setKpis] = useState<KPIData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadKPIs = async () => {
      try {
        const res = await fetch('/api/v1/dashboard/kpis', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setKpis(data.kpis || [])
        }
      } catch (error) {
        console.error('Failed to load KPIs:', error)
      } finally {
        setLoading(false)
      }
    }

    loadKPIs()
  }, [])

  const defaultKPIs: KPIData[] = userRole === 'freelancer' 
    ? [
        { label: 'Active Bids', value: 0, icon: '📋', color: 'text-blue-600' },
        { label: 'Win Rate', value: '0%', icon: '🎯', color: 'text-green-600' },
        { label: 'Avg. Project Value', value: '$0', icon: '💰', color: 'text-purple-600' },
        { label: 'Response Time', value: '0h', icon: '⚡', color: 'text-orange-600' }
      ]
    : [
        { label: 'Total Projects', value: 0, icon: '📊', color: 'text-blue-600' },
        { label: 'Avg. Time to Hire', value: '0 days', icon: '⏱️', color: 'text-green-600' },
        { label: 'Success Rate', value: '0%', icon: '✅', color: 'text-purple-600' },
        { label: 'Avg. Rating Given', value: '0.0', icon: '⭐', color: 'text-orange-600' }
      ]

  const displayKPIs = kpis.length > 0 ? kpis : defaultKPIs

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-24 animate-pulse"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {displayKPIs.map((kpi, index) => (
        <div key={index} className="bg-white rounded-lg border shadow-sm p-4 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-sm text-gray-600 mb-1">{kpi.label}</div>
              <div className={`text-2xl font-bold ${kpi.color || 'text-gray-900'}`}>
                {kpi.value}
              </div>
              {kpi.trend !== undefined && (
                <div className={`text-xs mt-1 ${kpi.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.trend >= 0 ? '↑' : '↓'} {Math.abs(kpi.trend)}%
                </div>
              )}
            </div>
            {kpi.icon && (
              <div className="text-2xl">{kpi.icon}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
