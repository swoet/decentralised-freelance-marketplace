import Head from 'next/head'
import { useState, useEffect } from 'react'
import AppShell from '../../../components/layout/AppShell'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface AutomationRule {
  id: string
  name: string
  description: string
  rule_type: 'milestone_approval' | 'payment_release' | 'quality_threshold' | 'time_based'
  is_active: boolean
  conditions: {
    key: string
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains'
    value: string | number | boolean
  }[]
  actions: {
    type: 'approve_milestone' | 'release_payment' | 'send_notification' | 'escalate'
    parameters: Record<string, any>
  }[]
  created_at: string
  updated_at: string
  last_triggered?: string
  trigger_count: number
}

interface AutomationEvent {
  id: string
  rule_id: string
  rule_name: string
  escrow_id: string
  project_title: string
  event_type: string
  success: boolean
  error_message?: string
  created_at: string
  processing_time_ms: number
}

interface SystemSettings {
  global_automation_enabled: boolean
  auto_release_delay_hours: number
  quality_threshold_default: number
  max_dispute_auto_resolve_amount: number
  notification_preferences: {
    admin_alerts: boolean
    user_notifications: boolean
    webhook_enabled: boolean
  }
}

export default function AutomationManagement() {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [events, setEvents] = useState<AutomationEvent[]>([])
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('rules')
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [rulesRes, eventsRes, settingsRes] = await Promise.all([
        fetch('/api/v1/admin/automation/rules', { credentials: 'include' }),
        fetch('/api/v1/admin/automation/events?limit=50', { credentials: 'include' }),
        fetch('/api/v1/admin/automation/settings', { credentials: 'include' })
      ])

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json()
        setRules(rulesData.rules || [])
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData.events || [])
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        setSettings(settingsData)
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/v1/admin/automation/rules/${ruleId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: isActive })
      })

      if (!response.ok) {
        throw new Error('Failed to toggle rule')
      }

      await fetchData()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) return

    try {
      const response = await fetch(`/api/v1/admin/automation/rules/${ruleId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to delete rule')
      }

      await fetchData()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      const response = await fetch('/api/v1/admin/automation/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newSettings)
      })

      if (!response.ok) {
        throw new Error('Failed to update settings')
      }

      await fetchData()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const processAutomation = async (escrowId?: string) => {
    try {
      const endpoint = escrowId 
        ? `/api/v1/admin/automation/process/${escrowId}`
        : '/api/v1/admin/automation/process-all'
        
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to process automation')
      }

      const result = await response.json()
      alert(`Automation processing completed: ${result.processed} items processed`)
      await fetchData()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case 'milestone_approval': return 'bg-blue-100 text-blue-800'
      case 'payment_release': return 'bg-green-100 text-green-800'
      case 'quality_threshold': return 'bg-yellow-100 text-yellow-800'
      case 'time_based': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AppShell>
      <Head>
        <title>Automation Management - Admin</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Automation Management</h1>
            <p className="text-gray-600">Configure and monitor automated escrow processes</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => processAutomation()}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Process All
            </button>
            <Link
              href="/admin/escrow-management/dashboard"
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* System Status */}
        {settings && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">System Status</h2>
              <div className="flex items-center">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  settings.global_automation_enabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {settings.global_automation_enabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-500">Active Rules</div>
                <div className="text-xl font-bold text-gray-900">
                  {rules.filter(r => r.is_active).length}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-500">Auto-Release Delay</div>
                <div className="text-xl font-bold text-gray-900">
                  {settings.auto_release_delay_hours}h
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-500">Quality Threshold</div>
                <div className="text-xl font-bold text-gray-900">
                  {settings.quality_threshold_default}/5
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-500">Events Today</div>
                <div className="text-xl font-bold text-gray-900">
                  {events.filter(e => {
                    const today = new Date()
                    const eventDate = new Date(e.created_at)
                    return eventDate.toDateString() === today.toDateString()
                  }).length}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['rules', 'events', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'rules' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Automation Rules</h3>
                <button
                  onClick={() => setShowRuleForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Create Rule
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                </div>
              ) : rules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No automation rules configured.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rules.map((rule) => (
                    <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-medium text-gray-900">{rule.name}</h4>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRuleTypeColor(rule.rule_type)}`}>
                              {rule.rule_type.replace('_', ' ').toUpperCase()}
                            </span>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={rule.is_active}
                                onChange={(e) => toggleRule(rule.id, e.target.checked)}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                              />
                              <label className="ml-2 text-sm text-gray-700">Active</label>
                            </div>
                          </div>
                          <p className="text-gray-600 mb-3">{rule.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Triggered: {rule.trigger_count} times</span>
                            {rule.last_triggered && (
                              <span>Last: {formatDistanceToNow(new Date(rule.last_triggered), { addSuffix: true })}</span>
                            )}
                            <span>Created: {formatDistanceToNow(new Date(rule.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingRule(rule)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteRule(rule.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'events' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Recent Automation Events</h3>
              {events.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No automation events yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className={`border rounded-lg p-4 ${
                      event.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`w-2 h-2 rounded-full ${event.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span className="font-medium text-gray-900">{event.rule_name}</span>
                            <span className="text-sm text-gray-500">→ {event.project_title}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div>Type: {event.event_type.replace('_', ' ')}</div>
                            {event.error_message && (
                              <div className="text-red-600 mt-1">Error: {event.error_message}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div>{formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</div>
                          <div className="text-xs">{event.processing_time_ms}ms</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && settings && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">System Settings</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Global Automation
                    </label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.global_automation_enabled}
                        onChange={(e) => updateSettings({ global_automation_enabled: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">Enable automation system-wide</label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auto-Release Delay (Hours)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="8760"
                      value={settings.auto_release_delay_hours}
                      onChange={(e) => updateSettings({ auto_release_delay_hours: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Quality Threshold
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      value={settings.quality_threshold_default}
                      onChange={(e) => updateSettings({ quality_threshold_default: parseFloat(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Auto-Resolve Dispute Amount (ETH)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={settings.max_dispute_auto_resolve_amount}
                      onChange={(e) => updateSettings({ max_dispute_auto_resolve_amount: parseFloat(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Notification Preferences
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notification_preferences.admin_alerts}
                        onChange={(e) => updateSettings({ 
                          notification_preferences: { 
                            ...settings.notification_preferences, 
                            admin_alerts: e.target.checked 
                          }
                        })}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">Send admin alerts for automation events</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notification_preferences.user_notifications}
                        onChange={(e) => updateSettings({ 
                          notification_preferences: { 
                            ...settings.notification_preferences, 
                            user_notifications: e.target.checked 
                          }
                        })}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">Send notifications to users when automation acts</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notification_preferences.webhook_enabled}
                        onChange={(e) => updateSettings({ 
                          notification_preferences: { 
                            ...settings.notification_preferences, 
                            webhook_enabled: e.target.checked 
                          }
                        })}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">Enable webhook notifications</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Emergency Controls */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-900 mb-4">Emergency Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => updateSettings({ global_automation_enabled: false })}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Disable All Automation
            </button>
            <button
              onClick={() => processAutomation()}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Force Process Queue
            </button>
            <Link
              href="/admin/escrow-management/escrows"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium text-center"
            >
              Manual Override Mode
            </Link>
          </div>
          <p className="text-sm text-red-700 mt-3">
            ⚠️ Use emergency controls only when necessary. Actions may affect active escrows and user experience.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
