import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface SmartMilestone {
  id: string
  title: string
  description: string
  amount: string
  order_index: number
  status: string
  milestone_type: string
  is_automated: boolean
  auto_release_enabled: boolean
  approval_required: boolean
  due_date?: string
  auto_release_date?: string
  created_at: string
  submitted_at?: string
  approved_at?: string
  released_at?: string
}

interface SmartMilestoneCardProps {
  milestone: SmartMilestone
  escrowId: string
  onUpdate: () => void
}

export default function SmartMilestoneCard({ milestone, escrowId, onUpdate }: SmartMilestoneCardProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)
  const [submissionNotes, setSubmissionNotes] = useState('')
  const [deliverableUrls, setDeliverableUrls] = useState<string[]>([''])

  const handleSubmit = async () => {
    setLoading('submit')
    try {
      const response = await fetch(`/api/v1/smart-escrow/milestones/${milestone.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          submission_notes: submissionNotes,
          deliverable_urls: deliverableUrls.filter(url => url.trim()),
          submission_data: {
            submitted_at: new Date().toISOString()
          }
        })
      })

      if (!response.ok) throw new Error('Failed to submit milestone')

      setShowSubmissionForm(false)
      setSubmissionNotes('')
      setDeliverableUrls([''])
      onUpdate()
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(null)
    }
  }

  const handleApprove = async (approved: boolean) => {
    setLoading(approved ? 'approve' : 'reject')
    try {
      const response = await fetch(`/api/v1/smart-escrow/milestones/${milestone.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          approved,
          feedback: approved ? 'Milestone approved' : 'Milestone rejected',
          quality_score: approved ? 5.0 : 2.0
        })
      })

      if (!response.ok) throw new Error(`Failed to ${approved ? 'approve' : 'reject'} milestone`)

      onUpdate()
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'submitted': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-indigo-100 text-indigo-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'auto_released': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'time_based': return 'bg-blue-100 text-blue-700'
      case 'deliverable_based': return 'bg-green-100 text-green-700'
      case 'approval_based': return 'bg-yellow-100 text-yellow-700'
      case 'conditional': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const canSubmit = milestone.status === 'pending' || milestone.status === 'in_progress'
  const canApprove = milestone.status === 'submitted'
  const isOverdue = milestone.due_date && new Date(milestone.due_date) < new Date()

  return (
    <div className="border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-medium text-gray-900">
              {milestone.order_index + 1}. {milestone.title}
            </h3>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(milestone.status)}`}>
              {milestone.status.replace('_', ' ').toUpperCase()}
            </span>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(milestone.milestone_type)}`}>
              {milestone.milestone_type.replace('_', ' ')}
            </span>
            {milestone.is_automated && (
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                🤖 AUTO
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="font-medium text-gray-900">
              Amount: {parseFloat(milestone.amount).toLocaleString()} ETH
            </span>
            {milestone.due_date && (
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                Due: {new Date(milestone.due_date).toLocaleDateString()}
                {isOverdue && ' (Overdue)'}
              </span>
            )}
            {milestone.submitted_at && (
              <span>
                Submitted: {formatDistanceToNow(new Date(milestone.submitted_at), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          {canSubmit && (
            <button
              onClick={() => setShowSubmissionForm(true)}
              disabled={loading === 'submit'}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm font-medium"
            >
              {loading === 'submit' ? 'Submitting...' : 'Submit'}
            </button>
          )}
          
          {canApprove && (
            <>
              <button
                onClick={() => handleApprove(true)}
                disabled={loading === 'approve'}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm font-medium"
              >
                {loading === 'approve' ? 'Approving...' : 'Approve'}
              </button>
              <button
                onClick={() => handleApprove(false)}
                disabled={loading === 'reject'}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm font-medium"
              >
                {loading === 'reject' ? 'Rejecting...' : 'Reject'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Submission Form */}
      {showSubmissionForm && (
        <div className="bg-gray-50 rounded-md p-4 space-y-4">
          <h4 className="text-md font-medium text-gray-900">Submit Milestone</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Submission Notes
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              rows={3}
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              placeholder="Describe what you've completed and any relevant details..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deliverable URLs
            </label>
            {deliverableUrls.map((url, index) => (
              <div key={index} className="flex mb-2">
                <input
                  type="url"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={url}
                  onChange={(e) => {
                    const newUrls = [...deliverableUrls]
                    newUrls[index] = e.target.value
                    setDeliverableUrls(newUrls)
                  }}
                  placeholder="https://..."
                />
                {deliverableUrls.length > 1 && (
                  <button
                    onClick={() => {
                      const newUrls = deliverableUrls.filter((_, i) => i !== index)
                      setDeliverableUrls(newUrls)
                    }}
                    className="ml-2 px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setDeliverableUrls([...deliverableUrls, ''])}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              + Add Another URL
            </button>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setShowSubmissionForm(false)
                setSubmissionNotes('')
                setDeliverableUrls([''])
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading === 'submit'}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-md text-sm font-medium"
            >
              {loading === 'submit' ? 'Submitting...' : 'Submit Milestone'}
            </button>
          </div>
        </div>
      )}

      {/* Timestamps */}
      {(milestone.submitted_at || milestone.approved_at || milestone.released_at) && (
        <div className="bg-gray-50 rounded-md p-3">
          <div className="text-xs text-gray-500 space-y-1">
            {milestone.submitted_at && (
              <div>Submitted: {new Date(milestone.submitted_at).toLocaleString()}</div>
            )}
            {milestone.approved_at && (
              <div>Approved: {new Date(milestone.approved_at).toLocaleString()}</div>
            )}
            {milestone.released_at && (
              <div>Released: {new Date(milestone.released_at).toLocaleString()}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
