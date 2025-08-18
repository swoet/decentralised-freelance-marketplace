import { useEffect, useState } from 'react';
import Loader from '../components/Loader';
import Toast from '../components/Toast';

export default function BidsPage() {
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    fetch(`${API_URL}/bids/`).then(async (res) => {
      if (!res.ok) throw new Error('Failed to load bids');
      const data = await res.json();
      setBids(Array.isArray(data) ? data : []);
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (error) return <Toast message={error} type="error" onClose={() => setError(null)} />;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">My Bids</h1>
      <ul className="divide-y divide-gray-200 bg-white rounded-lg shadow">
        {bids.map(bid => (
          <li key={bid.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">{bid.project_title}</div>
              <div className="text-sm text-gray-500">Bid: <span className="text-green-700 font-semibold">${bid.amount}</span></div>
            </div>
            <div className="mt-2 sm:mt-0 flex flex-col items-end">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold mb-1">{bid.status}</span>
              <span className="text-xs text-gray-400">{new Date(bid.created_at).toLocaleDateString()}</span>
            </div>
          </li>
        ))}
      </ul>
      {!bids.length && <div className="text-gray-500 text-center py-8">No bids found.</div>}
    </div>
  );
} 