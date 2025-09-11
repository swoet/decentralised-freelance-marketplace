import Head from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'
import AppShell from '../../../../components/layout/AppShell'
import Link from 'next/link'

export default function CreateDispute() {
  const router = useRouter()
  const { id } = router.query
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    dispute_type: 'quality',
    title: '',
    description: '',
    disputed_amount: '',
    priority: 'medium',
    evidence_urls: ['']
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/v1/smart-escrow/${id}/disputes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          disputed_amount: parseFloat(formData.disputed_amount),
          evidence_urls: formData.evidence_urls.filter(url => url.trim())
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to create dispute')
      }

      router.push(`/smart-escrow/${id}?tab=disputes`)
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const addEvidenceUrl = () => {
    setFormData(prev => ({ ...prev, evidence_urls: [...prev.evidence_urls, ''] }))
  }

  const updateEvidenceUrl = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      evidence_urls: prev.evidence_urls.map((url, i) => i === index ? value : url)
    }))
  }

  const removeEvidenceUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      evidence_urls: prev.evidence_urls.filter((_, i) => i !== index)
    }))
  }

  return (
    <AppShell>
      <Head>
        <title>Raise Dispute - Smart Escrow</title>
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
              <li><span className="text-gray-900 font-medium">Raise Dispute</span></li>
            </ol>
          </nav>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Raise Dispute</h1>
          <p className="mt-1 text-sm text-gray-500">
            Filing a dispute will pause the escrow and initiate mediation. Please provide detailed information to help resolve the issue.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dispute Type *
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.dispute_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, dispute_type: e.target.value }))}
                  required
                >
                  <option value="quality">Quality Issues</option>
                  <option value="deadline">Missed Deadline</option>
                  <option value="scope">Scope Disagreement</option>
                  <option value="payment">Payment Issues</option>
                  <option value="communication">Communication Problems</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority Level
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="low">Low - Minor issues</option>
                  <option value="medium">Medium - Significant concerns</option>
                  <option value="high">High - Major problems</option>
                  <option value="urgent">Urgent - Immediate attention needed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dispute Title *
              </label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief summary of the dispute"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Detailed Description *
              </label>
              <textarea
                required
                rows={5}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide a detailed explanation of the issue, timeline of events, and what resolution you're seeking..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Disputed Amount (ETH) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.disputed_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, disputed_amount: e.target.value }))}
                placeholder="Amount in dispute (e.g., 1.5)"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the amount of ETH that is in dispute. This may be partial or the full escrow amount.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evidence URLs (Optional)
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Provide links to screenshots, documents, chat logs, or other evidence that supports your dispute. 
                This will help mediators make an informed decision.
              </p>
              {formData.evidence_urls.map((url, index) => (
                <div key={index} className="flex mb-2">
                  <input
                    type="url"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                    value={url}
                    onChange={(e) => updateEvidenceUrl(index, e.target.value)}
                    placeholder="https://example.com/evidence"
                  />
                  {formData.evidence_urls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEvidenceUrl(index)}
                      className="ml-2 px-3 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded-md"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addEvidenceUrl}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                + Add Evidence URL
              </button>
            </div>

            {/* Warning Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-sm">
                  <h3 className="text-yellow-800 font-medium">Important Notice</h3>
                  <div className="text-yellow-700 mt-2 space-y-2">
                    <p>• Raising a dispute will <strong>immediately pause</strong> all escrow activity</p>
                    <p>• All parties will be notified and a qualified mediator will be assigned</p>
                    <p>• The dispute process typically takes 3-7 business days to resolve</p>
                    <p>• False or frivolous disputes may result in penalties</p>
                    <p>• Try to resolve issues through direct communication before filing a dispute</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Link
                href={`/smart-escrow/${id}`}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !formData.title || !formData.description || !formData.disputed_amount}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md text-sm font-medium"
              >
                {loading ? 'Filing Dispute...' : 'File Dispute'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
