import Link from 'next/link';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Loader from '@/components/Loader';

export default function MessagesIndex() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    fetch(`${API_URL}/projects/?limit=50`).then(async (res) => {
      if (!res.ok) throw new Error('Failed to load projects');
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : (data.items || []));
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Messages</h1>
        {loading && <Loader />}
        {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
        {!loading && !projects.length && (
          <div className="text-gray-500">No projects yet.</div>
        )}
        <ul className="divide-y divide-gray-200 bg-white rounded-lg shadow">
          {projects.map((p) => (
            <li key={p.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-800">{p.title || ''}</div>
                <div className="text-sm text-gray-500">Project ID: {p.id}</div>
              </div>
              <Link href={`/messages/${p.id}`} className="text-blue-600 hover:underline">Open Chat</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


