import { useEffect, useState } from 'react';
import Loader from '../components/Loader';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const load = async () => {
      try {
        const [usersRes, projectsRes, bidsRes] = await Promise.all([
          fetch(`${API_URL}/users/`).catch(() => null),
          fetch(`${API_URL}/projects/`).catch(() => null),
          fetch(`${API_URL}/bids/`).catch(() => null),
        ]);
        const usersJson = usersRes && usersRes.ok ? await usersRes.json() : [];
        const projectsJson = projectsRes && projectsRes.ok ? await projectsRes.json() : [];
        const bidsJson = bidsRes && bidsRes.ok ? await bidsRes.json() : [];
        setUsers(Array.isArray(usersJson) ? usersJson : []);
        setProjects(Array.isArray(projectsJson) ? projectsJson : []);
        setStats({
          projects: Array.isArray(projectsJson) ? projectsJson.length : 0,
          users: Array.isArray(usersJson) ? usersJson.length : 0,
          bids: Array.isArray(bidsJson) ? bidsJson.length : 0,
          disputes: 0,
        });
        // naive admin check: if any user has role admin
        setIsAdmin((Array.isArray(usersJson) ? usersJson : []).some((u: any) => (u.role || '').toLowerCase() === 'admin'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loader />;
  if (!isAdmin) return <div className="text-center py-8 text-gray-500">Access denied.</div>;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{stats.projects}</div>
          <div className="text-gray-600">Projects</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{stats.users}</div>
          <div className="text-gray-600">Users</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-700">{stats.bids}</div>
          <div className="text-gray-600">Bids</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-700">{stats.disputes}</div>
          <div className="text-gray-600">Disputes</div>
        </div>
      </div>
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2 text-gray-700">Recent Users</h2>
        <table className="w-full bg-white rounded-lg shadow text-left">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b last:border-0">
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2 capitalize">{user.role}</td>
                <td className="px-4 py-2">{user.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2 text-gray-700">Recent Projects</h2>
        <table className="w-full bg-white rounded-lg shadow text-left">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(project => (
              <tr key={project.id} className="border-b last:border-0">
                <td className="px-4 py-2">{project.title}</td>
                <td className="px-4 py-2 capitalize">{project.status}</td>
                <td className="px-4 py-2">{project.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 