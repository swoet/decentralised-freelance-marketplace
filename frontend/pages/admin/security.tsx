import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';

interface SecurityStats {
  total_events: number;
  high_risk_events: number;
  failed_logins: number;
  mfa_events: number;
  categories: Record<string, number>;
  severities: Record<string, number>;
  period_days: number;
}

interface RateLimitViolation {
  id: string;
  endpoint: string;
  ip_address: string;
  method: string;
  time_window: string;
  violation_count: number;
  created_at: string;
}

interface RateLimitSummary {
  total_violations: number;
  hours_analyzed: number;
  top_endpoints: Array<{ endpoint: string; violations: number }>;
  top_ips: Array<{ ip: string; violations: number }>;
  recent_violations: RateLimitViolation[];
}

interface LockedAccount {
  id: string;
  user_id: string;
  user_info: { email: string; full_name: string } | null;
  ip_address: string;
  failed_attempts: number;
  is_locked: boolean;
  locked_until: string | null;
  remaining_seconds: number | null;
  lockout_reason: string;
  created_at: string;
}

export default function SecurityDashboard() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null);
  const [rateLimitSummary, setRateLimitSummary] = useState<RateLimitSummary | null>(null);
  const [lockedAccounts, setLockedAccounts] = useState<LockedAccount[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  useEffect(() => {
    if (!loading && (!token || user?.role !== 'admin')) {
      router.replace('/login');
    }
  }, [loading, token, user, router]);

  useEffect(() => {
    if (token && user?.role === 'admin') {
      fetchSecurityData();
    }
  }, [token, user]);

  const fetchSecurityData = async () => {
    setLoadingStats(true);
    setError(null);

    try {
      // Fetch security event statistics
      const statsRes = await fetch(`${API_URL}/security-events/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setSecurityStats(statsData);
      }

      // Fetch rate limit violations
      const violationsRes = await fetch(`${API_URL}/security/rate-limits/violations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (violationsRes.ok) {
        const violationsData = await violationsRes.json();
        setRateLimitSummary(violationsData);
      }

      // Fetch locked accounts
      const lockoutsRes = await fetch(`${API_URL}/security/account-lockouts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (lockoutsRes.ok) {
        const lockoutsData = await lockoutsRes.json();
        setLockedAccounts(lockoutsData);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to fetch security data');
    } finally {
      setLoadingStats(false);
    }
  };

  const unlockAccount = async (userId: string, reason: string = 'admin_unlock') => {
    try {
      const res = await fetch(`${API_URL}/security/account-lockouts/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId, reason }),
      });

      if (res.ok) {
        fetchSecurityData(); // Refresh data
      } else {
        throw new Error('Failed to unlock account');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to unlock account');
    }
  };

  const resetRateLimit = async (identifier: string, ruleName: string = 'api_general') => {
    try {
      const res = await fetch(`${API_URL}/security/rate-limits/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          identifier, 
          rule_name: ruleName, 
          reason: 'admin_reset' 
        }),
      });

      if (res.ok) {
        fetchSecurityData(); // Refresh data
      } else {
        throw new Error('Failed to reset rate limits');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset rate limits');
    }
  };

  if (!token || user?.role !== 'admin') {
    return <div className="p-6 text-gray-600">Access denied</div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Security Dashboard</h1>
        <button
          onClick={fetchSecurityData}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loadingStats ? (
        <div className="text-gray-500">Loading security data...</div>
      ) : (
        <div className="space-y-6">
          {/* Security Overview */}
          {securityStats && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Security Events Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded">
                  <div className="text-2xl font-bold text-blue-600">{securityStats.total_events}</div>
                  <div className="text-sm text-blue-600">Total Events</div>
                </div>
                <div className="bg-red-50 p-4 rounded">
                  <div className="text-2xl font-bold text-red-600">{securityStats.high_risk_events}</div>
                  <div className="text-sm text-red-600">High Risk Events</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded">
                  <div className="text-2xl font-bold text-yellow-600">{securityStats.failed_logins}</div>
                  <div className="text-sm text-yellow-600">Failed Logins</div>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <div className="text-2xl font-bold text-green-600">{securityStats.mfa_events}</div>
                  <div className="text-sm text-green-600">MFA Events</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Events by Category</h3>
                  <div className="space-y-2">
                    {Object.entries(securityStats.categories).map(([category, count]) => (
                      <div key={category} className="flex justify-between">
                        <span className="capitalize">{category}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Events by Severity</h3>
                  <div className="space-y-2">
                    {Object.entries(securityStats.severities).map(([severity, count]) => (
                      <div key={severity} className="flex justify-between">
                        <span className={`capitalize ${
                          severity === 'critical' ? 'text-red-600' : 
                          severity === 'high' ? 'text-red-500' : 
                          severity === 'medium' ? 'text-yellow-500' : 'text-green-500'
                        }`}>
                          {severity}
                        </span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rate Limiting */}
          {rateLimitSummary && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Rate Limiting</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-red-50 p-4 rounded">
                  <div className="text-2xl font-bold text-red-600">{rateLimitSummary.total_violations}</div>
                  <div className="text-sm text-red-600">Total Violations</div>
                  <div className="text-xs text-gray-500">Last {rateLimitSummary.hours_analyzed} hours</div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Top Endpoints</h3>
                  <div className="space-y-1 text-sm">
                    {rateLimitSummary.top_endpoints.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="truncate">{item.endpoint}</span>
                        <span className="font-medium ml-2">{item.violations}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Top IPs</h3>
                  <div className="space-y-1 text-sm">
                    {rateLimitSummary.top_ips.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{item.ip}</span>
                        <span className="font-medium">
                          {item.violations}
                          <button
                            onClick={() => resetRateLimit(item.ip)}
                            className="ml-2 text-blue-600 hover:underline text-xs"
                          >
                            Reset
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Violations */}
              {rateLimitSummary.recent_violations.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Recent Violations</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Time</th>
                          <th className="px-3 py-2 text-left">IP</th>
                          <th className="px-3 py-2 text-left">Endpoint</th>
                          <th className="px-3 py-2 text-left">Method</th>
                          <th className="px-3 py-2 text-left">Window</th>
                          <th className="px-3 py-2 text-left">Count</th>
                          <th className="px-3 py-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {rateLimitSummary.recent_violations.slice(0, 10).map((violation) => (
                          <tr key={violation.id}>
                            <td className="px-3 py-2">{new Date(violation.created_at).toLocaleTimeString()}</td>
                            <td className="px-3 py-2 font-mono">{violation.ip_address}</td>
                            <td className="px-3 py-2 truncate max-w-xs">{violation.endpoint}</td>
                            <td className="px-3 py-2">{violation.method}</td>
                            <td className="px-3 py-2">{violation.time_window}</td>
                            <td className="px-3 py-2">{violation.violation_count}</td>
                            <td className="px-3 py-2">
                              <button
                                onClick={() => resetRateLimit(violation.ip_address)}
                                className="text-blue-600 hover:underline"
                              >
                                Reset
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Account Lockouts */}
          {lockedAccounts.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Account Lockouts</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">User</th>
                      <th className="px-3 py-2 text-left">IP Address</th>
                      <th className="px-3 py-2 text-left">Failed Attempts</th>
                      <th className="px-3 py-2 text-left">Locked Until</th>
                      <th className="px-3 py-2 text-left">Remaining</th>
                      <th className="px-3 py-2 text-left">Reason</th>
                      <th className="px-3 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {lockedAccounts.map((lockout) => (
                      <tr key={lockout.id}>
                        <td className="px-3 py-2">
                          <div>
                            <div className="font-medium">{lockout.user_info?.email || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{lockout.user_info?.full_name}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2 font-mono">{lockout.ip_address}</td>
                        <td className="px-3 py-2">{lockout.failed_attempts}</td>
                        <td className="px-3 py-2">
                          {lockout.locked_until ? new Date(lockout.locked_until).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-3 py-2">
                          {lockout.remaining_seconds ? `${Math.ceil(lockout.remaining_seconds / 60)}m` : 'N/A'}
                        </td>
                        <td className="px-3 py-2">{lockout.lockout_reason}</td>
                        <td className="px-3 py-2">
                          {lockout.is_locked && (
                            <button
                              onClick={() => unlockAccount(lockout.user_id)}
                              className="text-blue-600 hover:underline"
                            >
                              Unlock
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
