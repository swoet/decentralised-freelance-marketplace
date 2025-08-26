import Head from 'next/head'
import AppShell from '../../components/layout/AppShell'

export default function CommunityIndex() {
  return (
    <AppShell>
      <Head>
        <title>Community</title>
      </Head>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Community</h1>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-gray-700">Forums, events and networking coming soon.</p>
        </div>
      </div>
    </AppShell>
  )
}
