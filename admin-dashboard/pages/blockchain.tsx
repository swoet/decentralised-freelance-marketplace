import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminLayout from '../components/AdminLayout';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function BlockchainPage() {
  const { admin, token, isLoading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !admin) {
      router.push('/login');
      return;
    }
  }, [admin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <AdminLayout title="Blockchain Management">
      <Head>
        <title>Blockchain - Admin Dashboard</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blockchain Management</h1>
          <p className="text-gray-600 mt-1">Monitor smart contracts, transactions, and blockchain health</p>
        </div>

        {/* Blockchain Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
            <p className="text-sm font-medium text-blue-600">Total Transactions</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">12,847</p>
            <p className="text-xs text-blue-600 mt-1">All-time</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
            <p className="text-sm font-medium text-green-600">Active Escrows</p>
            <p className="text-3xl font-bold text-green-900 mt-2">47</p>
            <p className="text-xs text-green-600 mt-1">In progress</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
            <p className="text-sm font-medium text-purple-600">Total Value Locked</p>
            <p className="text-3xl font-bold text-purple-900 mt-2">$284K</p>
            <p className="text-xs text-purple-600 mt-1">USD equivalent</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6">
            <p className="text-sm font-medium text-yellow-600">Gas Fees Avg</p>
            <p className="text-3xl font-bold text-yellow-900 mt-2">$2.34</p>
            <p className="text-xs text-yellow-600 mt-1">Last 24h</p>
          </div>
        </div>

        {/* Smart Contracts */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Deployed Smart Contracts</h2>
          <div className="space-y-4">
            {[
              { name: 'Escrow Contract', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', status: 'active', version: 'v2.1.0' },
              { name: 'Token Contract', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', status: 'active', version: 'v1.5.2' },
              { name: 'Reputation Contract', address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', status: 'active', version: 'v1.2.0' }
            ].map((contract) => (
              <div key={contract.address} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{contract.name}</h3>
                    <p className="text-sm text-gray-500 font-mono mt-1">{contract.address}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
                        {contract.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">{contract.version}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Blockchain Transactions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tx Hash</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[
                  { hash: '0x8f3Cf...239c6A', type: 'Escrow Created', amount: '$2,500', status: 'confirmed', time: '2 mins ago' },
                  { hash: '0x742d3...595f0b', type: 'Payment Released', amount: '$1,800', status: 'confirmed', time: '15 mins ago' },
                  { hash: '0x1BFD6...D9BfD6', type: 'Dispute Opened', amount: '$3,200', status: 'pending', time: '1 hour ago' }
                ].map((tx, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{tx.hash}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        tx.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
