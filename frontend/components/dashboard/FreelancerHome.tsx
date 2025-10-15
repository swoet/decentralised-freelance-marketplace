import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Project {
  id: string
  title: string
  budget_min: number
  budget_max: number
  description: string
  client_name?: string
  match_score?: number
}

interface Stats {
  active_bids: number
  active_projects: number
  total_earnings: number
  reputation_score: number
}

export default function FreelancerHome() {
  const [matchedProjects, setMatchedProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<Stats>({
    active_bids: 0,
    active_projects: 0,
    total_earnings: 0,
    reputation_score: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsRes, statsRes] = await Promise.all([
          fetch('/api/v1/matching/feed?limit=5', { credentials: 'include' }),
          fetch('/api/v1/dashboard/stats', { credentials: 'include' })
        ])

        if (projectsRes.ok) {
          const data = await projectsRes.json()
          setMatchedProjects(data.items || [])
        }

        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="text-sm text-gray-600">Active Bids</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{stats.active_bids}</div>
        </div>
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="text-sm text-gray-600">Active Projects</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.active_projects}</div>
        </div>
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="text-sm text-gray-600">Total Earnings</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">${stats.total_earnings.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="text-sm text-gray-600">Reputation</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">{stats.reputation_score.toFixed(1)}</div>
        </div>
      </div>

      {/* Matched Projects Feed */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">AI-Matched Projects for You</h2>
          <Link href="/ai-match" className="text-sm text-indigo-600 hover:text-indigo-800">
            View All →
          </Link>
        </div>

        {matchedProjects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No matched projects at the moment.</p>
            <p className="text-sm text-gray-500 mt-2">Check back soon for personalized recommendations!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matchedProjects.map((project) => (
              <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/projects/${project.id}`} className="font-medium text-indigo-600 hover:text-indigo-800">
                        {project.title}
                      </Link>
                      {project.match_score && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                          {Math.round(project.match_score * 100)}% match
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>Budget: ${project.budget_min} - ${project.budget_max}</span>
                      {project.client_name && <span>Client: {project.client_name}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/projects" className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition">
          <div className="text-lg font-semibold mb-2">Browse Projects</div>
          <p className="text-sm text-gray-600">Explore available opportunities</p>
        </Link>
        <Link href="/bids" className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition">
          <div className="text-lg font-semibold mb-2">My Bids</div>
          <p className="text-sm text-gray-600">Track your proposals</p>
        </Link>
        <Link href="/skills/verify" className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition">
          <div className="text-lg font-semibold mb-2">Verify Skills</div>
          <p className="text-sm text-gray-600">Boost your credibility</p>
        </Link>
      </div>
    </div>
  )
}
