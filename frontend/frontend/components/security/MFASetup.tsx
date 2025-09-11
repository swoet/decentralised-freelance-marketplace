import React, { useEffect, useState } from 'react';

interface Props {
  apiUrl: string;
  token: string;
  onCompleted: () => void;
}

export default function MFASetup({ apiUrl, token, onCompleted }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [provisioningUri, setProvisioningUri] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiUrl}/security/mfa/setup/init`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to initialize MFA setup");
        const data = await res.json();
        setQrCode(data.qr_code);
        setProvisioningUri(data.provisioning_uri);
        setSecret(data.secret || null);
      } catch (e: any) {
        setError(e.message || "Failed to initialize");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [apiUrl, token]);

  const completeSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`${apiUrl}/security/mfa/setup/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ totp_code: code }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.detail || data.message || 'Failed to enable MFA');
      setBackupCodes(data.backup_codes || []);
      setSuccessMsg('MFA enabled successfully. Save your backup codes in a safe place.');
      onCompleted();
    } catch (e: any) {
      setError(e.message || 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Enable Two-Factor Authentication (TOTP)</h3>
      <p className="text-sm text-gray-600 mb-4">Scan the QR code with an authenticator app (Google Authenticator, Authy, 1Password) and enter the 6-digit code to complete setup.</p>

      {loading && <div className="text-sm text-gray-500">Loading...</div>}
      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
      {successMsg && <div className="text-sm text-green-700 mb-3">{successMsg}</div>}

      {qrCode && (
        <div className="flex items-start gap-4">
          <img
            src={`data:image/png;base64,${qrCode}`}
            alt="MFA QR Code"
            className="border rounded"
          />
          <div className="text-sm text-gray-700 break-all">
            <div className="mb-2">
              <div className="text-gray-500">Provisioning URI</div>
              <code className="text-xs">{provisioningUri}</code>
            </div>
            {secret && (
              <div className="mb-2">
                <div className="text-gray-500">Secret (development only)</div>
                <code className="text-xs">{secret}</code>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={completeSetup} className="mt-4">
        <label className="block text-sm text-gray-700 mb-1">Enter 6-digit code</label>
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
        <div className="mt-3">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
            {loading ? 'Verifying…' : 'Complete Setup'}
          </button>
        </div>
      </form>

      {backupCodes && backupCodes.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold text-gray-800">Backup Codes</h4>
          <p className="text-sm text-gray-600 mb-2">Store these codes securely. Each code can be used once.</p>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {backupCodes.map((c) => (
              <li key={c} className="font-mono bg-gray-50 border rounded px-2 py-1">{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

