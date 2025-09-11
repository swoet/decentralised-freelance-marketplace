import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import AdminLayout from '../../components/AdminLayout';
import {
  ShieldCheckIcon,
  ServerIcon,
  CircleStackIcon,
  CloudIcon,
  CpuChipIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChartBarIcon,
  SignalIcon,
  BoltIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  uptime: number;
  responseTime: number;
  lastCheck: string;
  message?: string;
  version?: string;
  cpu: number;
  memory: number;
}

interface SystemHealth {
  overall_status: string;
  services: ServiceStatus[];
  database: {
    status: string;
    connections: number;
    maxConnections: number;
    queryTime: number;
    diskUsage: number;
    backupStatus: string;
  };
  infrastructure: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    uptime: number;
  };
  alerts: Array<{
    id: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
}

const HealthAdminPage: NextPage = () => {
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notifications, setNotifications] = useState<Array<{id: string, type: 'success' | 'error' | 'info', message: string}>>([]);

  useEffect(() => {
    fetchHealthData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchHealthData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchHealthData = async () => {
    try {
      // Mock system health data (in production, this would come from your backend)
      const mockHealth: SystemHealth = {
        overall_status: 'healthy',
        services: [
          {
            name: 'API Gateway',
            status: 'healthy',
            uptime: 99.97,
            responseTime: 45,
            lastCheck: new Date().toISOString(),
            version: '2.1.0',
            cpu: 23,
            memory: 45,
          },
          {
            name: 'AI Matching Service',
            status: 'healthy',
            uptime: 99.95,
            responseTime: 120,
            lastCheck: new Date().toISOString(),
            version: '1.8.2',
            cpu: 78,
            memory: 65,
          },
          {
            name: 'Authentication Service',
            status: 'warning',
            uptime: 99.85,
            responseTime: 180,
            lastCheck: new Date().toISOString(),
            message: 'High response time detected',
            version: '1.5.1',
            cpu: 45,
            memory: 82,
          },
          {
            name: 'Blockchain Service',
            status: 'healthy',
            uptime: 100,
            responseTime: 95,
            lastCheck: new Date().toISOString(),
            version: '3.0.1',
            cpu: 35,
            memory: 55,
          },
          {
            name: 'Email Service',
            status: 'healthy',
            uptime: 99.99,
            responseTime: 75,
            lastCheck: new Date().toISOString(),
            version: '1.2.5',
            cpu: 15,
            memory: 28,
          },
          {
            name: 'Redis Cache',
            status: 'healthy',
            uptime: 100,
            responseTime: 12,
            lastCheck: new Date().toISOString(),
            version: '7.0.8',
            cpu: 8,
            memory: 35,
          },
        ],
        database: {
          status: 'healthy',
          connections: 45,
          maxConnections: 100,
          queryTime: 25,
          diskUsage: 67,
          backupStatus: 'completed',
        },
        infrastructure: {
          cpu: 42,
          memory: 58,
          disk: 73,
          network: 15,
          uptime: 99.98,
        },
        alerts: [
          {
            id: '1',
            level: 'warning',
            message: 'High memory usage on AI Matching Service (82%)',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            resolved: false,
          },
          {
            id: '2',
            level: 'info',
            message: 'Database backup completed successfully',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            resolved: true,
          },
          {
            id: '3',
            level: 'warning',
            message: 'Authentication service response time above threshold',
            timestamp: new Date(Date.now() - 900000).toISOString(),
            resolved: false,
          },
        ],
      };

      setHealthData(mockHealth);
    } catch (error) {
      addNotification('error', 'Failed to fetch system health data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchHealthData();
    setRefreshing(false);
    addNotification('success', 'Health data refreshed');
  };

  const resolveAlert = (alertId: string) => {
    if (healthData) {
      const updatedAlerts = healthData.alerts.map(alert =>
        alert.id === alertId ? { ...alert, resolved: true } : alert
      );
      setHealthData({ ...healthData, alerts: updatedAlerts });
      addNotification('success', 'Alert marked as resolved');
    }
  };

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 15);
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-600/20';
      case 'warning': return 'text-yellow-400 bg-yellow-600/20';
      case 'critical': return 'text-red-400 bg-red-600/20';
      default: return 'text-gray-400 bg-gray-600/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircleIcon;
      case 'warning': return ExclamationTriangleIcon;
      case 'critical': return XCircleIcon;
      default: return ClockIcon;
    }
  };

  if (loading) {
    return (
      <AdminLayout title="System Health">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400 mx-auto"></div>
            <p className="text-white mt-4 text-xl">Loading Health Data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="System Health">
      <Head>
        <title>System Health - Admin Dashboard</title>
        <meta name="description" content="System health monitoring and service status" />
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
              <ShieldCheckIcon className="h-10 w-10 text-green-400 mr-4" />
              <div>
                <h1 className="text-3xl font-bold text-white">System Health</h1>
                <p className="text-slate-300">Infrastructure monitoring and service status</p>
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
                onClick={refreshData}
                disabled={refreshing}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors duration-200 flex items-center"
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

      {healthData && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Overall Status */}
          <div className="mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${getStatusColor(healthData.overall_status)}`}>
                    <ShieldCheckIcon className="h-8 w-8" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-2xl font-bold text-white">
                      System Status: {healthData.overall_status.charAt(0).toUpperCase() + healthData.overall_status.slice(1)}
                    </h2>
                    <p className="text-slate-400">All systems operational</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-400">{healthData.infrastructure.uptime}%</p>
                  <p className="text-slate-400 text-sm">Uptime</p>
                </div>
              </div>
            </div>
          </div>

          {/* Infrastructure Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">CPU Usage</p>
                  <p className="text-2xl font-bold text-white mt-2">{healthData.infrastructure.cpu}%</p>
                </div>
                <CpuChipIcon className="h-8 w-8 text-blue-400" />
              </div>
              <div className="mt-4 bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-blue-400 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${healthData.infrastructure.cpu}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Memory Usage</p>
                  <p className="text-2xl font-bold text-white mt-2">{healthData.infrastructure.memory}%</p>
                </div>
                <ChartBarIcon className="h-8 w-8 text-purple-400" />
              </div>
              <div className="mt-4 bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-purple-400 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${healthData.infrastructure.memory}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Disk Usage</p>
                  <p className="text-2xl font-bold text-white mt-2">{healthData.infrastructure.disk}%</p>
                </div>
                <CircleStackIcon className="h-8 w-8 text-yellow-400" />
              </div>
              <div className="mt-4 bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${healthData.infrastructure.disk}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Network I/O</p>
                  <p className="text-2xl font-bold text-white mt-2">{healthData.infrastructure.network}%</p>
                </div>
                <SignalIcon className="h-8 w-8 text-green-400" />
              </div>
              <div className="mt-4 bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-green-400 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${healthData.infrastructure.network}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Services Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <ServerIcon className="h-6 w-6 text-blue-400 mr-2" />
                Service Status
              </h3>
              <div className="space-y-4">
                {healthData.services.map((service, index) => {
                  const StatusIcon = getStatusIcon(service.status);
                  return (
                    <div key={index} className="p-4 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <StatusIcon className={`h-5 w-5 mr-3 ${getStatusColor(service.status).split(' ')[0]}`} />
                          <span className="font-medium text-white">{service.name}</span>
                          {service.version && (
                            <span className="ml-2 px-2 py-1 bg-slate-600 text-xs rounded text-slate-300">
                              v{service.version}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-slate-400">{service.responseTime}ms</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Uptime:</span>
                          <span className="text-green-400 ml-1">{service.uptime.toFixed(2)}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400">CPU:</span>
                          <span className="text-blue-400 ml-1">{service.cpu}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Memory:</span>
                          <span className="text-purple-400 ml-1">{service.memory}%</span>
                        </div>
                      </div>
                      {service.message && (
                        <p className="text-yellow-400 text-sm mt-2">{service.message}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Database Health */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <CircleStackIcon className="h-6 w-6 text-green-400 mr-2" />
                Database Health
              </h3>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <p className="text-slate-400 text-sm">Status</p>
                    <p className="text-green-400 font-semibold">
                      {healthData.database.status.charAt(0).toUpperCase() + healthData.database.status.slice(1)}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <p className="text-slate-400 text-sm">Query Time</p>
                    <p className="text-blue-400 font-semibold">{healthData.database.queryTime}ms</p>
                  </div>
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <p className="text-slate-400 text-sm">Connections</p>
                    <p className="text-purple-400 font-semibold">
                      {healthData.database.connections}/{healthData.database.maxConnections}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <p className="text-slate-400 text-sm">Disk Usage</p>
                    <p className="text-yellow-400 font-semibold">{healthData.database.diskUsage}%</p>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Last Backup</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      healthData.database.backupStatus === 'completed' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'
                    }`}>
                      {healthData.database.backupStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400 mr-2" />
              Recent Alerts
            </h3>
            <div className="space-y-3">
              {healthData.alerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                  alert.level === 'error' ? 'bg-red-900/20 border-red-500' :
                  alert.level === 'warning' ? 'bg-yellow-900/20 border-yellow-500' :
                  'bg-blue-900/20 border-blue-500'
                } ${alert.resolved ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-3 ${
                          alert.level === 'error' ? 'bg-red-500' :
                          alert.level === 'warning' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`}></span>
                        <p className="text-white font-medium">{alert.message}</p>
                        {alert.resolved && (
                          <span className="ml-2 px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded">
                            Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {!alert.resolved && (
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="ml-4 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default HealthAdminPage;
