import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminLayout from '../components/AdminLayout';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AISystemsPage() {
  const { admin, token, isLoading } = useAdminAuth();
  const router = useRouter();
  
  const [aiStats, setAiStats] = useState({
    total_requests: 0,
    requests_today: 0,
    avg_response_time: 0,
    success_rate: 95.8,
    active_models: 3
  });

  useEffect(() => {
    if (!isLoading && !admin) {
      router.push('/login');
      return;
    }
  }, [admin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <AdminLayout title="AI Systems">
      <Head>
        <title>AI Systems - Admin Dashboard</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Systems Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage AI matching and content generation systems</p>
        </div>

        {/* AI Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total AI Requests</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">{aiStats.total_requests.toLocaleString()}</p>
              </div>
              <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Requests Today</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{aiStats.requests_today}</p>
              </div>
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Success Rate</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{aiStats.success_rate}%</p>
              </div>
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* AI Models */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Active AI Models</h2>
          <div className="space-y-4">
            {[
              { name: 'Freelancer Matching AI', status: 'active', accuracy: 94.5, requests: 1247 },
              { name: 'Content Generation AI', status: 'active', accuracy: 96.2, requests: 892 },
              { name: 'Skill Assessment AI', status: 'active', accuracy: 91.8, requests: 534 }
            ].map((model) => (
              <div key={model.name} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-gray-900">{model.name}</h3>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
                        {model.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Accuracy</p>
                        <p className="text-lg font-semibold text-gray-900">{model.accuracy}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Requests</p>
                        <p className="text-lg font-semibold text-gray-900">{model.requests.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                      Monitor
                    </button>
                    <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">
                      Settings
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">System Health Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Response Time Distribution</h3>
              <div className="space-y-2">
                {[
                  { range: '< 100ms', percentage: 45 },
                  { range: '100-500ms', percentage: 35 },
                  { range: '500ms-1s', percentage: 15 },
                  { range: '> 1s', percentage: 5 }
                ].map((item) => (
                  <div key={item.range}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{item.range}</span>
                      <span className="font-medium">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Request Types</h3>
              <div className="space-y-2">
                {[
                  { type: 'Matching', count: 1247, color: 'blue' },
                  { type: 'Content Generation', count: 892, color: 'green' },
                  { type: 'Skill Assessment', count: 534, color: 'purple' },
                  { type: 'Other', count: 127, color: 'gray' }
                ].map((item) => (
                  <div key={item.type} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium text-gray-700">{item.type}</span>
                    <span className={`text-sm font-semibold text-${item.color}-600`}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
