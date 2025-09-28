import Head from 'next/head'
import { useEffect, useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import { useAuth } from '../../context/AuthContext'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  StatusBadge,
  Motion,
  Stagger
} from '../../components/artisan-craft'

interface ConnectedItem { id: string; provider: string; status: string }
interface IntegrationsResp { providers: string[]; connected: ConnectedItem[] }

export default function IntegrationsIndex() {
  const [data, setData] = useState<IntegrationsResp>({ providers: [], connected: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth()

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/integrations`, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const j = await res.json()
      setData(j)
    } catch (e: any) {
      setError(e?.message || 'Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token])

  const connectGitHub = async () => {
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/integrations/github/connect`, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const j = await res.json()
      if (j.url) {
        window.location.href = j.url
      } else {
        alert('No authorization URL returned')
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to start GitHub OAuth')
    }
  }

  const disconnectGitHub = async () => {
    if (!confirm('Disconnect GitHub?')) return
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/integrations/github`, { method: 'DELETE', headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await load()
    } catch (e: any) {
      alert(e?.message || 'Failed to disconnect GitHub')
    }
  }

  const connectSlack = async () => {
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/integrations/slack/connect`, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const j = await res.json()
      if (j.url) {
        window.location.href = j.url
      } else {
        alert('No authorization URL returned')
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to start Slack OAuth')
    }
  }

  const disconnectSlack = async () => {
    if (!confirm('Disconnect Slack?')) return
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/integrations/slack`, { method: 'DELETE', headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await load()
    } catch (e: any) {
      alert(e?.message || 'Failed to disconnect Slack')
    }
  }

  const connectJira = async () => {
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/integrations/jira/connect`, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const j = await res.json()
      if (j.url) {
        window.location.href = j.url
      } else {
        alert('No authorization URL returned')
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to start Jira OAuth')
    }
  }

  const disconnectJira = async () => {
    if (!confirm('Disconnect Jira?')) return
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/integrations/jira`, { method: 'DELETE', headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await load()
    } catch (e: any) {
      alert(e?.message || 'Failed to disconnect Jira')
    }
  }

  const isConnected = (provider: string) => data.connected?.some(c => c.provider === provider)

  return (
    <AppShell>
      <Head>
        <title>Integrations - CraftNexus</title>
        <meta name="description" content="Connect your favorite tools to CraftNexus and streamline your creative workflow" />
        
        {/* Fonts are now loaded globally in globals.css */}
      </Head>
      
      <div className="min-h-screen mh-surface">
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Motion preset="slideInDown" className="mb-8">
            <div className="mh-section p-8 text-center">
              <h1 className="text-4xl font-bold mb-4">CraftNexus Integrations</h1>
              <p className="text-lg">
                Connect your favorite tools to CraftNexus and streamline your creative workflow for seamless artisan collaboration
              </p>
            </div>
          </Motion>
          
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-amber-600 rounded-full mx-auto mb-4"></div>
              <p>Loading integrations...</p>
            </div>
          ) : error ? (
            <Motion preset="fadeIn" className="text-center py-16">
              <div className="mh-card max-w-md mx-auto p-8 border-red-200 bg-red-50">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold mb-2">Connection Error</h3>
                <p className="mb-4">{error}</p>
                <button onClick={load} className="mh-btn mh-btn-primary">
                  Try Again
                </button>
              </div>
            </Motion>
          ) : (
            <Stagger staggerDelay={150} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* GitHub */}
              <Motion preset="scaleIn">
                <div className="mh-card group h-full p-6">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-neutral-900 rounded-2xl">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">GitHub</h3>
                        <p className="text-sm text-gray-600">OAuth connection for profile verification</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      {isConnected('github') ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Connected</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">Not Connected</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-auto">
                    {!isConnected('github') ? (
                      <button 
                        onClick={connectGitHub} 
                        className="mh-btn mh-btn-primary w-full"
                      >
                        Connect GitHub
                      </button>
                    ) : (
                      <button 
                        onClick={disconnectGitHub} 
                        className="mh-btn mh-btn-ghost w-full"
                      >
                        Disconnect
                      </button>
                    )}
                  </div>
                </div>
              </Motion>

              {/* Slack */}
              <Motion preset="scaleIn" transition={{ delay: 100 }}>
                <Card variant="elevated" interactive="hover" className="group h-full ac-hover-efficient ac-animate-crisp">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-purple-600 rounded-organic-craft">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                        </svg>
                      </div>
                      <div>
                        <CardTitle className="group-hover:text-copper-600 transition-colors">Slack</CardTitle>
                        <CardDescription>Team communication and project notifications</CardDescription>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      {isConnected('slack') ? (
                        <StatusBadge status="completed" size="sm">Connected</StatusBadge>
                      ) : (
                        <StatusBadge status="inactive" size="sm">Not Connected</StatusBadge>
                      )}
                    </div>
                  </CardHeader>
                  <CardFooter>
                    {!isConnected('slack') ? (
                      <Button 
                        onClick={connectSlack} 
                        variant="accent" 
                        size="md" 
                        shape="wax" 
                        className="w-full"
                        leftIcon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        }
                      >
                        Connect Slack
                      </Button>
                    ) : (
                      <Button 
                        onClick={disconnectSlack} 
                        variant="ghost" 
                        size="md" 
                        shape="rounded" 
                        className="w-full"
                        leftIcon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        }
                      >
                        Disconnect
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </Motion>

              {/* Jira */}
              <Motion preset="scaleIn" transition={{ delay: 200 }}>
                <Card variant="elevated" interactive="hover" className="group h-full ac-hover-efficient ac-animate-crisp">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-blue-600 rounded-organic-craft">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H24a5.218 5.218 0 0 0-5.232-5.215h-2.13V2.6A5.215 5.215 0 0 0 11.425 0v11.482a1.005 1.005 0 0 0 1.005 1.005h4.864z"/>
                        </svg>
                      </div>
                      <div>
                        <CardTitle className="group-hover:text-copper-600 transition-colors">Jira</CardTitle>
                        <CardDescription>Issue tracking and project management</CardDescription>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      {isConnected('jira') ? (
                        <StatusBadge status="completed" size="sm">Connected</StatusBadge>
                      ) : (
                        <StatusBadge status="inactive" size="sm">Not Connected</StatusBadge>
                      )}
                    </div>
                  </CardHeader>
                  <CardFooter>
                    {!isConnected('jira') ? (
                      <Button 
                        onClick={connectJira} 
                        variant="secondary" 
                        size="md" 
                        shape="wax" 
                        className="w-full"
                        leftIcon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        }
                      >
                        Connect Jira
                      </Button>
                    ) : (
                      <Button 
                        onClick={disconnectJira} 
                        variant="ghost" 
                        size="md" 
                        shape="rounded" 
                        className="w-full"
                        leftIcon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        }
                      >
                        Disconnect
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </Motion>
            </Stagger>
          )}
          
          {/* Additional Info Section */}
          <Motion preset="slideInUp" transition={{ delay: 400 }} className="mt-12">
            <Card variant="parchment" className="text-center">
              <CardContent className="p-8">
                <div className="text-4xl mb-4">🔗</div>
                <h3 className="heading-craft text-xl text-mahogany-800 mb-2">Need More Integrations?</h3>
                <p className="body-craft text-copper-700 mb-6">
                  We're constantly adding new integrations to help streamline your workflow. 
                  Have a specific tool in mind? Let us know!
                </p>
                <Button variant="ghost" size="md" shape="wax">
                  Request Integration
                </Button>
              </CardContent>
            </Card>
          </Motion>
        </div>
      </div>
    </AppShell>
  )
}
