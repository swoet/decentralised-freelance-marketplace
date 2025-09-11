import React, { useState } from 'react';

interface Props {
  apiUrl: string;
  token: string;
  onVerified: () => void;
  onCancel?: () => void;
}

export default function MFAVerification({ apiUrl, token, onVerified, onCancel }: Props) {
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBackupCode, setIsBackupCode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${apiUrl}/security/mfa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ totp_code: code }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || data.message || 'Invalid verification code');
      }
      
      // MFA verified successfully
      onVerified();
    } catch (e: any) {
      setError(e.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Two-Factor Authentication</h2>
      <p className="text-sm text-gray-600 mb-4">
        {isBackupCode 
          ? "Enter one of your backup codes:"
          : "Enter the 6-digit code from your authenticator app:"
        }
      </p>

      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          inputMode={isBackupCode ? "text" : "numeric"}
          pattern={isBackupCode ? undefined : "[0-9]*"}
          maxLength={isBackupCode ? 9 : 6}
          className="w-full border rounded px-3 py-2 mb-3"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={isBackupCode ? "XXXX-XXXX" : "123456"}
          required
        />

        <div className="flex justify-between items-center mb-4">
          <button
            type="button"
            onClick={() => {
              setIsBackupCode(!isBackupCode);
              setCode("");
              setError(null);
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            {isBackupCode ? "Use authenticator app" : "Use backup code"}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
