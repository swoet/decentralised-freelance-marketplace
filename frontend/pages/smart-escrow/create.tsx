import Head from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'
import AppShell from '../../components/layout/AppShell'
import SmartMilestoneForm from '../../components/smart-escrow/SmartMilestoneForm'

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

export default function CreateSmartEscrow() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)

  // Basic escrow data
  const [escrowData, setEscrowData] = useState({
    project_id: '',
    client_id: '',
    freelancer_id: '',
    total_amount: '',
    currency_id: '',
    is_automated: true,
    automation_enabled: true,
    auto_release_delay_hours: 72,
    chain_id: null as number | null,
    payment_mode: 'native' as 'native' | 'token',
    token_address: '',
    reputation_impact_enabled: true,
    quality_threshold: 4.0,
    meta_data: {}
  })

  const [milestones, setMilestones] = useState<MilestoneData[]>([
    {
      title: '',
      description: '',
      amount: 0,
      milestone_type: 'approval_based',
      is_automated: false,
      auto_release_enabled: false,
      approval_required: true,
      grace_period_hours: 24,
      acceptance_criteria: ''
    }
  ])

  const addMilestone = () => {
    setMilestones(prev => [...prev, {
      title: '',
      description: '',
      amount: 0,
      milestone_type: 'approval_based',
      is_automated: false,
      auto_release_enabled: false,
      approval_required: true,
      grace_period_hours: 24,
      acceptance_criteria: ''
    }])
  }

  const updateMilestone = (index: number, field: keyof MilestoneData, value: any) => {
    setMilestones(prev => prev.map((m, i) => 
      i === index ? { ...m, [field]: value } : m
    ))
  }

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(prev => prev.filter((_, i) => i !== index))
    }
  }

  const validateStep1 = () => {
    return escrowData.project_id && escrowData.client_id && escrowData.freelancer_id && 
           escrowData.total_amount && escrowData.currency_id
  }

  const validateStep2 = () => {
    const totalMilestoneAmount = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0)
    const escrowAmount = Number(escrowData.total_amount) || 0
    
    return milestones.every(m => m.title && m.description && m.amount > 0) && 
           Math.abs(totalMilestoneAmount - escrowAmount) < 0.01
  }

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) {
      setError('Please fill in all required fields correctly')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create the smart escrow
      const escrowResponse = await fetch('/api/v1/smart-escrow/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(escrowData)
      })

      if (!escrowResponse.ok) {
        throw new Error('Failed to create smart escrow')
      }

      const escrow = await escrowResponse.json()

      // Create milestones
      for (const [index, milestone] of milestones.entries()) {
        const milestonePayload = {
          ...milestone,
          escrow_id: escrow.id,
          project_id: escrowData.project_id,
          order_index: index,
          due_date: milestone.due_date ? new Date(milestone.due_date).toISOString() : null
        }

        const milestoneResponse = await fetch(`/api/v1/smart-escrow/${escrow.id}/milestones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(milestonePayload)
        })

        if (!milestoneResponse.ok) {
          throw new Error(`Failed to create milestone ${index + 1}`)
        }
      }

      router.push(`/smart-escrow/${escrow.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { number: 1, title: 'Basic Information', description: 'Set up escrow details' },
    { number: 2, title: 'Milestones', description: 'Define project milestones' },
    { number: 3, title: 'Review & Create', description: 'Confirm and create escrow' }
  ]

  return (
    <AppShell>
      <Head>
        <title>Create Smart Escrow</title>
      </Head>

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Smart Escrow</h1>
          <p className="mt-2 text-sm text-gray-600">
            Set up an automated escrow with milestone-based payments and smart contract integration.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center">
          <nav className="flex space-x-4">
            {steps.map((step) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= step.number 
                    ? 'bg-indigo-600 border-indigo-600 text-white' 
                    : 'border-gray-300 text-gray-500'
                }`}>
                  {step.number}
                </div>
                <div className="ml-2">
                  <div className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-indigo-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
                {step.number < steps.length && (
                  <div className={`mx-4 h-0.5 w-8 ${
                    currentStep > step.number ? 'bg-indigo-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Basic Escrow Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project ID</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={escrowData.project_id}
                    onChange={(e) => setEscrowData(prev => ({ ...prev, project_id: e.target.value }))}
                    placeholder="Enter project UUID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Currency ID</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={escrowData.currency_id}
                    onChange={(e) => setEscrowData(prev => ({ ...prev, currency_id: e.target.value }))}
                    placeholder="Enter currency UUID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Client ID</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={escrowData.client_id}
                    onChange={(e) => setEscrowData(prev => ({ ...prev, client_id: e.target.value }))}
                    placeholder="Enter client user UUID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Freelancer ID</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={escrowData.freelancer_id}
                    onChange={(e) => setEscrowData(prev => ({ ...prev, freelancer_id: e.target.value }))}
                    placeholder="Enter freelancer user UUID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={escrowData.total_amount}
                    onChange={(e) => setEscrowData(prev => ({ ...prev, total_amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Mode</label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={escrowData.payment_mode}
                    onChange={(e) => setEscrowData(prev => ({ ...prev, payment_mode: e.target.value as any }))}
                  >
                    <option value="native">Native Currency</option>
                    <option value="token">Token</option>
                  </select>
                </div>
              </div>

              {escrowData.payment_mode === 'token' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Token Address</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={escrowData.token_address}
                    onChange={(e) => setEscrowData(prev => ({ ...prev, token_address: e.target.value }))}
                    placeholder="0x..."
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Chain ID (Optional)</label>
                  <input
                    type="number"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={escrowData.chain_id || ''}
                    onChange={(e) => setEscrowData(prev => ({ ...prev, chain_id: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="1 (Ethereum Mainnet)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Auto-Release Delay (hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="8760"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={escrowData.auto_release_delay_hours}
                    onChange={(e) => setEscrowData(prev => ({ ...prev, auto_release_delay_hours: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_automated"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={escrowData.is_automated}
                    onChange={(e) => setEscrowData(prev => ({ ...prev, is_automated: e.target.checked }))}
                  />
                  <label htmlFor="is_automated" className="ml-2 block text-sm text-gray-900">
                    Enable automation features
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="reputation_impact"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={escrowData.reputation_impact_enabled}
                    onChange={(e) => setEscrowData(prev => ({ ...prev, reputation_impact_enabled: e.target.checked }))}
                  />
                  <label htmlFor="reputation_impact" className="ml-2 block text-sm text-gray-900">
                    Enable reputation impact tracking
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Milestones */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Project Milestones</h2>
                <div className="text-sm text-gray-600">
                  Total: {milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0).toFixed(2)} / 
                  {Number(escrowData.total_amount || 0).toFixed(2)}
                </div>
              </div>

              <div className="space-y-6">
                {milestones.map((milestone, index) => (
                  <SmartMilestoneForm
                    key={index}
                    milestone={milestone}
                    index={index}
                    onChange={updateMilestone}
                    onRemove={milestones.length > 1 ? () => removeMilestone(index) : undefined}
                  />
                ))}
              </div>

              <button
                onClick={addMilestone}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors"
              >
                <div className="text-sm text-gray-600">+ Add Another Milestone</div>
              </button>

              {Math.abs(milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0) - Number(escrowData.total_amount || 0)) >= 0.01 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="text-sm text-yellow-800">
                    ⚠️ Warning: Milestone amounts don&apos;t match the total escrow amount
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Review & Confirm</h2>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Total Amount</div>
                    <div className="text-lg font-semibold">{escrowData.total_amount}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Payment Mode</div>
                    <div className="text-lg font-semibold">{escrowData.payment_mode}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Automation</div>
                    <div className="text-lg font-semibold">{escrowData.is_automated ? 'Enabled' : 'Disabled'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Milestones</div>
                    <div className="text-lg font-semibold">{milestones.length}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2">Milestones Overview</div>
                  <div className="space-y-2">
                    {milestones.map((milestone, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span>{milestone.title}</span>
                        <span className="font-medium">{milestone.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-sm text-red-600">{error}</div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t border-gray-200 mt-8">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:text-gray-400 text-gray-700 px-4 py-2 rounded-md"
            >
              Previous
            </button>

            {currentStep < 3 ? (
              <button
                onClick={() => {
                  if (currentStep === 1 && !validateStep1()) {
                    setError('Please fill in all required fields in step 1')
                    return
                  }
                  if (currentStep === 2 && !validateStep2()) {
                    setError('Please complete all milestones and ensure amounts match')
                    return
                  }
                  setError(null)
                  setCurrentStep(currentStep + 1)
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md"
              >
                {loading ? 'Creating...' : 'Create Smart Escrow'}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
