import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminLayout from '../components/AdminLayout';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function SupportPage() {
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
    <AdminLayout title="Support">
      <Head>
        <title>Support - Admin Dashboard</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
          <p className="text-gray-600 mt-1">Manage support tickets and user inquiries</p>
        </div>

        {/* Support Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6">
            <p className="text-sm font-medium text-red-600">Open Tickets</p>
            <p className="text-3xl font-bold text-red-900 mt-2">24</p>
            <p className="text-xs text-red-600 mt-1">Requires attention</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6">
            <p className="text-sm font-medium text-yellow-600">In Progress</p>
            <p className="text-3xl font-bold text-yellow-900 mt-2">18</p>
            <p className="text-xs text-yellow-600 mt-1">Being resolved</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
            <p className="text-sm font-medium text-green-600">Resolved Today</p>
            <p className="text-3xl font-bold text-green-900 mt-2">45</p>
            <p className="text-xs text-green-600 mt-1">Last 24 hours</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
            <p className="text-sm font-medium text-blue-600">Avg Response Time</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">2.4h</p>
            <p className="text-xs text-blue-600 mt-1">Last 7 days</p>
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Recent Support Tickets</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                View All Tickets
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[
                  { id: '#12847', user: 'john@example.com', subject: 'Payment not received', priority: 'high', status: 'open', created: '2 hours ago' },
                  { id: '#12846', user: 'jane@example.com', subject: 'Account verification issue', priority: 'medium', status: 'in_progress', created: '5 hours ago' },
                  { id: '#12845', user: 'bob@example.com', subject: 'Project dispute', priority: 'high', status: 'open', created: '1 day ago' },
                  { id: '#12844', user: 'alice@example.com', subject: 'Profile update help', priority: 'low', status: 'resolved', created: '1 day ago' }
                ].map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.user}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{ticket.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        ticket.priority === 'high' 
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : ticket.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        ticket.status === 'open' 
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : ticket.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          : 'bg-green-100 text-green-800 border border-green-200'
                      }`}>
                        {ticket.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.created}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900">View</button>
                    </td>
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
