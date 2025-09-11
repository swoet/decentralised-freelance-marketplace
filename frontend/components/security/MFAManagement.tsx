import React, { useEffect, useState } from 'react';

interface MFAStatus {
  enabled: boolean;
  mfa_type: string | null;
  backup_codes_count: number;
  setup_date: string | null;
}

interface Props {
  apiUrl: string;
  token: string;
  onStatusChange: () => void;
}

export default function MFAManagement({ apiUrl, token, onStatusChange }: Props) {
  const [status, setStatus] = useState<MFAStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string>("");
  const [action, setAction] = useState<'none' | 'disable' | 'regenerate'>('none');
  const [newBackupCodes, setNewBackupCodes] = useState<string[] | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${apiUrl}/security/mfa/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch MFA status");
      const data = await res.json();
      setStatus(data);
    } catch (e: any) {
      setError(e.message || "Failed to fetch status");
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [apiUrl, token]);

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/security/mfa`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ totp_code: code }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.detail || data.message || 'Failed to disable MFA');
      setStatus({ enabled: false, mfa_type: null, backup_codes_count: 0, setup_date: null });
      setAction('none');
      setCode("");
      onStatusChange();
    } catch (e: any) {
      setError(e.message || 'Failed to disable MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNewBackupCodes(null);
    try {
      const res = await fetch(`${apiUrl}/security/mfa/backup-codes/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ totp_code: code }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.detail || data.message || 'Failed to regenerate backup codes');
      setNewBackupCodes(data.backup_codes || []);
      setAction('none');
      setCode("");
      fetchStatus(); // Refresh status
    } catch (e: any) {
      setError(e.message || 'Failed to regenerate backup codes');
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-500">Loading MFA status...</div>
        {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Two-Factor Authentication</h3>

      {status.enabled ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-green-700 font-medium">MFA Enabled</span>
          </div>
          
          <div className="text-sm text-gray-600 mb-4">
            <div>Type: {status.mfa_type?.toUpperCase() || 'Unknown'}</div>
            <div>Backup codes available: {status.backup_codes_count}</div>
            {status.setup_date && <div>Setup date: {new Date(status.setup_date).toLocaleDateString()}</div>}
          </div>

          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setAction('regenerate')}
              className="text-sm bg-blue-600 text-white px-3 py-2 rounded"
            >
              Regenerate Backup Codes
            </button>
            <button
              onClick={() => setAction('disable')}
              className="text-sm bg-red-600 text-white px-3 py-2 rounded"
            >
              Disable MFA
            </button>
          </div>

          {action === 'disable' && (
            <form onSubmit={handleDisable} className="border-t pt-4">
              <h4 className="font-medium text-gray-800 mb-2">Disable Two-Factor Authentication</h4>
              <p className="text-sm text-red-600 mb-3">Warning: This will make your account less secure.</p>
              <label className="block text-sm text-gray-700 mb-1">Enter current TOTP code to confirm</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className="border rounded px-3 py-2 w-48"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                required
              />
              <div className="mt-3 flex gap-2">
                <button type="submit" disabled={loading} className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50">
                  {loading ? 'Disabling...' : 'Disable MFA'}
                </button>
                <button type="button" onClick={() => { setAction('none'); setCode(""); }} className="bg-gray-300 text-gray-700 px-4 py-2 rounded">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {action === 'regenerate' && (
            <form onSubmit={handleRegenerateBackupCodes} className="border-t pt-4">
              <h4 className="font-medium text-gray-800 mb-2">Regenerate Backup Codes</h4>
              <p className="text-sm text-yellow-600 mb-3">Warning: Your current backup codes will be invalidated.</p>
              <label className="block text-sm text-gray-700 mb-1">Enter current TOTP code to confirm</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className="border rounded px-3 py-2 w-48"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                required
              />
              <div className="mt-3 flex gap-2">
                <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
                  {loading ? 'Regenerating...' : 'Regenerate Codes'}
                </button>
                <button type="button" onClick={() => { setAction('none'); setCode(""); }} className="bg-gray-300 text-gray-700 px-4 py-2 rounded">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {newBackupCodes && newBackupCodes.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h4 className="font-semibold text-gray-800 mb-2">New Backup Codes</h4>
              <p className="text-sm text-gray-600 mb-2">Store these codes securely. Each code can be used once.</p>
              <ul className="grid grid-cols-2 gap-2 text-sm">
                {newBackupCodes.map((c) => (
                  <li key={c} className="font-mono bg-gray-50 border rounded px-2 py-1">{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-gray-700">MFA Disabled</span>
          </div>
          <p className="text-sm text-gray-600">Two-factor authentication is not enabled for your account.</p>
        </div>
      )}

      {error && <div className="text-sm text-red-600 mt-3">{error}</div>}
    </div>
  );
}
