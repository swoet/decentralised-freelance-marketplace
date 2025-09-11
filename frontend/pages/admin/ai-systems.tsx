import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import AdminLayout from '../../components/AdminLayout';
import {
  CpuChipIcon,
  UserGroupIcon,
  PlayIcon,
  StopIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  BoltIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  DocumentMagnifyingGlassIcon,
  BeakerIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface PersonalityAnalysis {
  user_id: string;
  user_email: string;
  personality_profile: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
    analysis_confidence: number;
    data_points_analyzed: number;
    last_analysis: string;
  };
}

const AISystemsPage: NextPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<Set<string>>(new Set());
  const [bulkOperating, setBulkOperating] = useState(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [notifications, setNotifications] = useState<Array<{id: string, type: 'success' | 'error' | 'info', message: string}>>([]);

  useEffect(() => {
    fetchUsers();
    fetchSystemStatus();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/v1/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      addNotification('error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/v1/dashboard/admin/ai-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setSystemStatus(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  };

  const analyzeUser = async (userId: string) => {
    setAnalyzing(prev => new Set([...prev, userId]));
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/v1/dashboard/admin/ai/analyze-user/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      if (result.success) {
        addNotification('success', `Analysis completed for ${result.user_email}`);
        await fetchSystemStatus(); // Refresh system status
      } else {
        addNotification('error', result.message || 'Analysis failed');
      }
    } catch (error) {
      addNotification('error', 'Error analyzing user');
    } finally {
      setAnalyzing(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const bulkAnalyzeUsers = async () => {
    if (selectedUsers.size === 0) {
      addNotification('error', 'No users selected');
      return;
    }

    setBulkOperating(true);
    let successCount = 0;
    let errorCount = 0;

    for (const userId of selectedUsers) {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/v1/dashboard/admin/ai/analyze-user/${userId}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }

      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setBulkOperating(false);
    setSelectedUsers(new Set());
    addNotification('success', `Bulk analysis complete: ${successCount} successful, ${errorCount} failed`);
    await fetchSystemStatus();
  };

  const refreshAllAISystems = async () => {
    setBulkOperating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/v1/dashboard/admin/ai/refresh-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      if (result.success) {
        addNotification('success', `Successfully refreshed ${result.total_operations} AI operations`);
        await fetchSystemStatus();
      } else {
        addNotification('error', result.message || 'Failed to refresh AI systems');
      }
    } catch (error) {
      addNotification('error', 'Error refreshing AI systems');
    } finally {
      setBulkOperating(false);
    }
  };

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 15);
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const selectAllUsers = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout title="AI Systems Management">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400 mx-auto"></div>
            <p className="text-white mt-4 text-xl">Loading AI Systems...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="AI Systems Management">
      <Head>
        <title>AI Systems Management - Admin Dashboard</title>
        <meta name="description" content="Advanced AI systems management and user analysis" />
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
                <h1 className="text-3xl font-bold text-white">AI Systems Management</h1>
                <p className="text-slate-300">Advanced personality analysis and bulk operations</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={refreshAllAISystems}
                disabled={bulkOperating}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors duration-200 flex items-center"
              >
                {bulkOperating ? (
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <BoltIcon className="h-4 w-4 mr-2" />
                )}
                {bulkOperating ? 'Refreshing...' : 'Refresh All AI'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Status Cards */}
        {systemStatus && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">System Health</p>
                  <p className="text-2xl font-bold text-white mt-2">
                    {systemStatus.system_status?.overall_status === 'healthy' ? 'Healthy' : 'Attention Required'}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${systemStatus.system_status?.overall_status === 'healthy' ? 'bg-green-600/20' : 'bg-yellow-600/20'}`}>
                  <ShieldCheckIcon className={`h-8 w-8 ${systemStatus.system_status?.overall_status === 'healthy' ? 'text-green-400' : 'text-yellow-400'}`} />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Profiles Analyzed</p>
                  <p className="text-2xl font-bold text-white mt-2">
                    {systemStatus.statistics?.personality_profiles_analyzed || 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-600/20">
                  <UserGroupIcon className="h-8 w-8 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Compatibility Scores</p>
                  <p className="text-2xl font-bold text-white mt-2">
                    {systemStatus.statistics?.compatibility_scores_calculated || 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-600/20">
                  <ChartBarIcon className="h-8 w-8 text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Recent Activity</p>
                  <p className="text-2xl font-bold text-white mt-2">
                    {systemStatus.recent_activity?.profiles_analyzed_24h || 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-orange-600/20">
                  <ClockIcon className="h-8 w-8 text-orange-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Management Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <UserGroupIcon className="h-8 w-8 text-purple-400 mr-3" />
              User Analysis Management
            </h2>
            <div className="flex space-x-3">
              {selectedUsers.size > 0 && (
                <button
                  onClick={bulkAnalyzeUsers}
                  disabled={bulkOperating}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors duration-200 flex items-center"
                >
                  {bulkOperating ? (
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <BeakerIcon className="h-4 w-4 mr-2" />
                  )}
                  Analyze Selected ({selectedUsers.size})
                </button>
              )}
            </div>
          </div>

          {/* Search and Filter */}
          <div className="mb-6">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search users by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                  onChange={selectAllUsers}
                  className="rounded border-slate-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-800"
                />
                <span className="ml-2 text-slate-300">
                  Select All ({filteredUsers.length})
                </span>
              </label>
              {selectedUsers.size > 0 && (
                <span className="text-purple-400 font-medium">
                  {selectedUsers.size} selected
                </span>
              )}
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-4 px-4 text-slate-300 font-medium">Select</th>
                  <th className="text-left py-4 px-4 text-slate-300 font-medium">User</th>
                  <th className="text-left py-4 px-4 text-slate-300 font-medium">Role</th>
                  <th className="text-left py-4 px-4 text-slate-300 font-medium">Created</th>
                  <th className="text-left py-4 px-4 text-slate-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="rounded border-slate-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-800"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-white font-medium">{user.full_name}</p>
                        <p className="text-slate-400 text-sm">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-red-600/20 text-red-400' :
                        user.role === 'freelancer' ? 'bg-blue-600/20 text-blue-400' :
                        'bg-green-600/20 text-green-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-slate-300 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => analyzeUser(user.id)}
                          disabled={analyzing.has(user.id)}
                          className="p-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors duration-200"
                          title="Analyze User Personality"
                        >
                          {analyzing.has(user.id) ? (
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          ) : (
                            <DocumentMagnifyingGlassIcon className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          className="p-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors duration-200"
                          title="View Profile"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <UserGroupIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">
                  {searchTerm ? 'No users found matching your search.' : 'No users available.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AISystemsPage;
