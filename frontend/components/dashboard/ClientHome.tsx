import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Project {
  id: string
  title: string
  status: string
  bids_count?: number
  budget_min: number
  budget_max: number
}

interface Freelancer {
  id: string
  full_name: string
  skills?: string[]
  reputation_score?: number
  match_score?: number
}

interface Stats {
  active_projects: number
  pending_milestones: number
  total_spent: number
  completed_projects: number
}

export default function ClientHome() {
  const [projects, setProjects] = useState<Project[]>([])
  const [recommendedFreelancers, setRecommendedFreelancers] = useState<Freelancer[]>([])
  const [stats, setStats] = useState<Stats>({
    active_projects: 0,
    pending_milestones: 0,
    total_spent: 0,
    completed_projects: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsRes, freelancersRes, statsRes] = await Promise.all([
          fetch('/api/v1/projects/me?limit=5', { credentials: 'include' }),
          fetch('/api/v1/matching/recommendations?limit=5', { credentials: 'include' }),
          fetch('/api/v1/dashboard/stats', { credentials: 'include' })
        ])

        if (projectsRes.ok) {
          const data = await projectsRes.json()
          setProjects(data.items || [])
        }

        if (freelancersRes.ok) {
          const data = await freelancersRes.json()
          setRecommendedFreelancers(data.items || [])
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
          <div className="text-sm text-gray-600">Active Projects</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{stats.active_projects}</div>
        </div>
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="text-sm text-gray-600">Pending Milestones</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">{stats.pending_milestones}</div>
        </div>
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="text-sm text-gray-600">Total Spent</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">${stats.total_spent.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.completed_projects}</div>
        </div>
      </div>

      {/* Project Pipeline */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Projects</h2>
          <Link href="/projects" className="text-sm text-indigo-600 hover:text-indigo-800">
            View All →
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No projects yet.</p>
            <Link href="/projects/create" className="inline-block mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              Post Your First Project
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link href={`/projects/${project.id}`} className="font-medium text-indigo-600 hover:text-indigo-800">
                      {project.title}
                    </Link>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        project.status === 'open' ? 'bg-green-100 text-green-700' :
                        project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        project.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {project.status.replace('_', ' ')}
                      </span>
                      {project.bids_count !== undefined && (
                        <span>{project.bids_count} bids</span>
                      )}
                      <span>Budget: ${project.budget_min} - ${project.budget_max}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Freelancers */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recommended Freelancers</h2>
          <Link href="/ai-match" className="text-sm text-indigo-600 hover:text-indigo-800">
            Find More →
          </Link>
        </div>

        {recommendedFreelancers.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-4">
            Post a project to get personalized freelancer recommendations!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedFreelancers.map((freelancer) => (
              <div key={freelancer.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <Link href={`/profile/${freelancer.id}`} className="font-medium text-indigo-600 hover:text-indigo-800">
                      {freelancer.full_name}
                    </Link>
                    {freelancer.reputation_score !== undefined && (
                      <div className="text-sm text-gray-600 mt-1">
                        ⭐ {freelancer.reputation_score.toFixed(1)} reputation
                      </div>
                    )}
                    {freelancer.skills && freelancer.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {freelancer.skills.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {freelancer.match_score && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                      {Math.round(freelancer.match_score * 100)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/projects/create" className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition">
          <div className="text-lg font-semibold mb-2">Post a Project</div>
          <p className="text-sm text-gray-600">Find the perfect freelancer</p>
        </Link>
        <Link href="/escrow" className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition">
          <div className="text-lg font-semibold mb-2">Manage Escrow</div>
          <p className="text-sm text-gray-600">Track payments and milestones</p>
        </Link>
        <Link href="/messages" className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition">
          <div className="text-lg font-semibold mb-2">Messages</div>
          <p className="text-sm text-gray-600">Communicate with freelancers</p>
        </Link>
      </div>
    </div>
  )
}
