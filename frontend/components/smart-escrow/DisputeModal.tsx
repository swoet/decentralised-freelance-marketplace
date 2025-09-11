import { useState } from 'react'

interface DisputeModalProps {
  escrowId: string
  onClose: () => void
  onSuccess: () => void
}

export default function DisputeModal({ escrowId, onClose, onSuccess }: DisputeModalProps) {
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
      const response = await fetch(`/api/v1/smart-escrow/${escrowId}/disputes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          disputed_amount: parseFloat(formData.disputed_amount),
          evidence_urls: formData.evidence_urls.filter(url => url.trim()),
          raised_by: 'current_user' // This would be set by the backend
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create dispute')
      }

      onSuccess()
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const addEvidenceUrl = () => {
    setFormData(prev => ({
      ...prev,
      evidence_urls: [...prev.evidence_urls, '']
    }))
  }

  const removeEvidenceUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      evidence_urls: prev.evidence_urls.filter((_, i) => i !== index)
    }))
  }

  const updateEvidenceUrl = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      evidence_urls: prev.evidence_urls.map((url, i) => i === index ? value : url)
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Raise Dispute</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Priority
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief summary of the dispute"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the issue and what resolution you're seeking"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Disputed Amount (ETH) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.disputed_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, disputed_amount: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Evidence URLs (Optional)
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Provide links to screenshots, documents, or other evidence supporting your dispute.
              </p>
              {formData.evidence_urls.map((url, index) => (
                <div key={index} className="flex mb-2">
                  <input
                    type="url"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                    value={url}
                    onChange={(e) => updateEvidenceUrl(index, e.target.value)}
                    placeholder="https://..."
                  />
                  {formData.evidence_urls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEvidenceUrl(index)}
                      className="ml-2 px-2 py-1 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addEvidenceUrl}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                + Add Evidence URL
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-sm">
                  <p className="text-yellow-800 font-medium">Important Notice</p>
                  <p className="text-yellow-700 mt-1">
                    Raising a dispute will pause the escrow and notify all parties. A mediator will be assigned to review the case. 
                    Please ensure you have provided all relevant information and evidence.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title || !formData.description || !formData.disputed_amount}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md text-sm font-medium"
              >
                {loading ? 'Creating Dispute...' : 'Raise Dispute'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
