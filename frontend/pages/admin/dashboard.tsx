import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import AdminLayout from '../../components/AdminLayout';
import { 
  ChartBarIcon, 
  CpuChipIcon, 
  UserGroupIcon, 
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  ShieldCheckIcon,
  DocumentChartBarIcon,
  BeakerIcon,
  CommandLineIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

interface AIStats {
  personality_profiles_analyzed: number;
  compatibility_scores_calculated: number;
  work_patterns_tracked: number;
  skill_predictions_active: number;
  recent_activity: {
    profiles_analyzed_last_7_days: number;
    compatibility_calculated_last_7_days: number;
  };
  system_status: string;
  last_updated: string;
}

interface PerformanceStats {
  average_compatibility_score: number;
  average_predicted_success_rate: number;
  average_predicted_satisfaction: number;
  average_risk_score: number;
  high_quality_matches: number;
  total_matches_calculated: number;
  high_quality_match_ratio: number;
  status: string;
}

interface PersonalityStats {
  total_profiles: number;
  average_traits: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  confidence_distribution: {
    [key: string]: number;
  };
  status: string;
}

interface SkillDemand {
  predictions: Array<{
    skill_name: string;
    skill_category: string;
    current_demand_score: number;
    predicted_demand_1m: number;
    predicted_demand_3m: number;
    predicted_demand_6m: number;
    predicted_demand_1y: number;
    competition_level: string;
    learning_difficulty: number;
    prediction_confidence: number;
  }>;
  total_count: number;
  status: string;
}

const AdminDashboard: NextPage = () => {
  const [aiStats, setAiStats] = useState<AIStats | null>(null);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [personalityStats, setPersonalityStats] = useState<PersonalityStats | null>(null);
  const [skillDemand, setSkillDemand] = useState<SkillDemand | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Array<{id: string, type: 'success' | 'error' | 'info', message: string}>>([]);

  // Fetch all data
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [aiResponse, performanceResponse, personalityResponse, skillResponse] = await Promise.all([
        fetch('/api/v1/dashboard/admin/ai-status', { headers }),
        fetch('/api/v1/ai/stats/matching-performance', { headers }),
        fetch('/api/v1/ai/personality/stats', { headers }),
        fetch('/api/v1/ai/skill-demand', { headers }),
      ]);

      if (aiResponse.ok) setAiStats(await aiResponse.json());
      if (performanceResponse.ok) setPerformanceStats(await performanceResponse.json());
      if (personalityResponse.ok) setPersonalityStats(await personalityResponse.json());
      if (skillResponse.ok) setSkillDemand(await skillResponse.json());
    } catch (error) {
      console.error('Error fetching data:', error);
      addNotification('error', 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Refresh AI systems
  const refreshAISystems = async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/v1/dashboard/admin/ai/refresh-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      if (result.success) {
        addNotification('success', `Successfully refreshed ${result.total_operations} AI operations`);
        await fetchData(); // Refresh dashboard data
      } else {
        addNotification('error', result.message || 'Failed to refresh AI systems');
      }
    } catch (error) {
      addNotification('error', 'Error refreshing AI systems');
    } finally {
      setRefreshing(false);
    }
  };

  // Refresh skill demand
  const refreshSkillDemand = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/v1/ai/skill-demand/refresh', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      if (result.success) {
        addNotification('success', `Updated ${result.updated_count} skill predictions`);
        await fetchData();
      } else {
        addNotification('error', 'Failed to refresh skill demand');
      }
    } catch (error) {
      addNotification('error', 'Error refreshing skill demand');
    }
  };

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 15);
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Chart configurations
  const personalityChartData = personalityStats ? {
    labels: ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism'],
    datasets: [{
      label: 'Average Personality Traits',
      data: [
        personalityStats.average_traits.openness,
        personalityStats.average_traits.conscientiousness,
        personalityStats.average_traits.extraversion,
        personalityStats.average_traits.agreeableness,
        personalityStats.average_traits.neuroticism,
      ],
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(34, 197, 94, 0.8)',
      ],
      borderColor: [
        'rgba(99, 102, 241, 1)',
        'rgba(168, 85, 247, 1)',
        'rgba(236, 72, 153, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(34, 197, 94, 1)',
      ],
      borderWidth: 2,
    }]
  } : null;

  const skillDemandChartData = skillDemand && skillDemand.predictions.length > 0 ? {
    labels: skillDemand.predictions.slice(0, 10).map(s => s.skill_name),
    datasets: [
      {
        label: 'Current Demand',
        data: skillDemand.predictions.slice(0, 10).map(s => s.current_demand_score),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
      {
        label: '6M Prediction',
        data: skillDemand.predictions.slice(0, 10).map(s => s.predicted_demand_6m),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
      }
    ]
  } : null;

  const confidenceDistributionData = personalityStats ? {
    labels: Object.keys(personalityStats.confidence_distribution),
    datasets: [{
      data: Object.values(personalityStats.confidence_distribution),
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
      ],
      borderColor: [
        'rgba(34, 197, 94, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(239, 68, 68, 1)',
      ],
      borderWidth: 2,
    }]
  } : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400 mx-auto"></div>
          <p className="text-white mt-4 text-xl">Loading AI Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="AI Command Center">
      <Head>
        <title>AI Admin Dashboard - Revolutionary Freelance Marketplace</title>
        <meta name="description" content="Advanced AI system management dashboard" />
      </Head>
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`px-6 py-4 rounded-lg shadow-lg transition-all duration-300 ${
                notification.type === 'success' ? 'bg-green-600 text-white' :
                notification.type === 'error' ? 'bg-red-600 text-white' :
                'bg-blue-600 text-white'
              }`}
            >
              <div className="flex items-center">
                {notification.type === 'success' && <CheckCircleIcon className="h-5 w-5 mr-2" />}
                {notification.type === 'error' && <ExclamationTriangleIcon className="h-5 w-5 mr-2" />}
                {notification.type === 'info' && <ClockIcon className="h-5 w-5 mr-2" />}
                <p className="font-medium">{notification.message}</p>
              </div>
            </div>
          ))}
      </div>

      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <CpuChipIcon className="h-10 w-10 text-purple-400 mr-4" />
              <div>
                <h1 className="text-3xl font-bold text-white">AI Command Center</h1>
                <p className="text-slate-300">Revolutionary AI-Powered Marketplace Management</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={refreshSkillDemand}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center"
              >
                <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
                Refresh Skills
              </button>
              <button
                onClick={refreshAISystems}
                disabled={refreshing}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors duration-200 flex items-center"
              >
                {refreshing ? (
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <BoltIcon className="h-4 w-4 mr-2" />
                )}
                {refreshing ? 'Refreshing...' : 'Refresh All AI'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* System Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* AI System Status */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">AI System Status</p>
                  <p className="text-2xl font-bold text-white mt-2">
                    {aiStats?.system_status === 'healthy' ? 'Healthy' : 'Needs Attention'}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${aiStats?.system_status === 'healthy' ? 'bg-green-600/20' : 'bg-yellow-600/20'}`}>
                  <ShieldCheckIcon className={`h-8 w-8 ${aiStats?.system_status === 'healthy' ? 'text-green-400' : 'text-yellow-400'}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <div className={`w-2 h-2 rounded-full mr-2 ${aiStats?.system_status === 'healthy' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                <span className="text-slate-300">
                  {aiStats?.personality_profiles_analyzed || 0} profiles analyzed
                </span>
              </div>
            </div>

            {/* Compatibility Scores */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Match Quality</p>
                  <p className="text-2xl font-bold text-white mt-2">
                    {performanceStats?.high_quality_match_ratio.toFixed(1) || 0}%
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-600/20">
                  <DocumentChartBarIcon className="h-8 w-8 text-purple-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-400 mr-2" />
                <span className="text-slate-300">
                  {performanceStats?.total_matches_calculated || 0} total matches
                </span>
              </div>
            </div>

            {/* Active Skills */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Skill Predictions</p>
                  <p className="text-2xl font-bold text-white mt-2">
                    {aiStats?.skill_predictions_active || 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-600/20">
                  <BeakerIcon className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ChartBarIcon className="h-4 w-4 text-blue-400 mr-2" />
                <span className="text-slate-300">
                  {skillDemand?.total_count || 0} active predictions
                </span>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Recent Activity</p>
                  <p className="text-2xl font-bold text-white mt-2">
                    {(aiStats?.recent_activity.profiles_analyzed_last_7_days || 0) + 
                     (aiStats?.recent_activity.compatibility_calculated_last_7_days || 0)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-orange-600/20">
                  <ClockIcon className="h-8 w-8 text-orange-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <EyeIcon className="h-4 w-4 text-orange-400 mr-2" />
                <span className="text-slate-300">Last 7 days</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Personality Analysis Chart */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Personality Analysis Distribution</h3>
                <UserGroupIcon className="h-6 w-6 text-purple-400" />
              </div>
              {personalityChartData ? (
                <div className="h-80">
                  <Doughnut 
                    data={personalityChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            color: '#e2e8f0',
                            font: { size: 12 }
                          }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <BeakerIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No personality data available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Skill Demand Trends */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Top Skills Demand Trends</h3>
                <ArrowTrendingUpIcon className="h-6 w-6 text-blue-400" />
              </div>
              {skillDemandChartData ? (
                <div className="h-80">
                  <Bar 
                    data={skillDemandChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                          labels: {
                            color: '#e2e8f0',
                            font: { size: 12 }
                          }
                        }
                      },
                      scales: {
                        x: {
                          ticks: { color: '#e2e8f0' },
                          grid: { color: 'rgba(226, 232, 240, 0.1)' }
                        },
                        y: {
                          ticks: { color: '#e2e8f0' },
                          grid: { color: 'rgba(226, 232, 240, 0.1)' }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <ChartBarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No skill demand data available</p>
                    <button 
                      onClick={refreshSkillDemand}
                      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                    >
                      Generate Predictions
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          {performanceStats && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <DocumentChartBarIcon className="h-6 w-6 text-green-400 mr-2" />
                AI Performance Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400">{performanceStats.average_compatibility_score.toFixed(1)}%</p>
                  <p className="text-slate-300 text-sm mt-1">Avg Compatibility</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-400">{performanceStats.average_predicted_success_rate.toFixed(1)}%</p>
                  <p className="text-slate-300 text-sm mt-1">Success Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-400">{performanceStats.average_predicted_satisfaction.toFixed(1)}/5</p>
                  <p className="text-slate-300 text-sm mt-1">Satisfaction</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-400">{performanceStats.average_risk_score.toFixed(1)}%</p>
                  <p className="text-slate-300 text-sm mt-1">Risk Score</p>
                </div>
              </div>
            </div>
          )}

          {/* Confidence Distribution */}
          {personalityStats && personalityStats.confidence_distribution && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <ShieldCheckIcon className="h-6 w-6 text-green-400 mr-2" />
                Analysis Confidence Distribution
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64">
                  {confidenceDistributionData && (
                    <Doughnut 
                      data={confidenceDistributionData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right',
                            labels: {
                              color: '#e2e8f0',
                              font: { size: 12 }
                            }
                          }
                        }
                      }}
                    />
                  )}
                </div>
                <div className="space-y-4">
                  {Object.entries(personalityStats.confidence_distribution).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between">
                      <span className="text-slate-300">{level}</span>
                      <span className="text-white font-semibold">{count} profiles</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
