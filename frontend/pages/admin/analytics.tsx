import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../../components/Navbar';
import Toast from '../../components/Toast';

interface PlatformMetrics {
  total_users: number;
  active_users: number;
  total_projects: number;
  completed_projects: number;
  total_revenue: number;
  monthly_growth: number;
  user_retention_rate: number;
  avg_project_value: number;
}

interface SkillDemand {
  skill: string;
  demand_score: number;
  projects_count: number;
  avg_rate: number;
  growth_trend: 'up' | 'down' | 'stable';
}

interface GeographicData {
  country: string;
  users: number;
  projects: number;
  revenue: number;
  avg_project_value: number;
}

interface TimeSeriesData {
  date: string;
  users: number;
  projects: number;
  revenue: number;
  matches: number;
}

interface UserEngagement {
  daily_active_users: number;
  weekly_active_users: number;
  monthly_active_users: number;
  avg_session_duration: number;
  bounce_rate: number;
  feature_usage: {
    ai_matching: number;
    wallet_connection: number;
    project_creation: number;
    proposal_submission: number;
  };
}

export default function AnalyticsDashboard() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const [platformMetrics, setPlatformMetrics] = useState<PlatformMetrics | null>(null);
  const [skillDemand, setSkillDemand] = useState<SkillDemand[]>([]);
  const [geographicData, setGeographicData] = useState<GeographicData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [userEngagement, setUserEngagement] = useState<UserEngagement | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }
    
    if (token) {
      fetchAnalyticsData();
    }
  }, [user, token, router, selectedTimeRange]);

  const fetchAnalyticsData = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const [metricsRes, skillsRes, geoRes, timeSeriesRes, engagementRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/analytics/platform-metrics?range=${selectedTimeRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/analytics/skill-demand?range=${selectedTimeRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/analytics/geographic?range=${selectedTimeRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/analytics/time-series?range=${selectedTimeRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/analytics/user-engagement?range=${selectedTimeRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setPlatformMetrics(data);
      }

      if (skillsRes.ok) {
        const data = await skillsRes.json();
        setSkillDemand(data.skills || []);
      }

      if (geoRes.ok) {
        const data = await geoRes.json();
        setGeographicData(data.countries || []);
      }

      if (timeSeriesRes.ok) {
        const data = await timeSeriesRes.json();
        setTimeSeriesData(data.data || []);
      }

      if (engagementRes.ok) {
        const data = await engagementRes.json();
        setUserEngagement(data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format: 'csv' | 'pdf') => {
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/analytics/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format,
          time_range: selectedTimeRange,
          include: ['metrics', 'skills', 'geographic', 'engagement']
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${selectedTimeRange}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      setError(`Failed to export data as ${format.toUpperCase()}`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
        </svg>;
      case 'down':
        return <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
        </svg>;
      default:
        return <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>;
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
            <p className="text-gray-600">Admin access required to view analytics.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Analytics - Loading</title>
        </Head>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Advanced Analytics - FreelanceX</title>
      </Head>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Advanced Analytics</h1>
            <p className="text-lg text-gray-600">Business intelligence and performance metrics</p>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={() => exportData('csv')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Export CSV
            </button>
            <button
              onClick={() => exportData('pdf')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Export PDF
            </button>
          </div>
        </div>

        {error && <Toast message={error} type="error" onClose={() => setError(null)} />}

        {/* Platform Metrics Overview */}
        {platformMetrics && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Platform Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{platformMetrics.total_users.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Users</div>
                <div className="text-xs text-green-600 mt-1">
                  {platformMetrics.active_users.toLocaleString()} active
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{platformMetrics.total_projects.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Projects</div>
                <div className="text-xs text-green-600 mt-1">
                  {formatPercentage(platformMetrics.completed_projects / platformMetrics.total_projects)} completed
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{formatCurrency(platformMetrics.total_revenue)}</div>
                <div className="text-sm text-gray-600">Total Revenue</div>
                <div className="text-xs text-green-600 mt-1">
                  +{formatPercentage(platformMetrics.monthly_growth)} this month
                </div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600">{formatCurrency(platformMetrics.avg_project_value)}</div>
                <div className="text-sm text-gray-600">Avg Project Value</div>
                <div className="text-xs text-blue-600 mt-1">
                  {formatPercentage(platformMetrics.user_retention_rate)} retention
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User Engagement */}
          {userEngagement && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">User Engagement</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Daily Active Users</span>
                  <span className="font-semibold">{userEngagement.daily_active_users.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Weekly Active Users</span>
                  <span className="font-semibold">{userEngagement.weekly_active_users.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monthly Active Users</span>
                  <span className="font-semibold">{userEngagement.monthly_active_users.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Session Duration</span>
                  <span className="font-semibold">{Math.round(userEngagement.avg_session_duration / 60)}m</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Bounce Rate</span>
                  <span className="font-semibold">{formatPercentage(userEngagement.bounce_rate)}</span>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-3">Feature Usage</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">AI Matching</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${userEngagement.feature_usage.ai_matching}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{userEngagement.feature_usage.ai_matching}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Wallet Connection</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${userEngagement.feature_usage.wallet_connection}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{userEngagement.feature_usage.wallet_connection}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Project Creation</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${userEngagement.feature_usage.project_creation}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{userEngagement.feature_usage.project_creation}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Proposal Submission</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-600 h-2 rounded-full" 
                            style={{ width: `${userEngagement.feature_usage.proposal_submission}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{userEngagement.feature_usage.proposal_submission}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top Skills in Demand */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Skills in Demand</h2>
            <div className="space-y-3">
              {skillDemand.slice(0, 8).map((skill, index) => (
                <div key={index} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{skill.skill}</span>
                      {getTrendIcon(skill.growth_trend)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {skill.projects_count} projects • Avg: {formatCurrency(skill.avg_rate)}/hr
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">{skill.demand_score.toFixed(1)}</div>
                    <div className="text-xs text-gray-600">Demand Score</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Geographic Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {geographicData.slice(0, 9).map((country, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{country.country}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Users:</span>
                    <span className="font-medium">{country.users.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Projects:</span>
                    <span className="font-medium">{country.projects.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-medium">{formatCurrency(country.revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Value:</span>
                    <span className="font-medium">{formatCurrency(country.avg_project_value)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time Series Chart Placeholder */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Performance Over Time</h2>
          {timeSeriesData.length > 0 ? (
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Chart Component</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Time series data available for {timeSeriesData.length} data points
                  <br />
                  Integrate with Chart.js or similar library for visualization
                </p>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-600">No time series data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
