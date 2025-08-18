import { useEffect, useState } from 'react';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import Modal from '../components/Modal';

export default function OrgsPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    fetch(`${API_URL}/organizations/`).then(async (res) => {
      if (!res.ok) throw new Error('Failed to load organizations');
      const data = await res.json();
      setOrgs(Array.isArray(data) ? data : []);
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    fetch(`${API_URL}/organizations/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newOrgName, owner_id: null }),
    }).then(async (res) => {
      if (!res.ok) throw new Error('Failed to create organization');
      const data = await res.json();
      setOrgs([...orgs, data]);
      setNewOrgName('');
      setShowModal(false);
    }).catch((e) => setError(e.message));
  };

  if (loading) return <Loader />;
  if (error) return <Toast message={error} type="error" onClose={() => setError(null)} />;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Organizations</h1>
      <button onClick={() => setShowModal(true)} className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ New Organization</button>
      <ul className="divide-y divide-gray-200 bg-white rounded-lg shadow">
        {orgs.map(org => (
          <li key={org.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">{org.name}</div>
              <div className="text-xs text-gray-400">Created: {new Date(org.created_at).toLocaleDateString()}</div>
            </div>
            {/* TODO: Add actions (edit, delete, manage members) */}
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
    </div>
  );
} 