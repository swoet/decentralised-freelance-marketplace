import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface SecurityStats {
  total_events: number;
  high_risk_events: number;
  failed_logins: number;
  mfa_events: number;
  period_days: number;
}

interface Props {
  apiUrl: string;
  token: string;
}

export default function SecurityOverviewWidget({ apiUrl, token }: Props) {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${apiUrl}/security/security-events/statistics?days_back=7`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          throw new Error('Failed to fetch security stats');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchStats();
    }
  }, [apiUrl, token]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Security Overview</h3>
          <ShieldCheckIcon className="h-8 w-8 text-red-500" />
        </div>
        <p className="text-sm text-red-600">Failed to load security data</p>
      </div>
    );
  }

  const isSecure = stats && stats.high_risk_events === 0 && stats.failed_logins < 10;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Security Overview</h3>
        <div className="flex items-center gap-2">
          {isSecure ? (
            <ShieldCheckIcon className="h-8 w-8 text-green-500" />
          ) : (
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
          )}
        </div>
      </div>

      {stats ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total_events}</div>
              <div className="text-xs text-gray-500">Total Events</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${stats.high_risk_events > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {stats.high_risk_events}
              </div>
              <div className="text-xs text-gray-500">High Risk</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className={`text-lg font-semibold ${stats.failed_logins > 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                {stats.failed_logins}
              </div>
              <div className="text-xs text-gray-500">Failed Logins</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">{stats.mfa_events}</div>
              <div className="text-xs text-gray-500">MFA Events</div>
            </div>
          </div>

          <div className="pt-3 border-t">
            <div className={`text-sm font-medium ${isSecure ? 'text-green-600' : 'text-yellow-600'}`}>
              {isSecure ? '✅ Security status: Good' : '⚠️ Security attention needed'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Last {stats.period_days} days
            </div>
          </div>

          <Link 
            href="/admin/security" 
            className="block w-full text-center bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 px-4 rounded transition-colors text-sm font-medium"
          >
            View Security Dashboard →
          </Link>
        </div>
      ) : (
        <div className="text-gray-500 text-sm">No security data available</div>
      )}
    </div>
  );
}
