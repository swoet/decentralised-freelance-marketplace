import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import MilestoneList from '../../components/MilestoneList';
import BidForm from '../../components/BidForm';
import ChatBox from '../../components/ChatBox';
import Loader from '../../components/Loader';
import Toast from '../../components/Toast';
import { Project } from '../../types';

export default function ProjectDetailPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [smartMatches, setSmartMatches] = useState<any[] | null>(null);
  const [matchesLoading, setMatchesLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const load = async () => {
      try {
        setLoading(true);
        const [projectsRes, bidsRes] = await Promise.all([
          fetch(`${API_URL}/projects/?limit=100`).catch(() => null),
          fetch(`${API_URL}/bids/?project_id=${id}`).catch(() => null),
        ]);
        const projects = projectsRes && projectsRes.ok ? await projectsRes.json() : [];
        const projectItem = Array.isArray(projects) ? projects.find((p: any) => String(p.id) === String(id)) : null;
        setProject(projectItem || null);
        const bidsJson = bidsRes && bidsRes.ok ? await bidsRes.json() : [];
        setBids(Array.isArray(bidsJson) ? bidsJson : []);
        setMilestones([]);
      } catch (e: any) {
        setError(e?.message || 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };
    load();

    // Load AI Smart Matches (client-only)
    const loadMatches = async () => {
      try {
        setMatchesLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        const res = await fetch(`${API_URL}/ai/matching/project/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        setSmartMatches(Array.isArray(data?.matches) ? data.matches : []);
      } catch (_) {
        setSmartMatches([]);
      } finally {
        setMatchesLoading(false);
      }
    };
    loadMatches();
  }, [id]);

  const handleBidSubmit = async (data: any) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const res = await fetch(`${API_URL}/bids/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, project_id: id }),
      });
      const created = res.ok ? await res.json() : null;
      setBids([...bids, created || { ...data, id: Date.now().toString() }]);
    } catch (_) {
      setBids([...bids, { ...data, id: Date.now().toString(), status: 'pending' }]);
    }
  };

  if (loading) return <Loader />;
  if (error) return <Toast message={error} type="error" onClose={() => setError(null)} />;
  if (!project) return <div className="text-center py-8 text-gray-500">Project not found.</div>;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2 text-gray-800">{project.title}</h1>
      <div className="mb-4 text-gray-600">{project.description}</div>
      <div className="mb-4 text-sm text-gray-500">Budget: <span className="text-green-700 font-semibold">${project.budget_min} - ${project.budget_max}</span></div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2 text-gray-700">Milestones</h2>
        <MilestoneList milestones={milestones} />
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2 text-gray-700">Bids</h2>
        <ul className="divide-y divide-gray-200 bg-white rounded-lg shadow">
          {bids.map(bid => (
            <li key={bid.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between">
              <div>
                <div className="font-medium text-gray-800">${bid.amount}</div>
                <div className="text-sm text-gray-500">{bid.cover_letter}</div>
              </div>
              <div className="mt-2 sm:mt-0">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">{bid.status}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2 text-gray-700">AI Smart Matches</h2>
        <div className="bg-white rounded-lg shadow p-4">
          {matchesLoading ? (
            <div className="text-sm text-gray-500">Loading matches...</div>
          ) : smartMatches && smartMatches.length ? (
            <ul className="divide-y divide-gray-200">
              {smartMatches.map((m: any) => (
                <li key={m.freelancer_id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{m.freelancer?.full_name || 'Freelancer'}</div>
                      <div className="text-sm text-gray-600">Compatibility: <span className="font-semibold">{Math.round(m.compatibility_score)}%</span></div>
                      <div className="text-xs text-gray-500">Skill match {Math.round(m.skill_match)}% · Personality {Math.round(m.personality_match)}% · Risk {Math.round(m.risk_score)}%</div>
                      {Array.isArray(m.match_reasons) && m.match_reasons.length > 0 && (
                        <div className="mt-1 text-xs text-gray-500">Reasons: {m.match_reasons.join(', ')}</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">Invite</button>
                      <button className="px-3 py-1 text-sm rounded border">View Profile</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500">No matches available yet.</div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2 text-gray-700">Submit a Bid</h2>
        <BidForm onSubmit={handleBidSubmit} />
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2 text-gray-700">Project Chat</h2>
        <ChatBox projectId={project.id} userId="me" />
      </div>
    </div>
  );
} 