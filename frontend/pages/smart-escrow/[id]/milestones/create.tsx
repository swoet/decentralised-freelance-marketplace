import Head from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'
import AppShell from '../../../../components/layout/AppShell'
import Link from 'next/link'

export default function CreateMilestone() {
  const router = useRouter()
  const { id } = router.query
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    milestone_type: 'deliverable_based',
    due_date: '',
    is_automated: false,
    auto_release_enabled: false,
    approval_required: true,
    deliverables: ['']
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/v1/smart-escrow/${id}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          deliverables: formData.deliverables.filter(d => d.trim()),
          due_date: formData.due_date || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to create milestone')
      }

      router.push(`/smart-escrow/${id}/milestones`)
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const addDeliverable = () => {
    setFormData(prev => ({ ...prev, deliverables: [...prev.deliverables, ''] }))
  }

  const updateDeliverable = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.map((d, i) => i === index ? value : d)
    }))
  }

  const removeDeliverable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index)
    }))
  }

  return (
    <AppShell>
      <Head>
        <title>Create Milestone - Smart Escrow</title>
      </Head>

      <div className="space-y-6">
        <div>
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/smart-escrow/dashboard" className="text-gray-400 hover:text-gray-500">Dashboard</Link>
              </li>
              <li><span className="text-gray-400">/</span></li>
              <li>
                <Link href={`/smart-escrow/${id}`} className="text-gray-400 hover:text-gray-500">Escrow</Link>
              </li>
              <li><span className="text-gray-400">/</span></li>
              <li>
                <Link href={`/smart-escrow/${id}/milestones`} className="text-gray-400 hover:text-gray-500">Milestones</Link>
              </li>
              <li><span className="text-gray-400">/</span></li>
              <li><span className="text-gray-900 font-medium">Create</span></li>
            </ol>
          </nav>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Create New Milestone</h1>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Complete initial design mockups"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of what needs to be accomplished"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (ETH) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Milestone Type
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.milestone_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, milestone_type: e.target.value }))}
                >
                  <option value="deliverable_based">Deliverable Based</option>
                  <option value="time_based">Time Based</option>
                  <option value="approval_based">Approval Based</option>
                  <option value="conditional">Conditional</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="is_automated"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    checked={formData.is_automated}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_automated: e.target.checked }))}
                  />
                  <label htmlFor="is_automated" className="ml-2 block text-sm text-gray-900">
                    Automated milestone
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="auto_release_enabled"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    checked={formData.auto_release_enabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, auto_release_enabled: e.target.checked }))}
                  />
                  <label htmlFor="auto_release_enabled" className="ml-2 block text-sm text-gray-900">
                    Enable auto-release
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="approval_required"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    checked={formData.approval_required}
                    onChange={(e) => setFormData(prev => ({ ...prev, approval_required: e.target.checked }))}
                  />
                  <label htmlFor="approval_required" className="ml-2 block text-sm text-gray-900">
                    Approval required
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deliverables (Optional)
              </label>
              <p className="text-sm text-gray-500 mb-2">
                List the specific deliverables or requirements for this milestone.
              </p>
              {formData.deliverables.map((deliverable, index) => (
                <div key={index} className="flex mb-2">
                  <input
                    type="text"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                    value={deliverable}
                    onChange={(e) => updateDeliverable(index, e.target.value)}
                    placeholder="e.g. Homepage wireframe, User flow diagram"
                  />
                  {formData.deliverables.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDeliverable(index)}
                      className="ml-2 px-2 py-1 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addDeliverable}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                + Add Deliverable
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm">
                  <p className="text-blue-800 font-medium">Milestone Settings</p>
                  <ul className="text-blue-700 mt-1 space-y-1">
                    <li>• <strong>Automated:</strong> Uses smart contract conditions for completion</li>
                    <li>• <strong>Auto-release:</strong> Payments released automatically when conditions are met</li>
                    <li>• <strong>Approval required:</strong> Manual approval needed before payment release</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Link
                href={`/smart-escrow/${id}/milestones`}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !formData.title || !formData.description || !formData.amount}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-md text-sm font-medium"
              >
                {loading ? 'Creating...' : 'Create Milestone'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
