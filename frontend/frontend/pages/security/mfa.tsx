import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import MFAManagement from '../../components/security/MFAManagement';
import MFASetup from '../../components/security/MFASetup';

export default function MFASettingsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<{ enabled: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  useEffect(() => {
    if (!loading && !token) {
      router.replace('/login');
    }
  }, [loading, token, router]);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/security/mfa/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to fetch status');
        setStatus({ enabled: !!data.enabled });
      } catch (e: any) {
        setError(e.message || 'Failed to fetch MFA status');
      }
    };
    fetchStatus();
  }, [API_URL, token]);

  if (!token) {
    return <div className="p-6 text-gray-600">Redirecting to login…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Security Settings</h1>

      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

      {status?.enabled ? (
        <MFAManagement
          apiUrl={API_URL}
          token={token}
          onStatusChange={() => {
            // Re-fetch status
            fetch(`${API_URL}/security/mfa/status`, { headers: { Authorization: `Bearer ${token}` } })
              .then((r) => r.json())
              .then((d) => setStatus({ enabled: !!d.enabled }))
              .catch(() => {});
          }}
        />
      ) : (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded p-3">
            For best security, enable Two-Factor Authentication (TOTP). You will need an authenticator app.
          </div>
          <MFASetup
            apiUrl={API_URL}
            token={token}
            onCompleted={() => setStatus({ enabled: true })}
          />
        </div>
      )}
    </div>
  );
}

