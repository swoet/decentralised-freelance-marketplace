import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface MFAStatus {
  enabled: boolean;
  mfa_type: string | null;
  backup_codes_count: number;
  setup_date: string | null;
}

interface Props {
  apiUrl: string;
  token: string;
  compact?: boolean;
}

export default function MFAOverview({ apiUrl, token, compact = false }: Props) {
  const [status, setStatus] = useState<MFAStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${apiUrl}/security/mfa/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch MFA status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchStatus();
    }
  }, [apiUrl, token]);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${compact ? 'text-sm' : ''}`}>
        <div className="text-gray-500">Loading security status...</div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const isSecure = status.enabled;
  const hasBackupCodes = status.backup_codes_count > 0;
  const lowBackupCodes = status.backup_codes_count > 0 && status.backup_codes_count < 3;

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${compact ? 'text-sm' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-semibold text-gray-800 ${compact ? 'text-base' : 'text-lg'}`}>
          Security Status
        </h3>
        <Link 
          href="/security/mfa" 
          className="text-blue-600 hover:underline text-sm"
        >
          Manage
        </Link>
      </div>

      <div className="space-y-2">
        {/* MFA Status */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isSecure ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={`${isSecure ? 'text-green-700' : 'text-red-700'}`}>
            Two-Factor Auth: {isSecure ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {/* Backup Codes Warning */}
        {isSecure && (
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              hasBackupCodes ? (lowBackupCodes ? 'bg-yellow-500' : 'bg-green-500') : 'bg-red-500'
            }`}></div>
            <span className={`${
              hasBackupCodes ? (lowBackupCodes ? 'text-yellow-700' : 'text-green-700') : 'text-red-700'
            }`}>
              Backup Codes: {status.backup_codes_count} remaining
            </span>
          </div>
        )}
      </div>

      {/* Security Recommendations */}
      <div className={`mt-3 pt-3 border-t text-xs text-gray-600 ${compact ? 'hidden' : ''}`}>
        {!isSecure ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded">
            ⚠️ Enable MFA to secure your account
          </div>
        ) : lowBackupCodes ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-2 rounded">
            ⚠️ Low on backup codes - consider regenerating
          </div>
        ) : (
          <div className="text-green-600">
            ✅ Account security is good
          </div>
        )}
      </div>
    </div>
  );
}
