import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

interface MatchResult {
  freelancer_id: string;
  freelancer: {
    id: string;
    username: string;
    email: string;
    profile?: {
      first_name: string;
      last_name: string;
      title?: string;
      bio?: string;
      hourly_rate?: number;
      availability?: string;
    };
    skills: Array<{
      id: string;
      name: string;
      level: string;
    }>;
  };
  compatibility_score: number;
  skill_match_percentage: number;
  personality_compatibility: number;
  experience_match: number;
  match_reasons: string[];
  recommended_rate: number;
}

interface Project {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  budget_min: number;
  budget_max: number;
}

export default function AIMatch() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [aiAnalysis, setAIAnalysis] = useState<any>(null);
  const [matchingInProgress, setMatchingInProgress] = useState(false);

  useEffect(() => {
    if (user && token) {
      fetchUserProjects();
    }
  }, [user, token]);

  const fetchUserProjects = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Handle both array response and object response
        const projectsData = Array.isArray(data) ? data : (data.projects || data.data || []);
        
        // Filter to only show user's own projects
        const userProjects = projectsData.filter((project: any) => 
          project.client_id === user?.id || project.client?.id === user?.id
        );
        
        setProjects(userProjects);
        if (userProjects.length > 0) {
          setSelectedProject(userProjects[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const runAIMatching = async () => {
    if (!selectedProject || !token) return;

    setMatchingInProgress(true);
    setLoading(true);
    setError(null);
    setMatches([]);
    setAIAnalysis(null);

    try {
      // Start AI matching process
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai-matching/find-matches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: selectedProject,
          match_criteria: {
            min_compatibility: 0.6,
            include_personality: true,
            include_skill_analysis: true,
            max_results: 10
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches || []);

        // Get AI analysis for the matching
        const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai-matching/analyze/${selectedProject}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          setAIAnalysis(analysisData);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to run AI matching');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('AI matching error:', err);
    } finally {
      setLoading(false);
      setMatchingInProgress(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getAvailabilityColor = (availability: string) => {
    const avail = availability?.toLowerCase();
    if (avail?.includes('available') || avail?.includes('immediately')) return 'text-green-600';
    if (avail?.includes('soon') || avail?.includes('week')) return 'text-yellow-600';
    return 'text-gray-600';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>AI Matching - Login Required</title>
        </Head>
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600">Please log in to access AI-powered freelancer matching.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>AI-Powered Freelancer Matching - FreelanceX</title>
      </Head>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI-Powered Freelancer Matching</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Find the perfect freelancers for your projects using advanced AI analysis of skills, 
            personality compatibility, and experience matching.
          </p>
        </div>

        {error && <Toast message={error} type="error" onClose={() => setError(null)} />}

        {/* Project Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Select Project for Matching</h2>
          
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
              <p className="mt-1 text-sm text-gray-500">Create a project first to find matching freelancers.</p>
              <div className="mt-6">
                <a
                  href="/projects/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Project
                </a>
              </div>
            </div>
          ) : (
            <>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
              >
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title} (${project.budget_min}-${project.budget_max})
                  </option>
                ))}
              </select>

              {selectedProject && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  {(() => {
                    const project = projects.find(p => p.id === selectedProject);
                    return project ? (
                      <>
                        <h3 className="font-medium text-gray-900 mb-2">{project.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{project.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {project.required_skills?.map(skill => (
                            <span key={skill} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
              )}

              <button
                onClick={runAIMatching}
                disabled={loading || !selectedProject}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Running AI Analysis...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Find AI Matches
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* AI Analysis Summary */}
        {aiAnalysis && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Project Analysis
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-1">Complexity Level</h3>
                <p className="text-blue-700 capitalize">{aiAnalysis.complexity_assessment || 'Medium'}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-900 mb-1">Estimated Duration</h3>
                <p className="text-green-700">{aiAnalysis.duration_estimate || '2-4 weeks'}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-medium text-purple-900 mb-1">Best Match Type</h3>
                <p className="text-purple-700 capitalize">{aiAnalysis.recommended_experience || 'Intermediate+'}</p>
              </div>
            </div>

            {aiAnalysis.key_requirements && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Key Requirements Detected:</h4>
                <ul className="text-gray-600 text-sm list-disc list-inside">
                  {aiAnalysis.key_requirements.map((req: string, index: number) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Matching Results */}
        {matches.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              AI Matching Results ({matches.length} freelancers found)
            </h2>

            <div className="space-y-6">
              {matches.map((match, index) => (
                <div key={match.freelancer_id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {match.freelancer.profile?.first_name?.[0] || match.freelancer.username[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {match.freelancer.profile?.first_name} {match.freelancer.profile?.last_name || match.freelancer.username}
                          </h3>
                          <p className="text-gray-600 text-sm">{match.freelancer.profile?.title || 'Freelancer'}</p>
                        </div>
                      </div>
                      
                      {match.freelancer.profile?.bio && (
                        <p className="text-gray-700 text-sm mb-3">{match.freelancer.profile.bio}</p>
                      )}

                      <div className="flex flex-wrap gap-2 mb-3">
                        {match.freelancer.skills?.slice(0, 6).map(skill => (
                          <span key={skill.id} className={`text-xs px-2 py-1 rounded ${
                            skill.level === 'expert' ? 'bg-green-100 text-green-800' :
                            skill.level === 'advanced' ? 'bg-blue-100 text-blue-800' :
                            skill.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {skill.name} ({skill.level})
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {match.freelancer.profile?.hourly_rate && (
                          <span>Rate: ${match.freelancer.profile.hourly_rate}/hr</span>
                        )}
                        {match.recommended_rate && (
                          <span className="text-green-600">Recommended: ${match.recommended_rate}/hr</span>
                        )}
                        {match.freelancer.profile?.availability && (
                          <span className={getAvailabilityColor(match.freelancer.profile.availability)}>
                            {match.freelancer.profile.availability}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right ml-6">
                      <div className={`text-2xl font-bold mb-2 px-3 py-1 rounded-full ${getScoreColor(match.compatibility_score)}`}>
                        {Math.round(match.compatibility_score * 100)}%
                      </div>
                      <p className="text-xs text-gray-500 mb-2">Overall Match</p>
                      
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between gap-2">
                          <span>Skills:</span>
                          <span className="font-medium">{Math.round(match.skill_match_percentage)}%</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span>Personality:</span>
                          <span className="font-medium">{Math.round(match.personality_compatibility * 100)}%</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span>Experience:</span>
                          <span className="font-medium">{Math.round(match.experience_match * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {match.match_reasons && match.match_reasons.length > 0 && (
                    <div className="bg-gray-50 rounded p-3 mb-4">
                      <h4 className="font-medium text-gray-900 text-sm mb-2">Why this is a good match:</h4>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {match.match_reasons.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm transition-colors">
                      View Profile
                    </button>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm transition-colors">
                      Send Invite
                    </button>
                    <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm transition-colors">
                      Save for Later
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={runAIMatching}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Refresh Matches
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {matchingInProgress && matches.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">AI is analyzing freelancers...</h3>
            <p className="text-gray-600">
              We're using advanced AI to match skills, personality, and experience factors.
            </p>
          </div>
        )}

        {/* No matches found */}
        {!loading && !matchingInProgress && matches.length === 0 && selectedProject && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No matches found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your project requirements or check back later for new freelancers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
