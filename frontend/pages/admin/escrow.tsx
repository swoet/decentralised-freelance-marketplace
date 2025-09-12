import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../../components/Navbar';
import Toast from '../../components/Toast';

interface EscrowOverview {
  total_contracts: number;
  active_contracts: number;
  completed_contracts: number;
  disputed_contracts: number;
  total_value_locked: number;
  pending_releases: number;
  avg_contract_value: number;
}

interface EscrowContract {
  id: string;
  contract_address: string;
  project_id: string;
  project_title: string;
  client_username: string;
  freelancer_username: string;
  total_amount: number;
  amount_released: number;
  status: 'pending' | 'active' | 'completed' | 'disputed' | 'cancelled';
  created_at: string;
  last_activity: string;
  blockchain_network: string;
  milestones: Array<{
    id: number;
    title: string;
    amount: number;
    status: 'pending' | 'completed' | 'approved' | 'disputed';
    due_date: string;
    completion_date?: string;
  }>;
}

interface BlockchainTransaction {
  id: string;
  tx_hash: string;
  contract_address: string;
  type: 'create' | 'release' | 'refund' | 'dispute';
  amount: number;
  from_address: string;
  to_address: string;
  status: 'pending' | 'confirmed' | 'failed';
  gas_used: number;
  gas_price: number;
  block_number: number;
  timestamp: string;
}

interface DisputeCase {
  id: string;
  contract_id: string;
  project_title: string;
  client_username: string;
  freelancer_username: string;
  dispute_reason: string;
  amount_disputed: number;
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  created_at: string;
  evidence_submitted: boolean;
  admin_notes?: string;
}

export default function EscrowManagement() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [overview, setOverview] = useState<EscrowOverview | null>(null);
  const [contracts, setContracts] = useState<EscrowContract[]>([]);
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [disputes, setDisputes] = useState<DisputeCase[]>([]);
  
  const [selectedTab, setSelectedTab] = useState<'overview' | 'contracts' | 'transactions' | 'disputes'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'disputed' | 'pending'>('all');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }
    
    if (token) {
      fetchEscrowData();
    }
  }, [user, token, router]);

  const fetchEscrowData = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const [overviewRes, contractsRes, transactionsRes, disputesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/blockchain/escrow/overview`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/blockchain/escrow/contracts?status=${filterStatus}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/blockchain/transactions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/blockchain/disputes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setOverview(data);
      }

      if (contractsRes.ok) {
        const data = await contractsRes.json();
        setContracts(data.contracts || []);
      }

      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setTransactions(data.transactions || []);
      }

      if (disputesRes.ok) {
        const data = await disputesRes.json();
        setDisputes(data.disputes || []);
      }
    } catch (err) {
      console.error('Failed to fetch escrow data:', err);
      setError('Failed to load escrow management data');
    } finally {
      setLoading(false);
    }
  };

  const forceRelease = async (contractId: string, milestoneId: number) => {
    if (!token) return;

    if (!confirm('Are you sure you want to force release this milestone payment? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/blockchain/escrow/${contractId}/force-release`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ milestone_id: milestoneId })
      });

      if (response.ok) {
        setSuccess('Payment released successfully');
        fetchEscrowData();
      } else {
        setError('Failed to release payment');
      }
    } catch (err) {
      setError('Network error while releasing payment');
    }
  };

  const cancelContract = async (contractId: string, reason: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/blockchain/escrow/${contractId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        setSuccess('Contract cancelled successfully');
        fetchEscrowData();
      } else {
        setError('Failed to cancel contract');
      }
    } catch (err) {
      setError('Network error while cancelling contract');
    }
  };

  const resolveDispute = async (disputeId: string, resolution: 'client' | 'freelancer' | 'split', notes: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/blockchain/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resolution, admin_notes: notes })
      });

      if (response.ok) {
        setSuccess(`Dispute resolved in favor of ${resolution}`);
        fetchEscrowData();
      } else {
        setError('Failed to resolve dispute');
      }
    } catch (err) {
      setError('Network error while resolving dispute');
    }
  };

  const retryTransaction = async (transactionId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/blockchain/transactions/${transactionId}/retry`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSuccess('Transaction retry initiated');
        fetchEscrowData();
      } else {
        setError('Failed to retry transaction');
      }
    } catch (err) {
      setError('Network error while retrying transaction');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'confirmed':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'disputed':
      case 'open':
      case 'investigating':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
      case 'failed':
        return 'bg-gray-100 text-gray-800';
      case 'resolved':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNetworkIcon = (network: string) => {
    switch (network.toLowerCase()) {
      case 'ethereum':
        return '⟠';
      case 'polygon':
        return '⬡';
      case 'bsc':
        return '🔶';
      default:
        return '⛓️';
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.client_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.freelancer_username.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && contract.status === filterStatus;
  });

  const filteredTransactions = transactions.filter(tx =>
    tx.tx_hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.contract_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDisputes = disputes.filter(dispute =>
    dispute.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dispute.client_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dispute.freelancer_username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Access Denied</title>
        </Head>
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">Admin access required to manage escrow system.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Escrow Management - Loading</title>
        </Head>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading escrow management...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Escrow Management - FreelanceX</title>
      </Head>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Escrow Management</h1>
          <p className="text-lg text-gray-600">Monitor blockchain contracts and transactions</p>
        </div>

        {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
        {success && <Toast message={success} type="success" onClose={() => setSuccess(null)} />}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'contracts', label: 'Smart Contracts' },
                { key: 'transactions', label: 'Blockchain Transactions' },
                { key: 'disputes', label: 'Dispute Resolution' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {selectedTab === 'overview' && overview && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Escrow System Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{overview.total_contracts}</div>
                    <div className="text-sm text-gray-600">Total Contracts</div>
                    <div className="text-xs text-green-600 mt-1">
                      {overview.active_contracts} active
                    </div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{formatCurrency(overview.total_value_locked)}</div>
                    <div className="text-sm text-gray-600">Total Value Locked</div>
                    <div className="text-xs text-blue-600 mt-1">
                      {formatCurrency(overview.avg_contract_value)} avg
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">{overview.completed_contracts}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {Math.round((overview.completed_contracts / overview.total_contracts) * 100)}% success rate
                    </div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-3xl font-bold text-red-600">{overview.disputed_contracts}</div>
                    <div className="text-sm text-gray-600">Disputed</div>
                    <div className="text-xs text-yellow-600 mt-1">
                      {overview.pending_releases} pending releases
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contracts Tab */}
            {selectedTab === 'contracts' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Smart Contracts</h2>
                  <div className="flex gap-4">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="all">All Contracts</option>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="disputed">Disputed</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Search contracts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredContracts.map((contract) => (
                    <div key={contract.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{contract.project_title}</h3>
                          <p className="text-sm text-gray-600">
                            {contract.client_username} → {contract.freelancer_username}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-600">
                              {getNetworkIcon(contract.blockchain_network)} {contract.blockchain_network}
                            </span>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {contract.contract_address.slice(0, 10)}...{contract.contract_address.slice(-8)}
                            </code>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(contract.total_amount)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatCurrency(contract.amount_released)} released
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
                            {contract.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Milestones */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Milestones</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {contract.milestones.map((milestone) => (
                            <div key={milestone.id} className="bg-gray-50 p-3 rounded">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-sm text-gray-900">{milestone.title}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(milestone.status)}`}>
                                  {milestone.status}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                {formatCurrency(milestone.amount)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Due: {new Date(milestone.due_date).toLocaleDateString()}
                              </div>
                              {milestone.status === 'pending' && contract.status === 'disputed' && (
                                <button
                                  onClick={() => forceRelease(contract.id, milestone.id)}
                                  className="mt-2 px-2 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700"
                                >
                                  Force Release
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <div>
                          Created: {new Date(contract.created_at).toLocaleDateString()} • 
                          Last Activity: {new Date(contract.last_activity).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          {contract.status === 'active' && (
                            <button
                              onClick={() => cancelContract(contract.id, 'Admin intervention required')}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                              Cancel Contract
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transactions Tab */}
            {selectedTab === 'transactions' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Blockchain Transactions</h2>
                  <input
                    type="text"
                    placeholder="Search by hash or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gas</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="px-4 py-4">
                            <div>
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                {tx.tx_hash.slice(0, 10)}...{tx.tx_hash.slice(-8)}
                              </code>
                              <div className="text-xs text-gray-500 mt-1">
                                Block #{tx.block_number}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              tx.type === 'create' ? 'bg-blue-100 text-blue-800' :
                              tx.type === 'release' ? 'bg-green-100 text-green-800' :
                              tx.type === 'refund' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {formatCurrency(tx.amount)}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {tx.gas_used.toLocaleString()}
                            <div className="text-xs text-gray-500">
                              {(tx.gas_price / 1e9).toFixed(2)} gwei
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {new Date(tx.timestamp).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4">
                            {tx.status === 'failed' && (
                              <button
                                onClick={() => retryTransaction(tx.id)}
                                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                              >
                                Retry
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Disputes Tab */}
            {selectedTab === 'disputes' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Dispute Resolution</h2>
                  <input
                    type="text"
                    placeholder="Search disputes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div className="space-y-4">
                  {filteredDisputes.map((dispute) => (
                    <div key={dispute.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{dispute.project_title}</h3>
                          <p className="text-sm text-gray-600">
                            {dispute.client_username} vs {dispute.freelancer_username}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-red-600">
                            {formatCurrency(dispute.amount_disputed)}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dispute.status)}`}>
                            {dispute.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Dispute Reason:</h4>
                        <p className="text-gray-700">{dispute.dispute_reason}</p>
                      </div>

                      {dispute.admin_notes && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Admin Notes:</h4>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded">{dispute.admin_notes}</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          Created: {new Date(dispute.created_at).toLocaleDateString()} • 
                          Evidence: {dispute.evidence_submitted ? '✅ Submitted' : '❌ Pending'}
                        </div>
                        {dispute.status === 'open' || dispute.status === 'investigating' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => resolveDispute(dispute.id, 'client', 'Resolved in favor of client')}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              Client Wins
                            </button>
                            <button
                              onClick={() => resolveDispute(dispute.id, 'freelancer', 'Resolved in favor of freelancer')}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              Freelancer Wins
                            </button>
                            <button
                              onClick={() => resolveDispute(dispute.id, 'split', 'Split resolution - 50/50')}
                              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                            >
                              Split 50/50
                            </button>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">
                            Status: {dispute.status}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
