import React, { useState, useEffect } from 'react';
import { 
  FiBrain, 
  FiFolder, 
  FiTarget, 
  FiTrendingUp,
  FiStar,
  FiClock,
  FiRefreshCw,
  FiAlertCircle,
  FiDollarSign,
  FiUser,
  FiCalendar
} from 'react-icons/fi';

interface ProjectMatch {
  project_id: string;
  project_title: string;
  project_description: string;
  client_name: string;
  budget_min: number;
  budget_max: number;
  required_skills: string[];
  similarity_score: number;
  compatibility_score: number;
  skill_match_score: number;
  budget_match_score: number;
  matching_skills: string[];
  complexity_score: number;
}

interface ProjectRecommendationsProps {
  freelancerId: string;
  onSelectProject?: (projectId: string) => void;
  maxRecommendations?: number;
}

const ProjectRecommendations: React.FC<ProjectRecommendationsProps> = ({
  freelancerId,
  onSelectProject,
  maxRecommendations = 10
}) => {
  const [matches, setMatches] = useState<ProjectMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = async (forceRefresh: boolean = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const params = new URLSearchParams({
        limit: maxRecommendations.toString(),
        min_similarity: '0.3'
      });

      const response = await fetch(`/api/v1/ai/matching/freelancers/${freelancerId}/projects?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMatches(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
      console.error('Error fetching AI project recommendations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (freelancerId) {
      fetchRecommendations();
    }
  }, [freelancerId]);

  const formatScore = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatBudget = (min: number, max: number) => {
    if (!min && !max) return 'Budget TBD';
    if (!max || min === max) return `$${min?.toLocaleString()}`;
    return `$${min?.toLocaleString()} - $${max?.toLocaleString()}`;
  };

  const getComplexityLabel = (score: number) => {
    if (score >= 0.7) return 'High';
    if (score >= 0.4) return 'Medium';
    return 'Low';
  };

  const getComplexityColor = (score: number) => {
    if (score >= 0.7) return 'text-red-600 bg-red-100';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <FiBrain className="text-2xl text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">AI-Recommended Projects</h3>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <FiAlertCircle className="text-2xl text-red-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Recommendation Error</h3>
        </div>
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => fetchRecommendations()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiRefreshCw className="inline mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
          <FiBrain className="text-2xl text-blue-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI-Recommended Projects</h3>
            <p className="text-sm text-gray-600">
              {matches.length} intelligent project matches found
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchRecommendations(true)}
          disabled={refreshing}
          className="p-2 text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-50"
          title="Refresh recommendations"
        >
          <FiRefreshCw className={`text-xl ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Recommendations List */}
      <div className="p-6">
        {matches.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiTarget className="text-4xl mx-auto mb-4" />
            <p>No AI project recommendations found.</p>
            <p className="text-sm mt-2">Update your profile and skills to get better matches.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {matches.map((match, index) => (
              <div
                key={match.project_id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                {/* Project Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 rounded-full p-2">
                      <FiFolder className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 line-clamp-1">
                        {match.project_title}
                      </h4>
                      <div className="flex items-center text-sm text-gray-600 mt-1 space-x-4">
                        <div className="flex items-center">
                          <FiUser className="mr-1" size={12} />
                          {match.client_name}
                        </div>
                        <div className="flex items-center">
                          <FiDollarSign className="mr-1" size={12} />
                          {formatBudget(match.budget_min, match.budget_max)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getScoreColor(match.compatibility_score)}`}>
                      {formatScore(match.compatibility_score)}
                    </div>
                    <div className="text-xs text-gray-500">Overall Match</div>
                  </div>
                </div>

                {/* Project Description */}
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                  {match.project_description}
                </p>

                {/* Skills */}
                <div className="mb-3">
                  <div className="flex flex-wrap gap-2">
                    {match.required_skills.slice(0, 6).map((skill) => (
                      <span
                        key={skill}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          match.matching_skills.includes(skill)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {skill}
                        {match.matching_skills.includes(skill) && (
                          <FiStar className="inline ml-1 text-green-600" size={10} />
                        )}
                      </span>
                    ))}
                    {match.required_skills.length > 6 && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        +{match.required_skills.length - 6} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Scores */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="text-center">
                    <div className={`text-sm font-medium ${getScoreColor(match.skill_match_score)}`}>
                      {formatScore(match.skill_match_score)}
                    </div>
                    <div className="text-xs text-gray-500">Skills</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-medium ${getScoreColor(match.budget_match_score)}`}>
                      {formatScore(match.budget_match_score)}
                    </div>
                    <div className="text-xs text-gray-500">Budget</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-medium ${getScoreColor(match.similarity_score)}`}>
                      {formatScore(match.similarity_score)}
                    </div>
                    <div className="text-xs text-gray-500">Similarity</div>
                  </div>
                  <div className="text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(match.complexity_score)}`}>
                      {getComplexityLabel(match.complexity_score)}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">Complexity</div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-xs text-gray-600 bg-gray-50 rounded p-3">
                  <div>
                    <span className="font-medium">Skill Match:</span><br/>
                    {match.matching_skills.length} of {match.required_skills.length} skills
                  </div>
                  <div>
                    <span className="font-medium">Complexity:</span><br/>
                    {getComplexityLabel(match.complexity_score)} complexity project
                  </div>
                  <div>
                    <span className="font-medium">AI Confidence:</span><br/>
                    {formatScore(match.similarity_score)} semantic match
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => window.open(`/projects/${match.project_id}`, '_blank')}
                    className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                  >
                    View Project
                  </button>
                  {onSelectProject && (
                    <button
                      onClick={() => onSelectProject(match.project_id)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center">
            <FiBrain className="mr-1" />
            Powered by AI semantic matching
          </div>
          <div>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectRecommendations;
