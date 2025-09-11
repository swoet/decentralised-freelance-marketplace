import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import MFAOverview from '../../components/security/MFAOverview';

export default function SecuritySettingsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  useEffect(() => {
    if (!loading && !token) {
      router.replace('/login');
    }
  }, [loading, token, router]);

  if (!token) {
    return <div className="p-6 text-gray-600">Redirecting to login…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Security Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MFA Overview */}
        <MFAOverview
          apiUrl={API_URL}
          token={token}
        />

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Link
              href="/security/mfa"
              className="block p-3 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
            >
              <div className="font-medium text-blue-800">Two-Factor Authentication</div>
              <div className="text-sm text-blue-600">Setup or manage MFA settings</div>
            </Link>
            
            {/* Placeholder for future security features */}
            <div className="block p-3 bg-gray-50 border border-gray-200 rounded opacity-50">
              <div className="font-medium text-gray-600">Session Management</div>
              <div className="text-sm text-gray-500">Coming soon - manage active sessions</div>
            </div>
            
            <div className="block p-3 bg-gray-50 border border-gray-200 rounded opacity-50">
              <div className="font-medium text-gray-600">Security Logs</div>
              <div className="text-sm text-gray-500">Coming soon - view security events</div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Tips */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Security Best Practices</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Enable Two-Factor Authentication (MFA) for enhanced security</li>
            <li>• Use a strong, unique password for your account</li>
            <li>• Keep your backup codes in a safe place</li>
            <li>• Regularly review your account activity</li>
            <li>• Use trusted devices and networks when possible</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
