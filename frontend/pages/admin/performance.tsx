import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import AdminLayout from '../../components/AdminLayout';
import {
  ChartBarIcon,
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ArrowPathIcon,
  CalendarIcon,
  UserGroupIcon,
  StarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

interface PerformanceMetrics {
  average_compatibility_score: number;
  average_predicted_success_rate: number;
  average_predicted_satisfaction: number;
  average_risk_score: number;
  high_quality_matches: number;
  total_matches_calculated: number;
  high_quality_match_ratio: number;
  status: string;
}

interface TimeSeriesData {
  labels: string[];
  compatibility_scores: number[];
  success_rates: number[];
  satisfaction_scores: number[];
  risk_scores: number[];
}

const PerformanceAdminPage: NextPage = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [notifications, setNotifications] = useState<Array<{id: string, type: 'success' | 'error' | 'info', message: string}>>([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [metricsResponse] = await Promise.all([
        fetch('/api/v1/ai/stats/matching-performance', { headers }),
      ]);

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
        
        // Generate mock time series data (in production, this would come from your backend)
        generateTimeSeriesData();
      }
    } catch (error) {
      addNotification('error', 'Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  };

  // Generate mock time series data for demonstration
  const generateTimeSeriesData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const labels = [];
    const compatibility_scores = [];
    const success_rates = [];
    const satisfaction_scores = [];
    const risk_scores = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // Generate realistic trending data
      const trend = Math.sin((days - i) / days * Math.PI) * 10;
      compatibility_scores.push(75 + trend + Math.random() * 10);
      success_rates.push(80 + trend + Math.random() * 8);
      satisfaction_scores.push(4.0 + (trend / 20) + Math.random() * 0.5);
      risk_scores.push(25 - trend + Math.random() * 8);
    }

    setTimeSeriesData({
      labels,
      compatibility_scores,
      success_rates,
      satisfaction_scores,
      risk_scores,
    });
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    addNotification('success', 'Performance data refreshed');
  };

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 15);
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Chart configurations
  const compatibilityTrendData = timeSeriesData ? {
    labels: timeSeriesData.labels,
    datasets: [
      {
        label: 'Compatibility Score',
        data: timeSeriesData.compatibility_scores,
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Success Rate',
        data: timeSeriesData.success_rates,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  } : null;

  const satisfactionRiskData = timeSeriesData ? {
    labels: timeSeriesData.labels,
    datasets: [
      {
        label: 'Satisfaction Score',
        data: timeSeriesData.satisfaction_scores,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Risk Score',
        data: timeSeriesData.risk_scores,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  } : null;

  const matchQualityDistribution = metrics ? {
    labels: ['High Quality (>80%)', 'Good Quality (60-80%)', 'Average Quality (<60%)'],
    datasets: [{
      data: [
        metrics.high_quality_matches,
        Math.floor((metrics.total_matches_calculated - metrics.high_quality_matches) * 0.6),
        Math.floor((metrics.total_matches_calculated - metrics.high_quality_matches) * 0.4),
      ],
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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#e2e8f0', font: { size: 12 } }
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
  };

  const dualAxisOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        ticks: { color: '#e2e8f0' },
        grid: { drawOnChartArea: false },
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Performance Analytics">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400 mx-auto"></div>
            <p className="text-white mt-4 text-xl">Loading Performance Data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Performance Analytics">
      <Head>
        <title>Performance Analytics - Admin Dashboard</title>
        <meta name="description" content="AI matching performance analytics and trends" />
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
              <ChartBarIcon className="h-10 w-10 text-blue-400 mr-4" />
              <div>
                <h1 className="text-3xl font-bold text-white">Performance Analytics</h1>
                <p className="text-slate-300">AI matching performance trends and quality metrics</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <div className="flex bg-slate-700/50 rounded-lg">
                {['7d', '30d', '90d'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range as any)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      timeRange === range
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                    }`}
                  >
                    {range.toUpperCase()}
                  </button>
                ))}
              </div>
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors duration-200 flex items-center"
              >
                {refreshing ? (
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                )}
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Avg Compatibility</p>
                  <p className="text-3xl font-bold text-green-400 mt-2">
                    {metrics.average_compatibility_score.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-600/20">
                  <TrendingUpIcon className="h-8 w-8 text-green-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUpIcon className="h-4 w-4 text-green-400 mr-2" />
                <span className="text-slate-300">+2.3% from last period</span>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Success Rate</p>
                  <p className="text-3xl font-bold text-blue-400 mt-2">
                    {metrics.average_predicted_success_rate.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-600/20">
                  <StarIcon className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUpIcon className="h-4 w-4 text-blue-400 mr-2" />
                <span className="text-slate-300">+1.8% from last period</span>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Satisfaction Score</p>
                  <p className="text-3xl font-bold text-purple-400 mt-2">
                    {metrics.average_predicted_satisfaction.toFixed(1)}/5
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-600/20">
                  <UserGroupIcon className="h-8 w-8 text-purple-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUpIcon className="h-4 w-4 text-purple-400 mr-2" />
                <span className="text-slate-300">+0.2 from last period</span>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Risk Score</p>
                  <p className="text-3xl font-bold text-yellow-400 mt-2">
                    {metrics.average_risk_score.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-600/20">
                  <ExclamationTriangleIcon className="h-8 w-8 text-yellow-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingDownIcon className="h-4 w-4 text-green-400 mr-2" />
                <span className="text-slate-300">-1.5% from last period (good)</span>
              </div>
            </div>
          </div>
        )}

        {/* Time Series Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Compatibility & Success Trends */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Compatibility & Success Trends</h3>
              <CalendarIcon className="h-6 w-6 text-blue-400" />
            </div>
            {compatibilityTrendData ? (
              <div className="h-80">
                <Line data={compatibilityTrendData} options={chartOptions} />
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-400">
                <p>Loading trend data...</p>
              </div>
            )}
          </div>

          {/* Satisfaction vs Risk */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Satisfaction vs Risk Analysis</h3>
              <ChartBarIcon className="h-6 w-6 text-purple-400" />
            </div>
            {satisfactionRiskData ? (
              <div className="h-80">
                <Line data={satisfactionRiskData} options={dualAxisOptions} />
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-400">
                <p>Loading analysis data...</p>
              </div>
            )}
          </div>
        </div>

        {/* Match Quality Distribution */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Match Quality Distribution</h3>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-300">
                Total Matches: {metrics?.total_matches_calculated || 0}
              </span>
              <span className="text-sm text-green-400">
                High Quality: {metrics?.high_quality_match_ratio.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80">
              {matchQualityDistribution ? (
                <Doughnut 
                  data={matchQualityDistribution}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: { color: '#e2e8f0', font: { size: 12 } }
                      }
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <p>Loading distribution data...</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Quality Insights</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Peak Performance Hour:</span>
                    <span className="text-green-400">2:00 PM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Best Match Day:</span>
                    <span className="text-blue-400">Wednesday</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Avg Response Time:</span>
                    <span className="text-purple-400">1.2 seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">System Uptime:</span>
                    <span className="text-green-400">99.8%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default PerformanceAdminPage;
