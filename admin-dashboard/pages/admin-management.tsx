import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminLayout from '../components/AdminLayout';
import { useAdminAuth } from '../context/AdminAuthContext';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
  profile?: {
    first_name: string;
    last_name: string;
  };
}

interface AdminForm {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'super_admin';
}

export default function AdminManagement() {
  const { admin, token, isLoading } = useAdminAuth();
  const router = useRouter();
  
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState<AdminForm>({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'admin'
  });

  useEffect(() => {
    if (!isLoading && (!admin || admin.role !== 'super_admin')) {
      router.push('/');
      return;
    }
    
    if (admin && token) {
      fetchAdmins();
    }
  }, [admin, token, isLoading, router]);

  const fetchAdmins = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/admins`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins || []);
      } else {
        setError('Failed to load admin users');
      }
    } catch (err) {
      setError('Network error while loading admins');
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/create-admin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        setSuccess('Admin user created successfully!');
        setShowCreateForm(false);
        setForm({
          username: '',
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          role: 'admin'
        });
        fetchAdmins();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create admin user');
      }
    } catch (err) {
      setError('Network error while creating admin');
    }
  };

  const toggleAdminStatus = async (adminId: string, currentStatus: boolean) => {
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${adminId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (response.ok) {
        setSuccess(`Admin ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchAdmins();
      } else {
        setError('Failed to update admin status');
      }
    } catch (err) {
      setError('Network error while updating status');
    }
  };

  const changeAdminRole = async (adminId: string, newRole: 'admin' | 'super_admin') => {
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${adminId}/change-role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        setSuccess(`Admin role changed to ${newRole} successfully`);
        fetchAdmins();
      } else {
        setError('Failed to change admin role');
      }
    } catch (err) {
      setError('Network error while changing role');
    }
  };

  const deleteAdmin = async (adminId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${adminId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSuccess('Admin user deleted successfully');
        setShowDeleteConfirm(null);
        fetchAdmins();
      } else {
        setError('Failed to delete admin user');
      }
    } catch (err) {
      setError('Network error while deleting admin');
    }
  };

  const resetPassword = async (adminId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${adminId}/reset-password`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Password reset successfully. New password: ${data.new_password}`);
      } else {
        setError('Failed to reset password');
      }
    } catch (err) {
      setError('Network error while resetting password');
    }
  };

  const getRoleBadge = (role: string) => {
    return role === 'super_admin' 
      ? 'bg-purple-100 text-purple-800 border-purple-200' 
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!admin || admin.role !== 'super_admin') {
    return (
      <AdminLayout title="Access Denied">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Super Admin access required to manage administrators.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Admin Management">
      <Head>
        <title>Admin Management - FreelanceX</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
            <p className="text-gray-600 mt-1">Manage system administrators and their permissions</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="admin-button-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Admin
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto pl-3"
              >
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
              <button
                onClick={() => setSuccess(null)}
                className="ml-auto pl-3"
              >
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Admin List */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-section-title">System Administrators</h2>
            <span className="text-sm text-gray-500">{admins.length} total admins</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {admins.map((adminUser) => (
                <div key={adminUser.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-lg">
                          {adminUser.profile?.first_name?.[0] || adminUser.username[0].toUpperCase()}
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {adminUser.profile?.first_name} {adminUser.profile?.last_name || adminUser.username}
                        </h3>
                        <p className="text-gray-600">{adminUser.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadge(adminUser.role)}`}>
                            {adminUser.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(adminUser.is_active)}`}>
                            {adminUser.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {adminUser.is_verified && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Created: {new Date(adminUser.created_at).toLocaleDateString()}
                          {adminUser.last_login && (
                            <> • Last login: {new Date(adminUser.last_login).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {adminUser.id !== admin.id && (
                        <>
                          <button
                            onClick={() => toggleAdminStatus(adminUser.id, adminUser.is_active)}
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              adminUser.is_active 
                                ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {adminUser.is_active ? 'Deactivate' : 'Activate'}
                          </button>

                          {adminUser.role === 'admin' && (
                            <button
                              onClick={() => changeAdminRole(adminUser.id, 'super_admin')}
                              className="px-3 py-1 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700"
                            >
                              Promote
                            </button>
                          )}

                          {adminUser.role === 'super_admin' && admin.role === 'super_admin' && (
                            <button
                              onClick={() => changeAdminRole(adminUser.id, 'admin')}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                            >
                              Demote
                            </button>
                          )}

                          <button
                            onClick={() => resetPassword(adminUser.id)}
                            className="px-3 py-1 bg-orange-600 text-white rounded text-sm font-medium hover:bg-orange-700"
                          >
                            Reset Password
                          </button>

                          <button
                            onClick={() => setShowDeleteConfirm(adminUser.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      
                      {adminUser.id === admin.id && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm font-medium">
                          Current User
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {admins.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No administrators found.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create Admin Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Administrator</h3>
              
              <form onSubmit={createAdmin} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={form.first_name}
                      onChange={(e) => setForm(prev => ({ ...prev, first_name: e.target.value }))}
                      className="admin-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={form.last_name}
                      onChange={(e) => setForm(prev => ({ ...prev, last_name: e.target.value }))}
                      className="admin-input"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
                    className="admin-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    className="admin-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                    className="admin-input"
                    minLength={8}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'super_admin' }))}
                    className="admin-select"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="admin-button-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-button-primary"
                  >
                    Create Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this administrator? This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="admin-button-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteAdmin(showDeleteConfirm)}
                  className="admin-button-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
