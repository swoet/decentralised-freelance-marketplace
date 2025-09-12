import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletInfo {
  address: string;
  balance: string;
  network: string;
  connected: boolean;
}

interface EscrowContract {
  id: string;
  address: string;
  project_id: string;
  project_title: string;
  total_amount: string;
  status: 'pending' | 'active' | 'completed' | 'disputed';
  milestones: Array<{
    id: number;
    description: string;
    amount: string;
    status: 'pending' | 'approved' | 'paid';
    due_date: string;
  }>;
  created_at: string;
}

export default function Wallet() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [escrowContracts, setEscrowContracts] = useState<EscrowContract[]>([]);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (user && token) {
      checkWalletConnection();
      fetchEscrowContracts();
    }
  }, [user, token]);

  useEffect(() => {
    // Listen for wallet events
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setWalletInfo(null);
      setError('Wallet disconnected');
    } else {
      checkWalletConnection();
    }
  };

  const handleChainChanged = () => {
    // Reload wallet info when chain changes
    checkWalletConnection();
  };

  const checkWalletConnection = async () => {
    if (!window.ethereum) return;

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length > 0) {
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [accounts[0], 'latest']
        });
        
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const networkName = getNetworkName(chainId);

        const walletData = {
          address: accounts[0],
          balance: formatBalance(balance),
          network: networkName,
          connected: true
        };

        setWalletInfo(walletData);
        
        // Update backend with wallet info
        if (token) {
          updateBackendWallet(accounts[0], chainId);
        }
      }
    } catch (err) {
      console.error('Error checking wallet:', err);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask not detected. Please install MetaMask to use blockchain features.');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts.length > 0) {
        await checkWalletConnection();
        setSuccess('Wallet connected successfully!');
      }
    } catch (err: any) {
      if (err.code === 4001) {
        setError('Connection rejected by user');
      } else {
        setError('Failed to connect wallet: ' + err.message);
      }
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletInfo(null);
    setSuccess('Wallet disconnected');
  };

  const updateBackendWallet = async (address: string, chainId: string) => {
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blockchain/wallet/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallet_address: address,
          chain_id: chainId
        })
      });
    } catch (err) {
      console.error('Failed to update wallet in backend:', err);
    }
  };

  const fetchEscrowContracts = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blockchain/escrow/my-contracts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEscrowContracts(data.contracts || []);
      }
    } catch (err) {
      console.error('Failed to fetch escrow contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  const createEscrow = async (projectId: string) => {
    if (!walletInfo || !token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blockchain/escrow/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          client_address: walletInfo.address
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Escrow contract created! Address: ${data.contract_address}`);
        fetchEscrowContracts();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create escrow');
      }
    } catch (err) {
      setError('Failed to create escrow contract');
    } finally {
      setLoading(false);
    }
  };

  const approveMilestone = async (escrowAddress: string, milestoneId: number) => {
    if (!walletInfo) return;

    setLoading(true);
    setError(null);

    try {
      // This would interact with the smart contract through Web3
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blockchain/escrow/${escrowAddress}/approve-milestone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          milestone_id: milestoneId,
          from_address: walletInfo.address
        })
      });

      if (response.ok) {
        setSuccess('Milestone approved! Transaction submitted to blockchain.');
        fetchEscrowContracts();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to approve milestone');
      }
    } catch (err) {
      setError('Failed to approve milestone');
    } finally {
      setLoading(false);
    }
  };

  const getNetworkName = (chainId: string): string => {
    const networks: { [key: string]: string } = {
      '0x1': 'Ethereum Mainnet',
      '0x3': 'Ropsten Testnet',
      '0x4': 'Rinkeby Testnet',
      '0x5': 'Goerli Testnet',
      '0x89': 'Polygon Mainnet',
      '0x13881': 'Polygon Mumbai',
      '0x539': 'Localhost:8545'
    };
    return networks[chainId] || `Unknown Network (${chainId})`;
  };

  const formatBalance = (balance: string): string => {
    const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
    return balanceInEth.toFixed(4);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'disputed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Wallet - Login Required</title>
        </Head>
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600">Please log in to access your blockchain wallet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Blockchain Wallet - FreelanceX</title>
      </Head>
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Blockchain Wallet</h1>
          <p className="text-lg text-gray-600">
            Connect your Web3 wallet to use smart escrow and secure payments
          </p>
        </div>

        {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
        {success && <Toast message={success} type="success" onClose={() => setSuccess(null)} />}

        {/* Wallet Connection Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Wallet Connection</h2>
          
          {!walletInfo ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Wallet Connected</h3>
              <p className="text-gray-600 mb-6">Connect your MetaMask wallet to access blockchain features</p>
              
              <button
                onClick={connectWallet}
                disabled={connecting}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                {connecting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Connect MetaMask
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">Status</h3>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-700">Connected</span>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Network</h3>
                <p className="text-blue-700 text-sm">{walletInfo.network}</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-medium text-purple-900 mb-2">Balance</h3>
                <p className="text-purple-700 font-mono">{walletInfo.balance} ETH</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Address</h3>
                <p className="text-gray-700 text-xs font-mono break-all">
                  {walletInfo.address}
                </p>
              </div>
            </div>
          )}

          {walletInfo && (
            <div className="mt-6 flex gap-4">
              <button
                onClick={checkWalletConnection}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Refresh
              </button>
              <button
                onClick={disconnectWallet}
                className="border border-red-300 text-red-700 px-4 py-2 rounded-lg hover:bg-red-50"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {/* Escrow Contracts */}
        {walletInfo && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Smart Escrow Contracts</h2>
              <button
                onClick={fetchEscrowContracts}
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            {loading && escrowContracts.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading escrow contracts...</p>
              </div>
            ) : escrowContracts.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Escrow Contracts</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Escrow contracts will appear here when you start working on projects.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {escrowContracts.map(contract => (
                  <div key={contract.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {contract.project_title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Contract: <span className="font-mono text-xs">{contract.address}</span>
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Total: {contract.total_amount} ETH</span>
                          <span>Created: {new Date(contract.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
                        {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                      </span>
                    </div>

                    {/* Milestones */}
                    {contract.milestones && contract.milestones.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Milestones</h4>
                        <div className="space-y-3">
                          {contract.milestones.map(milestone => (
                            <div key={milestone.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">{milestone.description}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                                  <span>Amount: {milestone.amount} ETH</span>
                                  <span>Due: {new Date(milestone.due_date).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(milestone.status)}`}>
                                  {milestone.status}
                                </span>
                                {milestone.status === 'pending' && user?.role === 'client' && (
                                  <button
                                    onClick={() => approveMilestone(contract.address, milestone.id)}
                                    disabled={loading}
                                    className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50"
                                  >
                                    Approve
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
