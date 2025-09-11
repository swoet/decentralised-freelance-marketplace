interface MilestoneData {
  title: string
  description: string
  amount: number
  milestone_type: 'manual' | 'time_based' | 'deliverable_based' | 'approval_based' | 'conditional'
  is_automated: boolean
  auto_release_enabled: boolean
  approval_required: boolean
  due_date?: string
  grace_period_hours: number
  deliverable_requirements?: any
  quality_criteria?: any
  acceptance_criteria?: string
}

interface SmartMilestoneFormProps {
  milestone: MilestoneData
  index: number
  onChange: (index: number, field: keyof MilestoneData, value: any) => void
  onRemove?: () => void
}

export default function SmartMilestoneForm({ milestone, index, onChange, onRemove }: SmartMilestoneFormProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Milestone {index + 1}</h3>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Title *</label>
          <input
            type="text"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={milestone.title}
            onChange={(e) => onChange(index, 'title', e.target.value)}
            placeholder="e.g., Complete wireframes and mockups"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Description *</label>
          <textarea
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            rows={3}
            value={milestone.description}
            onChange={(e) => onChange(index, 'description', e.target.value)}
            placeholder="Detailed description of what needs to be completed for this milestone"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Amount *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={milestone.amount}
            onChange={(e) => onChange(index, 'amount', Number(e.target.value))}
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Milestone Type</label>
          <select
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={milestone.milestone_type}
            onChange={(e) => onChange(index, 'milestone_type', e.target.value)}
          >
            <option value="manual">Manual Approval</option>
            <option value="approval_based">Approval Based</option>
            <option value="time_based">Time Based</option>
            <option value="deliverable_based">Deliverable Based</option>
            <option value="conditional">Conditional</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Due Date (Optional)</label>
          <input
            type="datetime-local"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={milestone.due_date || ''}
            onChange={(e) => onChange(index, 'due_date', e.target.value || undefined)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Grace Period (hours)</label>
          <input
            type="number"
            min="0"
            max="168"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={milestone.grace_period_hours}
            onChange={(e) => onChange(index, 'grace_period_hours', Number(e.target.value))}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Acceptance Criteria (Optional)</label>
          <textarea
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            rows={2}
            value={milestone.acceptance_criteria || ''}
            onChange={(e) => onChange(index, 'acceptance_criteria', e.target.value || undefined)}
            placeholder="Define specific criteria that must be met for this milestone to be considered complete"
          />
        </div>
      </div>

      {/* Automation Settings */}
      <div className="bg-gray-50 rounded-md p-4 space-y-3">
        <div className="text-sm font-medium text-gray-700">Automation Settings</div>
        
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`automated-${index}`}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              checked={milestone.is_automated}
              onChange={(e) => onChange(index, 'is_automated', e.target.checked)}
            />
            <label htmlFor={`automated-${index}`} className="ml-2 block text-sm text-gray-900">
              Enable automation for this milestone
            </label>
          </div>

          {milestone.is_automated && (
            <>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`auto-release-${index}`}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={milestone.auto_release_enabled}
                  onChange={(e) => onChange(index, 'auto_release_enabled', e.target.checked)}
                />
                <label htmlFor={`auto-release-${index}`} className="ml-2 block text-sm text-gray-900">
                  Enable automatic release when conditions are met
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`approval-required-${index}`}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={milestone.approval_required}
                  onChange={(e) => onChange(index, 'approval_required', e.target.checked)}
                />
                <label htmlFor={`approval-required-${index}`} className="ml-2 block text-sm text-gray-900">
                  Require explicit approval before release
                </label>
              </div>
            </>
          )}
        </div>

        {milestone.milestone_type === 'deliverable_based' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Deliverable Requirements</label>
            <textarea
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              rows={2}
              value={milestone.deliverable_requirements ? JSON.stringify(milestone.deliverable_requirements, null, 2) : ''}
              onChange={(e) => {
                try {
                  const parsed = e.target.value ? JSON.parse(e.target.value) : {}
                  onChange(index, 'deliverable_requirements', parsed)
                } catch {
                  // Ignore invalid JSON
                }
              }}
              placeholder='{"file_types": ["pdf", "docx"], "min_files": 1}'
            />
            <div className="text-xs text-gray-500 mt-1">
              JSON format: {"{"}"file_types": ["pdf", "docx"], "min_files": 1{"}"}
            </div>
          </div>
        )}

        {milestone.milestone_type === 'conditional' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Quality Criteria</label>
            <textarea
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              rows={2}
              value={milestone.quality_criteria ? JSON.stringify(milestone.quality_criteria, null, 2) : ''}
              onChange={(e) => {
                try {
                  const parsed = e.target.value ? JSON.parse(e.target.value) : {}
                  onChange(index, 'quality_criteria', parsed)
                } catch {
                  // Ignore invalid JSON
                }
              }}
              placeholder='{"min_quality_score": 4.0, "peer_review_required": true}'
            />
            <div className="text-xs text-gray-500 mt-1">
              JSON format: {"{"}"min_quality_score": 4.0, "peer_review_required": true{"}"}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
