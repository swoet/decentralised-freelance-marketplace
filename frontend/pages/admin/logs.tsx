import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import AdminLayout from '../../components/AdminLayout';
import {
  ClipboardDocumentListIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  category: string;
  message: string;
  user_id?: string;
  user_email?: string;
  ip_address?: string;
  metadata: any;
}

const LogsAdminPage: NextPage = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchLogs();
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 15000);
      return () => clearInterval(interval);
    }
  }, [levelFilter, categoryFilter, timeFilter, autoRefresh]);

  const fetchLogs = async () => {
    try {
      // Mock log data - in production, this would come from your backend
      const mockLogs: LogEntry[] = Array.from({ length: 50 }, (_, i) => {
        const levels = ['info', 'warning', 'error'] as const;
        const categories = ['auth', 'ai_matching', 'database', 'api', 'system', 'user_action'];
        const messages = [
          'User authentication successful',
          'AI personality analysis completed',
          'Database connection established',
          'API request processed',
          'System backup completed',
          'User profile updated',
          'High memory usage detected',
          'Failed login attempt',
          'Migration executed successfully',
          'Cache cleared',
        ];

        const level = levels[Math.floor(Math.random() * levels.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        return {
          id: `log_${i}`,
          timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          level,
          category,
          message,
          user_id: Math.random() > 0.5 ? `user_${Math.floor(Math.random() * 100)}` : undefined,
          user_email: Math.random() > 0.5 ? `user${Math.floor(Math.random() * 100)}@example.com` : undefined,
          ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
          metadata: {
            duration: Math.floor(Math.random() * 1000),
            status_code: [200, 201, 400, 401, 500][Math.floor(Math.random() * 5)],
          }
        };
      }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setLogs(mockLogs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.user_email && log.user_email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const exportLogs = () => {
    const csv = [
      'Timestamp,Level,Category,Message,User Email,IP Address',
      ...filteredLogs.map(log => 
        `${log.timestamp},${log.level},${log.category},"${log.message}",${log.user_email || ''},${log.ip_address}`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-900/20 text-red-400 border-red-500';
      case 'warning': return 'bg-yellow-900/20 text-yellow-400 border-yellow-500';
      default: return 'bg-blue-900/20 text-blue-400 border-blue-500';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return ExclamationTriangleIcon;
      case 'warning': return ExclamationTriangleIcon;
      default: return InformationCircleIcon;
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Activity Logs">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400 mx-auto"></div>
            <p className="text-white mt-4 text-xl">Loading Activity Logs...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Activity Logs">
      <Head>
        <title>Activity Logs - Admin Dashboard</title>
        <meta name="description" content="System activity logs and audit trails" />
      </Head>

      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <ClipboardDocumentListIcon className="h-10 w-10 text-orange-400 mr-4" />
              <div>
                <h1 className="text-3xl font-bold text-white">Activity Logs</h1>
                <p className="text-slate-300">System activity monitoring and audit trails</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-slate-600 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-slate-300">Auto Refresh</span>
              </label>
              <button
                onClick={exportLogs}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Export CSV
              </button>
              <button
                onClick={fetchLogs}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors duration-200 flex items-center"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400"
              />
            </div>
            
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
            >
              <option value="all">All Categories</option>
              <option value="auth">Authentication</option>
              <option value="ai_matching">AI Matching</option>
              <option value="database">Database</option>
              <option value="api">API</option>
              <option value="system">System</option>
              <option value="user_action">User Action</option>
            </select>

            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
          
          <div className="mt-4 text-sm text-slate-400">
            Showing {filteredLogs.length} of {logs.length} log entries
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="text-left py-4 px-6 text-slate-300 font-medium">Timestamp</th>
                  <th className="text-left py-4 px-6 text-slate-300 font-medium">Level</th>
                  <th className="text-left py-4 px-6 text-slate-300 font-medium">Category</th>
                  <th className="text-left py-4 px-6 text-slate-300 font-medium">Message</th>
                  <th className="text-left py-4 px-6 text-slate-300 font-medium">User</th>
                  <th className="text-left py-4 px-6 text-slate-300 font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const LevelIcon = getLevelIcon(log.level);
                  return (
                    <tr key={log.id} className="border-t border-slate-700/50 hover:bg-slate-700/20">
                      <td className="py-4 px-6 text-slate-300 text-sm">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border-l-2 ${getLevelColor(log.level)}`}>
                          <LevelIcon className="h-3 w-3 mr-1" />
                          {log.level.toUpperCase()}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-300 text-sm">
                        <span className="px-2 py-1 bg-slate-600/50 rounded text-xs">
                          {log.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-white text-sm max-w-md truncate">
                        {log.message}
                      </td>
                      <td className="py-4 px-6 text-slate-300 text-sm">
                        {log.user_email || '-'}
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-sm font-mono">
                        {log.ip_address}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <ClipboardDocumentListIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">No logs found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default LogsAdminPage;
