import React, { useState, useEffect } from 'react';
import { 
  FiBrain, 
  FiActivity, 
  FiDatabase,
  FiUsers,
  FiFolder,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiClock
} from 'react-icons/fi';

interface AIMatchingStats {
  ai_matching_enabled: boolean;
  total_project_embeddings: number;
  total_freelancer_profiles: number;
  total_cached_matches: number;
  embedding_model: string | null;
  system_status: string;
}

const AIMatchingStatus: React.FC = () => {
  const [stats, setStats] = useState<AIMatchingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v1/ai/matching/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI matching stats');
      }

      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-100';
      case 'fallback_mode': return 'text-yellow-600 bg-yellow-100';
      case 'maintenance': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <FiCheckCircle className="text-green-600" />;
      case 'fallback_mode': return <FiAlertCircle className="text-yellow-600" />;
      case 'maintenance': return <FiClock className="text-red-600" />;
      default: return <FiActivity className="text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center mb-3">
          <FiAlertCircle className="text-red-600 mr-3" />
          <h3 className="font-medium text-gray-900">AI Matching Status</h3>
        </div>
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-3 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
        >
          <FiRefreshCw className="inline mr-1" />
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <FiBrain className="text-2xl text-blue-600 mr-3" />
          <div>
            <h3 className="font-medium text-gray-900">AI Matching System</h3>
            <div className="flex items-center mt-1">
              {getStatusIcon(stats.system_status)}
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(stats.system_status)}`}>
                {stats.system_status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={fetchStats}
          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          title="Refresh stats"
        >
          <FiRefreshCw className="text-lg" />
        </button>
      </div>

      {/* Stats */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <FiFolder className="text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">
                {stats.total_project_embeddings}
              </span>
            </div>
            <p className="text-xs text-gray-600">Project Embeddings</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <FiUsers className="text-green-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">
                {stats.total_freelancer_profiles}
              </span>
            </div>
            <p className="text-xs text-gray-600">Freelancer Profiles</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <FiDatabase className="text-purple-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">
                {stats.total_cached_matches}
              </span>
            </div>
            <p className="text-xs text-gray-600">Cached Matches</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <FiActivity className="text-orange-600 mr-2" />
              <span className={`text-lg font-bold ${stats.ai_matching_enabled ? 'text-green-600' : 'text-red-600'}`}>
                {stats.ai_matching_enabled ? 'ON' : 'OFF'}
              </span>
            </div>
            <p className="text-xs text-gray-600">AI Engine</p>
          </div>
        </div>

        {/* Model Info */}
        {stats.embedding_model && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              <strong>Model:</strong> {stats.embedding_model}
            </div>
          </div>
        )}

        {/* Status Messages */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          {stats.system_status === 'operational' && (
            <div className="flex items-center text-green-600 text-sm">
              <FiCheckCircle className="mr-2" />
              AI matching system is fully operational
            </div>
          )}
          {stats.system_status === 'fallback_mode' && (
            <div className="flex items-center text-yellow-600 text-sm">
              <FiAlertCircle className="mr-2" />
              Running in fallback mode (basic skill matching)
            </div>
          )}
          {stats.system_status === 'maintenance' && (
            <div className="flex items-center text-red-600 text-sm">
              <FiClock className="mr-2" />
              System under maintenance
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIMatchingStatus;
