import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminLayout from '../components/AdminLayout';
import { useAdminAuth } from '../context/AdminAuthContext';

interface Project {
  id: string;
  title: string;
  client: string;
  status: string;
  budget: number;
  created_at: string;
}

export default function ProjectsPage() {
  const { admin, token, isLoading } = useAdminAuth();
  const router = useRouter();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !admin) {
      router.push('/login');
      return;
    }
    
    if (admin && token) {
      // Mock data for now - replace with actual API call
      setProjects([
        { id: '1', title: 'E-commerce Website Development', client: 'John Doe', status: 'active', budget: 5000, created_at: '2025-01-15' },
        { id: '2', title: 'Mobile App UI/UX Design', client: 'Jane Smith', status: 'active', budget: 3500, created_at: '2025-01-20' },
        { id: '3', title: 'Logo Design for Startup', client: 'Bob Johnson', status: 'completed', budget: 800, created_at: '2025-01-10' }
      ]);
      setLoading(false);
    }
  }, [admin, token, isLoading, router]);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      active: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return badges[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

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
    <AdminLayout title="Projects">
      <Head>
        <title>Projects - Admin Dashboard</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage all platform projects</p>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
            <p className="text-sm font-medium text-blue-600">Total Projects</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">{projects.length}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
            <p className="text-sm font-medium text-green-600">Active</p>
            <p className="text-3xl font-bold text-green-900 mt-2">
              {projects.filter(p => p.status === 'active').length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
            <p className="text-sm font-medium text-purple-600">Completed</p>
            <p className="text-3xl font-bold text-purple-900 mt-2">
              {projects.filter(p => p.status === 'completed').length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6">
            <p className="text-sm font-medium text-yellow-600">Total Value</p>
            <p className="text-3xl font-bold text-yellow-900 mt-2">
              ${projects.reduce((sum, p) => sum + p.budget, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">All Projects</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{project.title}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{project.client}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(project.status)}`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        ${project.budget.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(project.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900">View Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
