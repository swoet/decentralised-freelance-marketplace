import { useEffect, useState } from 'react';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import { useAuth } from '@/context/AuthContext';

export default function OrgsPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [editOrgName, setEditOrgName] = useState('');
  const { token, loading: authLoading } = useAuth();

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';
    fetch(`${API_URL}/organizations/`).then(async (res) => {
      if (!res.ok) throw new Error('Failed to load organizations');
      const data = await res.json();
      setOrgs(Array.isArray(data) ? data : []);
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    if (!token) {
      setError('Please log in to create an organization.');
      return;
    }
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';
    fetch(`${API_URL}/organizations/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ name: newOrgName, owner_id: null }),
    }).then(async (res) => {
      if (!res.ok) {
        let msg = 'Failed to create organization';
        try {
          const err = await res.json();
          msg = err?.detail || err?.message || msg;
        } catch {}
        throw new Error(msg);
      }
      const data = await res.json();
      setOrgs([...orgs, data]);
      setNewOrgName('');
      setShowModal(false);
    }).catch((e) => setError(e.message));
  };

  const openEdit = (org: any) => {
    setEditingOrgId(org.id);
    setEditOrgName(org.name || '');
    setShowEditModal(true);
  };

  const handleUpdateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrgId) return;
    if (!editOrgName.trim()) return;
    if (!token) {
      setError('Please log in to update an organization.');
      return;
    }
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';
    fetch(`${API_URL}/organizations/${editingOrgId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ name: editOrgName }),
    }).then(async (res) => {
      if (!res.ok) {
        let msg = 'Failed to update organization';
        try {
          const err = await res.json();
          msg = err?.detail || err?.message || msg;
        } catch {}
        throw new Error(msg);
      }
      const updated = await res.json();
      setOrgs(orgs.map(o => o.id === updated.id ? updated : o));
      setShowEditModal(false);
      setEditingOrgId(null);
      setEditOrgName('');
    }).catch((e) => setError(e.message));
  };

  const handleDeleteOrg = (orgId: string) => {
    if (!token) {
      setError('Please log in to delete an organization.');
      return;
    }
    if (!confirm('Are you sure you want to delete this organization?')) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';
    fetch(`${API_URL}/organizations/${orgId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }).then(async (res) => {
      if (!res.ok && res.status !== 204) {
        let msg = 'Failed to delete organization';
        try {
          const err = await res.json();
          msg = err?.detail || err?.message || msg;
        } catch {}
        throw new Error(msg);
      }
      setOrgs(orgs.filter(o => o.id !== orgId));
    }).catch((e) => setError(e.message));
  };

  if (loading) return <Loader />;
  if (error) return <Toast message={error} type="error" onClose={() => setError(null)} />;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Organizations</h1>
      <button onClick={() => setShowModal(true)} disabled={!token || authLoading} className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">+ New Organization</button>

      <ul className="divide-y divide-gray-200 bg-white rounded-lg shadow">
        {orgs.map(org => (
          <li key={org.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">{org.name}</div>
              <div className="text-xs text-gray-400">Created: {new Date(org.created_at).toLocaleDateString()}</div>
            </div>
            <div className="mt-2 sm:mt-0 flex gap-2">
              <button
                onClick={() => openEdit(org)}
                disabled={!token || authLoading}
                className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteOrg(org.id)}
                disabled={!token || authLoading}
                className="px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      {!orgs.length && <div className="text-gray-500 text-center py-8">No organizations found.</div>}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Organization">
        <form onSubmit={handleCreateOrg} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Organization Name</label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              value={newOrgName}
              onChange={e => setNewOrgName(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Create</button>
        </form>
      </Modal>
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Organization">
        <form onSubmit={handleUpdateOrg} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Organization Name</label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              value={editOrgName}
              onChange={e => setEditOrgName(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Save</button>
        </form>
      </Modal>
    </div>
  );
}
 