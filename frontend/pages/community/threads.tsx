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
  Input,
  Badge,
  SkillBadge,
  BadgeGroup,
  Motion,
  Stagger
} from '../../components/artisan-craft'

export default function ThreadsPage() {
  const [items, setItems] = useState<{ id: string; title: string; tags?: string[] }[]>([])
  const [title, setTitle] = useState('')
  const [tag, setTag] = useState('')
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
      const res = await fetch(`${API_BASE}/community/threads`, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setItems(data.items || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load threads')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [token])

  const createThread = async () => {
    const tags = tag ? [tag] : []
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/community/threads`, {
        method: 'POST', headers,
        body: JSON.stringify({ title, tags })
      })
      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try { const err = await res.json(); msg = err?.detail || err?.message || msg } catch {}
        throw new Error(msg)
      }
      setTitle(''); setTag(''); await load()
    } catch (e: any) {
      setError(e?.message || 'Failed to create thread')
    }
  }

  return (
    <AppShell>
      <Head>
        <title>Discussion Threads - Artisan Community</title>
        <meta name="description" content="Join conversations, share knowledge, and connect with fellow artisans in our community discussions" />
      </Head>
      
      <div className="max-w-6xl mx-auto">
          <Motion preset="slideInDown" className="mb-8">
            <div className="text-center space-y-4">
              <h1 className="heading-craft text-4xl text-mahogany-800">
                Discussion Threads
              </h1>
              <p className="body-craft text-lg text-copper-700 max-w-2xl mx-auto">
                Share your thoughts, ask questions, and engage in meaningful conversations with fellow artisans.
              </p>
            </div>
          </Motion>

          {error && (
            <Motion preset="fadeIn" className="mb-6">
              <Card variant="outlined" className="p-4 border-red-300 bg-red-50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <p className="body-craft text-red-700">{error}</p>
                </div>
              </Card>
            </Motion>
          )}

          {/* Create Thread Form */}
          <Motion preset="scaleIn" className="mb-8">
            <Card variant="parchment" className="p-6">
              <CardHeader>
                <CardTitle>Start a New Discussion</CardTitle>
                <CardDescription>Share your ideas, ask questions, or start a conversation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      variant="craft"
                      placeholder="What would you like to discuss?"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      label="Thread Title"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Input
                      variant="craft"
                      placeholder="e.g., technique, tools"
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      label="Tag (Optional)"
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="primary" 
                  onClick={createThread} 
                  disabled={!title}
                  shape="leaf"
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  }
                >
                  Start Discussion
                </Button>
              </CardFooter>
            </Card>
          </Motion>

          {/* Threads List */}
          {loading ? (
            <Motion preset="scaleIn" className="flex justify-center items-center py-16">
              <Card variant="leather" className="p-8 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-mahogany-200 border-t-mahogany-600 rounded-full mx-auto mb-4"></div>
                <p className="body-craft text-copper-700">Loading discussions...</p>
              </Card>
            </Motion>
          ) : items.length === 0 ? (
            <Motion preset="fadeIn" className="flex justify-center items-center py-16">
              <Card variant="outlined" className="p-12 text-center max-w-md mx-auto">
                <div className="text-6xl opacity-30 mb-6">💬</div>
                <h3 className="heading-craft text-xl text-mahogany-800 mb-2">No Discussions Yet</h3>
                <p className="body-craft text-copper-600 mb-6">
                  Be the first to start a conversation! Share your thoughts, ask questions, or discuss techniques with the community.
                </p>
                <Button variant="accent" shape="wax" onClick={() => {
                  const titleInput = document.querySelector('input[placeholder*="discuss"]') as HTMLInputElement;
                  titleInput?.focus();
                }}>
                  Start the First Discussion
                </Button>
              </Card>
            </Motion>
          ) : (
            <Stagger staggerDelay={100} className="space-y-4">
              {items.map((thread, index) => (
                <Motion key={thread.id} preset="slideInUp" transition={{ delay: index * 50 }}>
                  <Card variant="default" interactive="hover" className="group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <a 
                            href={`/community/threads/${thread.id}`}
                            className="heading-craft text-xl font-semibold text-mahogany-800 hover:text-copper-600 transition-colors group-hover:underline"
                          >
                            {thread.title}
                          </a>
                          {thread.tags?.length ? (
                            <BadgeGroup className="mt-3">
                              {thread.tags.map((tag) => (
                                <SkillBadge key={tag} skill={tag} size="sm">
                                  {tag}
                                </SkillBadge>
                              ))}
                            </BadgeGroup>
                          ) : null}
                        </div>
                        <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-5 h-5 text-copper-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Motion>
              ))}
            </Stagger>
          )}
      </div>
    </AppShell>
  )
}
