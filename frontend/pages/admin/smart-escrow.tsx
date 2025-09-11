import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';
import { 
  FiDollarSign, 
  FiClock, 
  FiAlertTriangle, 
  FiTrendingUp,
  FiUsers,
  FiSettings,
  FiEye,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiPause
} from 'react-icons/fi';

interface EscrowStats {
  totalEscrows: number;
  totalValue: number;
  activeEscrows: number;
  completedEscrows: number;
  disputedEscrows: number;
  automatedEscrows: number;
  pendingMilestones: number;
  averageCompletionTime: number;
}

interface SmartEscrow {
  id: string;
  projectId: string;
  projectTitle: string;
  clientId: string;
  freelancerId: string;
  clientName: string;
  freelancerName: string;
  totalAmount: number;
  status: 'CREATED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  automationType: 'NONE' | 'TIME_BASED' | 'DELIVERABLE_BASED' | 'MILESTONE_BASED';
  isAutomated: boolean;
  createdAt: string;
  updatedAt: string;
  milestonesCount: number;
  completedMilestones: number;
  disputeCount: number;
  riskScore: number;
}

interface Dispute {
  id: string;
  escrowId: string;
  projectTitle: string;
  raisedBy: string;
  raisedByName: string;
  disputeType: 'MILESTONE_DELAY' | 'QUALITY_ISSUE' | 'PAYMENT_DISPUTE' | 'CONTRACT_BREACH' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'ESCALATED';
  description: string;
  disputedAmount: number;
  createdAt: string;
  resolvedAt?: string;
}

const AdminSmartEscrowPage: NextPage = () => {
  const [stats, setStats] = useState<EscrowStats | null>(null);
  const [escrows, setEscrows] = useState<SmartEscrow[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'escrows' | 'disputes' | 'analytics'>('overview');
  const [filters, setFilters] = useState({
    status: 'all',
    automationType: 'all',
    riskLevel: 'all',
    dateRange: '30d'
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, escrowsRes, disputesRes] = await Promise.all([
        fetch('/api/v1/financial/smart-escrow/admin/stats'),
        fetch(`/api/v1/financial/smart-escrow/admin/escrows?${new URLSearchParams({
          status: filters.status,
          automation_type: filters.automationType,
          risk_level: filters.riskLevel,
          date_range: filters.dateRange
        })}`),
        fetch('/api/v1/financial/smart-escrow/admin/disputes')
      ]);

      const [statsData, escrowsData, disputesData] = await Promise.all([
        statsRes.json(),
        escrowsRes.json(),
        disputesRes.json()
      ]);

      setStats(statsData);
      setEscrows(escrowsData.escrows || []);
      setDisputes(disputesData.disputes || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (disputeId: string, resolution: 'client_favor' | 'freelancer_favor' | 'partial_refund') => {
    try {
      await fetch(`/api/v1/financial/smart-escrow/admin/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution })
      });
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error resolving dispute:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-blue-600 bg-blue-100';
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'DISPUTED': return 'text-red-600 bg-red-100';
      case 'CANCELLED': return 'text-gray-600 bg-gray-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getDisputePriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Smart Escrow Management - Admin</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Smart Escrow Management</h1>
            <p className="text-gray-600 mt-2">Monitor and manage all smart escrow contracts</p>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Export Report
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <FiDollarSign className="text-2xl text-green-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Value Locked</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${stats.totalValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <FiUsers className="text-2xl text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Active Escrows</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeEscrows}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <FiAlertTriangle className="text-2xl text-red-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Active Disputes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.disputedEscrows}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <FiSettings className="text-2xl text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Automated Escrows</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.automatedEscrows}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'overview', label: 'Overview', icon: FiTrendingUp },
                { key: 'escrows', label: 'Escrows', icon: FiDollarSign },
                { key: 'disputes', label: 'Disputes', icon: FiAlertTriangle },
                { key: 'analytics', label: 'Analytics', icon: FiTrendingUp }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="text-lg" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="DISPUTED">Disputed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select
                value={filters.automationType}
                onChange={(e) => setFilters(prev => ({ ...prev, automationType: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All Automation Types</option>
                <option value="TIME_BASED">Time-based</option>
                <option value="DELIVERABLE_BASED">Deliverable-based</option>
                <option value="MILESTONE_BASED">Milestone-based</option>
                <option value="NONE">Manual</option>
              </select>

              <select
                value={filters.riskLevel}
                onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All Risk Levels</option>
                <option value="high">High Risk (80+)</option>
                <option value="medium">Medium Risk (60-79)</option>
                <option value="low">Low Risk (&lt;60)</option>
              </select>

              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent High-Risk Escrows</h3>
                    <div className="space-y-3">
                      {escrows
                        .filter(e => e.riskScore >= 60)
                        .slice(0, 5)
                        .map(escrow => (
                          <div key={escrow.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{escrow.projectTitle}</p>
                              <p className="text-sm text-gray-600">
                                {escrow.clientName} → {escrow.freelancerName}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskScoreColor(escrow.riskScore)}`}>
                                Risk: {escrow.riskScore}
                              </span>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Disputes</h3>
                    <div className="space-y-3">
                      {disputes.slice(0, 5).map(dispute => (
                        <div key={dispute.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{dispute.projectTitle}</p>
                            <p className="text-sm text-gray-600">{dispute.description.substring(0, 60)}...</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDisputePriorityColor(dispute.priority)}`}>
                              {dispute.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'escrows' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parties
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Risk Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {escrows.map(escrow => (
                      <tr key={escrow.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {escrow.projectTitle}
                            </div>
                            <div className="text-sm text-gray-500">
                              {escrow.isAutomated && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                                  <FiSettings className="mr-1" />
                                  Automated
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div>Client: {escrow.clientName}</div>
                            <div>Freelancer: {escrow.freelancerName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${escrow.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(escrow.status)}`}>
                            {escrow.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(escrow.completedMilestones / escrow.milestonesCount) * 100}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {escrow.completedMilestones}/{escrow.milestonesCount} milestones
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskScoreColor(escrow.riskScore)}`}>
                            {escrow.riskScore}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Link
                            href={`/smart-escrow/${escrow.id}/manage`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FiEye className="inline" />
                          </Link>
                          {escrow.status === 'DISPUTED' && (
                            <button className="text-red-600 hover:text-red-900">
                              <FiAlertTriangle className="inline" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'disputes' && (
              <div className="space-y-4">
                {disputes.map(dispute => (
                  <div key={dispute.id} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{dispute.projectTitle}</h3>
                        <p className="text-sm text-gray-600">Raised by {dispute.raisedByName}</p>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDisputePriorityColor(dispute.priority)}`}>
                          {dispute.priority}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dispute.status)}`}>
                          {dispute.status}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-700">{dispute.description}</p>
                      <div className="mt-2 text-sm text-gray-600">
                        <span>Disputed Amount: ${dispute.disputedAmount.toLocaleString()}</span>
                        <span className="ml-4">Type: {dispute.disputeType}</span>
                        <span className="ml-4">Created: {new Date(dispute.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {dispute.status === 'OPEN' && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleResolveDispute(dispute.id, 'client_favor')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          <FiCheckCircle className="inline mr-2" />
                          Favor Client
                        </button>
                        <button
                          onClick={() => handleResolveDispute(dispute.id, 'freelancer_favor')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          <FiCheckCircle className="inline mr-2" />
                          Favor Freelancer
                        </button>
                        <button
                          onClick={() => handleResolveDispute(dispute.id, 'partial_refund')}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                        >
                          <FiPause className="inline mr-2" />
                          Partial Refund
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="text-center py-12">
                  <FiTrendingUp className="text-6xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Analytics Dashboard</h3>
                  <p className="text-gray-600">Advanced analytics and reporting features coming soon</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSmartEscrowPage;
