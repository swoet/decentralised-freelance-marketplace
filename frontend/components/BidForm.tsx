import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Toast from './Toast';

interface BidFormProps {
  projectId: string;
  onBidSubmitted: () => void;
  onCancel: () => void;
}

export default function BidForm({ projectId, onBidSubmitted, onCancel }: BidFormProps) {
  const { token, user } = useAuth();
  const [amount, setAmount] = useState('');
  const [proposal, setProposal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !proposal) {
      setError('Please fill in all fields');
      return;
    }

    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    if (!projectId) {
      setError('Project ID is missing');
      return;
    }

    if (parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/bids/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_id: projectId,
          freelancer_id: user?.id,
          amount: parseFloat(amount),
          proposal: proposal,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Bid submission error:', errorData);
        console.error('Validation error details:', JSON.stringify(errorData, null, 2));
        console.error('Request payload:', {
          project_id: projectId,
          freelancer_id: user?.id,
          amount: parseFloat(amount),
          proposal: proposal,
        });
        throw new Error(errorData.detail || 'Failed to submit bid');
      }

      onBidSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit bid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Your Bid</h3>
          
          {error && <Toast message={error} type="error" />}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Bid Amount ($)
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your bid amount"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label htmlFor="proposal" className="block text-sm font-medium text-gray-700">
                Proposal
              </label>
              <textarea
                id="proposal"
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                rows={6}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Describe your approach, timeline, and why you're the best fit for this project..."
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Bid'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 