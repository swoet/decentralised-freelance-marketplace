import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../../components/Navbar';
import Toast from '../../components/Toast';

interface AISystemStatus {
  matching_service: {
    status: 'active' | 'degraded' | 'down';
    response_time_ms: number;
    processed_today: number;
    error_rate: number;
  };
  content_generation: {
    status: 'active' | 'degraded' | 'down';
    response_time_ms: number;
    processed_today: number;
    error_rate: number;
  };
  personality_analysis: {
    status: 'active' | 'degraded' | 'down';
    response_time_ms: number;
    processed_today: number;
    error_rate: number;
  };
  demand_prediction: {
    status: 'active' | 'degraded' | 'down';
    last_updated: string;
    accuracy_score: number;
  };
}

interface AIMetrics {
  total_matches_today: number;
  avg_compatibility_score: number;
  content_generations_today: number;
  personality_analyses_today: number;
  successful_matches: number;
  system_uptime: string;
}

interface ModelInfo {
  name: string;
  version: string;
  last_trained: string;
  accuracy: number;
  status: 'active' | 'training' | 'deprecated';
}

interface RecentActivity {
  timestamp: string;
  type: 'match' | 'content' | 'analysis' | 'error';
  description: string;
  user_id?: string;
  success: boolean;
}

export default function AIAdminDashboard() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [systemStatus, setSystemStatus] = useState<AISystemStatus | null>(null);
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }
    
    if (token) {
      fetchDashboardData();
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [user, token, router]);

  const fetchDashboardData = async () => {
    if (!token) return;
    
    const isInitialLoad = !systemStatus;
    if (isInitialLoad) setLoading(true);
    else setRefreshing(true);
    
    try {
      const [statusRes, metricsRes, modelsRes, activityRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/ai/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/ai/metrics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/ai/models`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/ai/activity`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setSystemStatus(statusData);
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }

      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        setModels(modelsData.models || []);
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setRecentActivity(activityData.activities || []);
      }
    } catch (err) {
      console.error('Failed to fetch AI dashboard data:', err);
      if (isInitialLoad) {
        setError('Failed to load AI dashboard data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshModels = async () => {
    if (!token) return;
    
    setRefreshing(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/ai/refresh-models`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSuccess('AI models refreshed successfully');
        fetchDashboardData();
      } else {
        setError('Failed to refresh AI models');
      }
    } catch (err) {
      setError('Network error while refreshing models');
    } finally {
      setRefreshing(false);
    }
  };

  const clearCache = async () => {
    if (!token) return;
    
    setRefreshing(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/ai/clear-cache`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSuccess('AI cache cleared successfully');
        fetchDashboardData();
      } else {
        setError('Failed to clear AI cache');
      }
    } catch (err) {
      setError('Network error while clearing cache');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'down':
        return 'bg-red-100 text-red-800';
      case 'training':
        return 'bg-blue-100 text-blue-800';
      case 'deprecated':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <div className="w-3 h-3 bg-green-500 rounded-full"></div>;
      case 'degraded':
        return <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>;
      case 'down':
        return <div className="w-3 h-3 bg-red-500 rounded-full"></div>;
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full"></div>;
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Access Denied</title>
        </Head>
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">Admin access required to view this page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>AI Admin Dashboard - Loading</title>
        </Head>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading AI dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>AI Admin Dashboard - FreelanceX</title>
      </Head>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Admin Dashboard</h1>
            <p className="text-lg text-gray-600">Monitor and manage AI systems</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={refreshing}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={refreshModels}
              disabled={refreshing}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              Refresh Models
            </button>
            <button
              onClick={clearCache}
              disabled={refreshing}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              Clear Cache
            </button>
          </div>
        </div>

        {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
        {success && <Toast message={success} type="success" onClose={() => setSuccess(null)} />}

        {/* System Status */}
        {systemStatus && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">System Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Matching Service</h3>
                  {getStatusIcon(systemStatus.matching_service.status)}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Response: {systemStatus.matching_service.response_time_ms}ms</div>
                  <div>Processed: {systemStatus.matching_service.processed_today}</div>
                  <div>Error Rate: {(systemStatus.matching_service.error_rate * 100).toFixed(1)}%</div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Content Generation</h3>
                  {getStatusIcon(systemStatus.content_generation.status)}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Response: {systemStatus.content_generation.response_time_ms}ms</div>
                  <div>Processed: {systemStatus.content_generation.processed_today}</div>
                  <div>Error Rate: {(systemStatus.content_generation.error_rate * 100).toFixed(1)}%</div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Personality Analysis</h3>
                  {getStatusIcon(systemStatus.personality_analysis.status)}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Response: {systemStatus.personality_analysis.response_time_ms}ms</div>
                  <div>Processed: {systemStatus.personality_analysis.processed_today}</div>
                  <div>Error Rate: {(systemStatus.personality_analysis.error_rate * 100).toFixed(1)}%</div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Demand Prediction</h3>
                  {getStatusIcon(systemStatus.demand_prediction.status)}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Updated: {new Date(systemStatus.demand_prediction.last_updated).toLocaleDateString()}</div>
                  <div>Accuracy: {(systemStatus.demand_prediction.accuracy_score * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Metrics Overview */}
          {metrics && (
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Today's Metrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{metrics.total_matches_today}</div>
                  <div className="text-sm text-gray-600">Total Matches</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{(metrics.avg_compatibility_score * 100).toFixed(0)}%</div>
                  <div className="text-sm text-gray-600">Avg Compatibility</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">{metrics.content_generations_today}</div>
                  <div className="text-sm text-gray-600">Content Generated</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">{metrics.personality_analyses_today}</div>
                  <div className="text-sm text-gray-600">Personality Analysis</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">{metrics.successful_matches}</div>
                  <div className="text-sm text-gray-600">Successful Matches</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{metrics.system_uptime}</div>
                  <div className="text-sm text-gray-600">System Uptime</div>
                </div>
              </div>
            </div>
          )}

          {/* AI Models */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">AI Models</h2>
            <div className="space-y-4">
              {models.map((model, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{model.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(model.status)}`}>
                      {model.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Version: {model.version}</div>
                    <div>Accuracy: {(model.accuracy * 100).toFixed(1)}%</div>
                    <div>Trained: {new Date(model.last_trained).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No recent activity</p>
            ) : (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      activity.success ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <div className="font-medium text-gray-900">{activity.description}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(activity.timestamp).toLocaleString()}
                        {activity.user_id && ` • User: ${activity.user_id}`}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activity.type === 'error' ? 'bg-red-100 text-red-800' :
                    activity.type === 'match' ? 'bg-blue-100 text-blue-800' :
                    activity.type === 'content' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {activity.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
