import React, { useState, useEffect } from 'react';
import { 
  FiBrain, 
  FiUser, 
  FiTarget, 
  FiTrendingUp,
  FiStar,
  FiClock,
  FiRefreshCw,
  FiAlertCircle 
} from 'react-icons/fi';

interface FreelancerMatch {
  freelancer_id: string;
  freelancer_name: string;
  freelancer_email: string;
  freelancer_bio: string;
  freelancer_skills: string[];
  similarity_score: number;
  compatibility_score: number;
  skill_match_score: number;
  budget_match_score: number;
  matching_skills: string[];
  rank_position: number;
  cached: boolean;
}

interface FreelancerRecommendationsProps {
  projectId: string;
  onSelectFreelancer?: (freelancerId: string) => void;
  maxRecommendations?: number;
}

const FreelancerRecommendations: React.FC<FreelancerRecommendationsProps> = ({
  projectId,
  onSelectFreelancer,
  maxRecommendations = 10
}) => {
  const [matches, setMatches] = useState<FreelancerMatch[]>([]);
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

      const response = await fetch(`/api/v1/ai/matching/projects/${projectId}/freelancers?${params}`, {
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
      console.error('Error fetching AI recommendations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchRecommendations();
    }
  }, [projectId]);

  const formatScore = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100';
    if (score >= 0.6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <FiBrain className="text-2xl text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">AI-Powered Recommendations</h3>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
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
            <h3 className="text-lg font-semibold text-gray-900">AI-Powered Recommendations</h3>
            <p className="text-sm text-gray-600">
              {matches.length} intelligent matches found
              {matches.some(m => m.cached) && (
                <span className="ml-2 text-xs text-gray-500">
                  <FiClock className="inline mr-1" />
                  Cached results
                </span>
              )}
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
            <p>No AI recommendations found for this project.</p>
            <p className="text-sm mt-2">Try adjusting your project description or required skills.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {matches.map((match, index) => (
              <div
                key={match.freelancer_id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                {/* Freelancer Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 rounded-full p-2">
                      <FiUser className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {match.freelancer_name || 'Anonymous Freelancer'}
                      </h4>
                      <p className="text-sm text-gray-600">{match.freelancer_email}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          #{match.rank_position} Match
                        </span>
                        {match.cached && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full ml-2">
                            Cached
                          </span>
                        )}
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

                {/* Bio */}
                {match.freelancer_bio && (
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                    {match.freelancer_bio}
                  </p>
                )}

                {/* Skills */}
                <div className="mb-3">
                  <div className="flex flex-wrap gap-2">
                    {match.freelancer_skills.slice(0, 8).map((skill) => (
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
                    {match.freelancer_skills.length > 8 && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        +{match.freelancer_skills.length - 8} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Scores */}
                <div className="grid grid-cols-3 gap-3 mb-4">
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
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => window.open(`/freelancers/${match.freelancer_id}`, '_blank')}
                    className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                  >
                    View Profile
                  </button>
                  {onSelectFreelancer && (
                    <button
                      onClick={() => onSelectFreelancer(match.freelancer_id)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Invite to Project
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

export default FreelancerRecommendations;
