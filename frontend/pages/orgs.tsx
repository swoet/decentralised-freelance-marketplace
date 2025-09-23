import { useEffect, useState } from 'react';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Badge,
  StatusBadge,
  Motion,
  Stagger
} from '../components/artisan-craft';

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

  if (loading) return (
    <div className="min-h-screen bg-neutral-50 bg-craft-texture flex items-center justify-center">
      <Loader />
    </div>
  );
  if (error) return <Toast message={error} type="error" onClose={() => setError(null)} />;

  return (
    <>
      <Head>
        <title>Organizations - Artisan Marketplace</title>
        <meta name="description" content="Manage your organizations and collaborate with teams" />
        
        {/* Artisan Craft Fonts */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+Pro:wght@400;500&family=Crimson+Text:wght@400;600&display=swap" 
          rel="stylesheet"
        />
      </Head>
      
      <div className="min-h-screen bg-neutral-50 bg-craft-texture">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Motion preset="slideInDown" className="mb-8">
            <div className="text-center space-y-4">
              <h1 className="heading-craft text-4xl text-mahogany-800">Organizations</h1>
              <p className="body-craft text-lg text-copper-700">
                Build teams and collaborate on amazing projects together
              </p>
            </div>
          </Motion>
          
          <Motion preset="scaleIn" className="mb-8 text-center">
            <Button 
              onClick={() => setShowModal(true)} 
              disabled={!token || authLoading} 
              variant="primary" 
              size="lg" 
              shape="wax"
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            >
              Create New Organization
            </Button>
          </Motion>

          {orgs.length > 0 ? (
            <Stagger staggerDelay={100} className="space-y-6">
              {orgs.map((org, index) => (
                <Motion key={org.id} preset="slideInUp" transition={{ delay: index * 100 }}>
                  <Card variant="leather" interactive="hover" className="group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-forest-100 rounded-organic-craft">
                              <svg className="w-5 h-5 text-forest-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                              </svg>
                            </div>
                            <h3 className="heading-craft text-xl font-semibold text-mahogany-800 group-hover:text-copper-600 transition-colors">
                              {org.name}
                            </h3>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-bronze-600">
                            <span className="flex items-center gap-1">
                              📅 Created: {new Date(org.created_at).toLocaleDateString()}
                            </span>
                            <Badge variant="neutral" size="xs">
                              {org.id}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-6">
                          <Button
                            onClick={() => openEdit(org)}
                            disabled={!token || authLoading}
                            variant="ghost"
                            size="sm"
                            shape="rounded"
                            leftIcon={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteOrg(org.id)}
                            disabled={!token || authLoading}
                            variant="danger"
                            size="sm"
                            shape="rounded"
                            leftIcon={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Motion>
              ))}
            </Stagger>
          ) : (
            <Motion preset="fadeIn" className="text-center py-16">
              <Card variant="parchment" className="max-w-md mx-auto">
                <CardContent className="p-8">
                  <div className="text-6xl opacity-30 mb-4">🏢</div>
                  <h3 className="heading-craft text-xl text-mahogany-800 mb-2">No Organizations Yet</h3>
                  <p className="body-craft text-copper-700 mb-6">
                    Create your first organization to start collaborating with teams and managing projects together.
                  </p>
                  <Button 
                    onClick={() => setShowModal(true)} 
                    disabled={!token || authLoading} 
                    variant="accent" 
                    size="md" 
                    shape="wax"
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </Motion>
          )}
          <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Organization">
            <form onSubmit={handleCreateOrg} className="space-y-6">
              <div>
                <label className="block body-craft text-sm font-medium text-mahogany-800 mb-2">
                  Organization Name
                </label>
                <Input
                  type="text"
                  variant="default"
                  placeholder="Enter organization name..."
                  value={newOrgName}
                  onChange={e => setNewOrgName(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                variant="primary" 
                size="lg" 
                shape="wax" 
                className="w-full"
              >
                Create Organization
              </Button>
            </form>
          </Modal>
          
          <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Organization">
            <form onSubmit={handleUpdateOrg} className="space-y-6">
              <div>
                <label className="block body-craft text-sm font-medium text-mahogany-800 mb-2">
                  Organization Name
                </label>
                <Input
                  type="text"
                  variant="default"
                  placeholder="Enter organization name..."
                  value={editOrgName}
                  onChange={e => setEditOrgName(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                variant="accent" 
                size="lg" 
                shape="wax" 
                className="w-full"
              >
                Save Changes
              </Button>
            </form>
          </Modal>
        </div>
      </div>
    </>
  );
}
 