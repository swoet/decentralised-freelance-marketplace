import Head from 'next/head'
import AppShell from '../../components/layout/AppShell'

export default function ClientDashboard() {
  return (
    <AppShell>
      <Head>
        <title>Client Dashboard</title>
      </Head>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Project Pipeline</h2>
            <p className="text-sm text-gray-600">No projects yet. Post your first project to get started.</p>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Recommended Freelancers</h2>
            <p className="text-sm text-gray-600">Personalized recommendations will appear here.</p>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Escrow Status</h2>
            <p className="text-sm text-gray-600">Track milestone progress and releases.</p>
          </div>
        </section>
        <aside className="space-y-6">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-1">KPIs</h3>
            <ul className="text-sm text-gray-700 list-disc pl-5">
              <li>Total Spend: —</li>
              <li>Active Projects: 0</li>
              <li>Pending Milestones: 0</li>
            </ul>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Notifications</h3>
            <p className="text-sm text-gray-600">You have no notifications.</p>
          </div>
        </aside>
      </div>
    </AppShell>
  )
}
