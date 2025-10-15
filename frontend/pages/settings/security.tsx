import Head from 'next/head'
import { useEffect, useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

interface MFAStatus {
  enabled: boolean
  mfa_type: string | null
  backup_codes_count: number
  setup_date: string | null
}

interface Session {
  id: string
  device: string
  ip: string
  ua: string
  last_seen_at: string
  revoked: boolean
}

export default function SecuritySettings() {
  const { user } = useAuth()
  const [mfaStatus, setMfaStatus] = useState<MFAStatus | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [setupStep, setSetupStep] = useState<'idle' | 'init' | 'verify'>('idle')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [provisioningUri, setProvisioningUri] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [totpCode, setTotpCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  const loadData = async () => {
    try {
      const [mfaRes, sessionsRes] = await Promise.all([
        fetch('/api/v1/security/mfa/status', { credentials: 'include' }),
        fetch('/api/v1/security/sessions', { credentials: 'include' })
      ])
      
      if (mfaRes.ok) {
        const mfaData = await mfaRes.json()
        setMfaStatus(mfaData)
      }
      
      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json()
        setSessions(sessionsData.items || [])
      }
    } catch (error: any) {
      toast.error('Failed to load security settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const initMFASetup = async () => {
    try {
      const res = await fetch('/api/v1/security/mfa/setup/init', {
        credentials: 'include'
      })
      
      if (!res.ok) throw new Error('Failed to initialize MFA setup')
      
      const data = await res.json()
      setQrCode(data.qr_code)
      setProvisioningUri(data.provisioning_uri)
      setSecret(data.secret)
      setSetupStep('verify')
      toast.success('Scan the QR code with your authenticator app')
    } catch (error: any) {
      toast.error(error.message || 'Failed to initialize MFA')
    }
  }

  const completeMFASetup = async () => {
    if (!totpCode) {
      toast.error('Please enter the 6-digit code')
      return
    }

    try {
      const res = await fetch('/api/v1/security/mfa/setup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ totp_code: totpCode })
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || 'Invalid code')
      }
      
      const data = await res.json()
      setBackupCodes(data.backup_codes || [])
      setSetupStep('idle')
      setTotpCode('')
      toast.success('MFA enabled successfully!')
      await loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete MFA setup')
    }
  }

  const disableMFA = async () => {
    const code = prompt('Enter your current TOTP code to disable MFA:')
    if (!code) return

    try {
      const res = await fetch('/api/v1/security/mfa', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ totp_code: code })
      })
      
      if (!res.ok) throw new Error('Invalid code or failed to disable MFA')
      
      toast.success('MFA disabled successfully')
      await loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to disable MFA')
    }
  }

  const regenerateBackupCodes = async () => {
    const code = prompt('Enter your current TOTP code to regenerate backup codes:')
    if (!code) return

    try {
      const res = await fetch('/api/v1/security/mfa/backup-codes/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ totp_code: code })
      })
      
      if (!res.ok) throw new Error('Invalid code or failed to regenerate')
      
      const data = await res.json()
      setBackupCodes(data.backup_codes || [])
      toast.success('Backup codes regenerated!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to regenerate backup codes')
    }
  }

  const revokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to revoke this session?')) return

    try {
      const res = await fetch(`/api/v1/security/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (!res.ok) throw new Error('Failed to revoke session')
      
      toast.success('Session revoked successfully')
      await loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to revoke session')
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading security settings...</div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Head>
        <title>Security Settings - CraftNexus</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Security Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account security and active sessions</p>
        </div>

        {/* Two-Factor Authentication Section */}
        <section className="bg-white rounded-lg border shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-600 mt-1">
                Add an extra layer of security to your account
              </p>
            </div>
            <div>
              {mfaStatus?.enabled ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  ✓ Enabled
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  Disabled
                </span>
              )}
            </div>
          </div>

          {!mfaStatus?.enabled && setupStep === 'idle' && (
            <div className="pt-4">
              <button
                onClick={initMFASetup}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Enable Two-Factor Authentication
              </button>
            </div>
          )}

          {setupStep === 'verify' && (
            <div className="pt-4 space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-3">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                {qrCode && (
                  <div className="flex justify-center">
                    <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                  </div>
                )}
                {secret && (
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-600 mb-1">Or enter this secret manually:</p>
                    <code className="text-sm bg-white px-3 py-1 rounded border">{secret}</code>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter the 6-digit code from your app:
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    onClick={completeMFASetup}
                    disabled={totpCode.length !== 6}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Verify & Enable
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  setSetupStep('idle')
                  setQrCode(null)
                  setTotpCode('')
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          )}

          {mfaStatus?.enabled && (
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <span className="font-medium">Backup Codes:</span>{' '}
                  <span className="text-gray-600">{mfaStatus.backup_codes_count} remaining</span>
                </div>
                <button
                  onClick={regenerateBackupCodes}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Regenerate
                </button>
              </div>

              <button
                onClick={disableMFA}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Disable Two-Factor Authentication
              </button>
            </div>
          )}

          {backupCodes.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-900 mb-3">
                ⚠️ Save these backup codes in a safe place. Each code can only be used once.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, idx) => (
                  <code key={idx} className="text-sm bg-white px-3 py-2 rounded border">
                    {code}
                  </code>
                ))}
              </div>
              <button
                onClick={() => setBackupCodes([])}
                className="mt-3 text-sm text-gray-600 hover:text-gray-900"
              >
                I've saved these codes
              </button>
            </div>
          )}
        </section>

        {/* Active Sessions Section */}
        <section className="bg-white rounded-lg border shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Active Sessions</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage devices and browsers where you're currently logged in
            </p>
          </div>

          {sessions.length === 0 ? (
            <p className="text-sm text-gray-600">No active sessions found.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{session.device || 'Unknown Device'}</span>
                      {session.revoked && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                          Revoked
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <div>IP: {session.ip || 'Unknown'}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Last active: {session.last_seen_at ? new Date(session.last_seen_at).toLocaleString() : 'Unknown'}
                      </div>
                    </div>
                  </div>
                  {!session.revoked && (
                    <button
                      onClick={() => revokeSession(session.id)}
                      className="ml-4 text-sm text-red-600 hover:text-red-800"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Password Section */}
        <section className="bg-white rounded-lg border shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Password</h2>
            <p className="text-sm text-gray-600 mt-1">
              Change your password regularly to keep your account secure
            </p>
          </div>
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition">
            Change Password
          </button>
        </section>

        {/* Privacy Section */}
        <section className="bg-white rounded-lg border shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Privacy & Data</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your personal data and privacy settings
            </p>
          </div>
          <div className="space-y-2">
            <button className="block px-4 py-2 border rounded-lg hover:bg-gray-50 transition w-full text-left">
              Download My Data
            </button>
            <button className="block px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition w-full text-left">
              Delete My Account
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
