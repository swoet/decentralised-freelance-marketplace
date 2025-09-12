import { useEffect, useMemo, useRef, useState } from "react";
import type { NextPage } from "next";
import { useAuth } from "../../context/AuthContext";
import { ProjectMatches } from "../../components/ai-matching";

// Freelancer Dashboard - self-contained, responsive, customizable via localStorage
// Features:
// - Widgets: Active Projects, Milestones, Earnings, Messages, Alerts, Reputation
// - Drag-and-drop reordering with persistence
// - Show/Hide widgets via settings panel with persistence
// - Responsive CSS grid (1-4 columns)

interface WidgetDef {
  id: string;
  title: string;
  defaultVisible?: boolean;
  render: () => JSX.Element;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Match feed widget using the new /api/v1/matching/feed endpoint
const MatchFeed: React.FC = () => {
  const [items, setItems] = useState<{ project_id: number; title: string; score: number; reasons?: string[]; }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, user, loading: authLoading } = useAuth();

  useEffect(() => {
    const run = async () => {
      console.log('MatchFeed debug - authLoading:', authLoading, 'token:', token, 'user:', user);
      
      // Wait for auth to finish loading
      if (authLoading) {
        console.log('MatchFeed: Auth still loading, waiting...');
        return;
      }
      
      // If no valid token or user, don't try to fetch personalized data
      if (!token || !user || token.trim() === '') {
        console.log('MatchFeed: No valid token or user, skipping API call');
        setLoading(false);
        return;
      }
      
      console.log('MatchFeed: Making API call with token');
      setLoading(true);

      try {
        const headers: Record<string, string> = {};
        headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE}/matching/feed`, { headers });
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Please log in to see personalized matches');
          }
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token, user, authLoading]);

  // Show loading while auth is loading or while data is loading
  if (authLoading || loading) return <div>Loading...</div>;
  
  // Show sign-in prompt if no valid authentication
  if (!token || !user || token.trim() === '') {
    return (
      <div className="text-center p-4">
        <p className="text-gray-600 mb-3">Sign in to see personalized project matches</p>
        <a href="/login" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Sign In
        </a>
      </div>
    );
  }
  
  if (error) return <div className="text-red-600">Failed to load: {error}</div>;
  if (!items.length) return <div>No matches yet. Verify your skills to improve recommendations.</div>;

  return (
    <ul>
      {items.map((it) => (
        <li key={it.project_id} style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 600 }}>{it.title}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Score: {(it.score * 100).toFixed(0)}%</div>
          {it.reasons?.length ? (
            <div style={{ fontSize: 12, color: '#6b7280' }}>Reasons: {it.reasons.join(', ')}</div>
          ) : null}
        </li>
      ))}
    </ul>
  );
};

// AI Projects widget wrapper
const AIProjectsWidget: React.FC = () => {
  const { user, token, loading: authLoading } = useAuth();
  
  // Don't render anything while auth is loading
  if (authLoading) {
    return <div>Loading...</div>;
  }
  
  if (!user?.id || !token || token.trim() === '') {
    return (
      <div className="text-center p-4">
        <p className="text-gray-600 mb-3">Sign in to see AI-powered project recommendations</p>
        <a href="/login" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Sign In
        </a>
      </div>
    );
  }
  
  return <ProjectMatches freelancerId={user.id} limit={5} className="" />;
};

const defaultWidgets: WidgetDef[] = [
  {
    id: "match-feed",
    title: "Recommended Projects",
    defaultVisible: true,
    render: () => <MatchFeed />,
  },
  {
    id: "ai-projects",
    title: "AI-Powered Project Matches",
    defaultVisible: true,
    render: () => <AIProjectsWidget />,
  },
];

const LAYOUT_KEY = "freelancerDashboardLayout";
const VISIBILITY_KEY = "freelancerDashboardVisibility";

const FreelancerDashboard: NextPage = () => {
  const { user } = useAuth();
  const [order, setOrder] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dragSrcId = useRef<string | null>(null);

  const widgetMap = useMemo(() => {
    const map: Record<string, WidgetDef> = {};
    defaultWidgets.forEach((w) => (map[w.id] = w));
    return map;
  }, []);

  // Initialize from localStorage (client-side only)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedOrder = JSON.parse(localStorage.getItem(LAYOUT_KEY) || "null");
      const savedVisibility = JSON.parse(localStorage.getItem(VISIBILITY_KEY) || "null");

      const initialOrder = Array.isArray(savedOrder)
        ? savedOrder.filter((id) => widgetMap[id])
        : defaultWidgets.map((w) => w.id);

      const initialVisibility: Record<string, boolean> = {};
      defaultWidgets.forEach((w) => {
        initialVisibility[w.id] = w.defaultVisible !== false;
      });
      if (savedVisibility && typeof savedVisibility === "object") {
        Object.keys(savedVisibility).forEach((k) => {
          if (widgetMap[k]) initialVisibility[k] = !!savedVisibility[k];
        });
      }

      setOrder(initialOrder);
      setVisibility(initialVisibility);
    } catch (e) {
      // fallback to defaults
      setOrder(defaultWidgets.map((w) => w.id));
      const vis: Record<string, boolean> = {};
      defaultWidgets.forEach((w) => (vis[w.id] = w.defaultVisible !== false));
      setVisibility(vis);
    }
  }, [widgetMap]);

  // Persist on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (order.length) localStorage.setItem(LAYOUT_KEY, JSON.stringify(order));
    if (Object.keys(visibility).length)
      localStorage.setItem(VISIBILITY_KEY, JSON.stringify(visibility));
  }, [order, visibility]);

  const onDragStart = (id: string) => (e: React.DragEvent<HTMLDivElement>) => {
    dragSrcId.current = id;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (targetId: string) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const src = dragSrcId.current || e.dataTransfer.getData("text/plain");
    if (!src || src === targetId) return;
    setOrder((prev) => {
      const srcIdx = prev.indexOf(src);
      const tgtIdx = prev.indexOf(targetId);
      if (srcIdx === -1 || tgtIdx === -1) return prev;
      const copy = [...prev];
      copy.splice(srcIdx, 1);
      copy.splice(tgtIdx, 0, src);
      return copy;
    });
  };

  const toggleVisibility = (id: string) => {
    setVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const resetLayout = () => {
    setOrder(defaultWidgets.map((w) => w.id));
    const vis: Record<string, boolean> = {};
    defaultWidgets.forEach((w) => (vis[w.id] = w.defaultVisible !== false));
    setVisibility(vis);
  };

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>{user ? 'Freelancer Dashboard' : 'Freelancer Dashboard Preview'}</h1>
          {!user && (
            <p className="subtitle">Experience what our freelancers see. <a href="/signup" className="signup-link">Join now</a> to get started!</p>
          )}
        </div>
        <div className="actions">
          {user ? (
            <>
              <button className="btn" onClick={() => setSettingsOpen(true)}>Customize</button>
              <button className="btn" onClick={resetLayout}>Reset</button>
            </>
          ) : (
            <>
              <a href="/login" className="btn">Sign In</a>
              <a href="/signup" className="btn primary">Sign Up</a>
            </>
          )}
        </div>
      </header>

      <section className="grid">
        {order
          .filter((id) => visibility[id])
          .map((id) => {
            const w = widgetMap[id];
            if (!w) return null;
            return (
              <div
                key={w.id}
                className="card"
                draggable
                onDragStart={onDragStart(w.id)}
                onDragOver={onDragOver}
                onDrop={onDrop(w.id)}
                title="Drag to rearrange"
              >
                <div className="card-title">{w.title}</div>
                <div className="card-body">{w.render()}</div>
              </div>
            );
          })}
      </section>

      {settingsOpen && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Customize Dashboard</h2>
              <button className="icon" onClick={() => setSettingsOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="modal-body">
              <ul className="list">
                {defaultWidgets.map((w) => (
                  <li key={w.id} className="list-item">
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={!!visibility[w.id]}
                        onChange={() => toggleVisibility(w.id)}
                      />
                      <span>{w.title}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="hint">Tip: Drag and drop cards on the dashboard to reorder them.</p>
            </div>
            <div className="modal-footer">
              <button className="btn primary" onClick={() => setSettingsOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .page {
          padding: 16px;
        }
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }
        .topbar h1 { margin: 0; font-size: 22px; }
        .subtitle { margin: 4px 0 0 0; font-size: 14px; color: #6b7280; }
        .signup-link { color: #2563eb; text-decoration: none; font-weight: 500; }
        .signup-link:hover { text-decoration: underline; }
        .actions { display: flex; gap: 8px; }
        .btn {
          padding: 8px 12px;
          border: 1px solid #d0d5dd;
          background: #fff;
          border-radius: 8px;
          cursor: pointer;
        }
        .btn:hover { background: #f9fafb; }
        .btn.primary { background: #2563eb; color: white; border-color: #2563eb; }
        .btn.primary:hover { background: #1d4ed8; }

        .grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 640px) {
          .grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1440px) {
          .grid { grid-template-columns: repeat(4, 1fr); }
        }

        .card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
          padding: 12px;
          user-select: none;
        }
        .card-title {
          font-weight: 600;
          margin-bottom: 8px;
        }
        .card-body { color: #374151; }

        .modal {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .modal-content {
          width: 100%;
          max-width: 560px;
          background: #fff;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }
        .modal-header, .modal-footer {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f1f5f9;
        }
        .modal-footer { border-top: 1px solid #f1f5f9; border-bottom: none; }
        .modal-body { padding: 12px 16px; }
        .icon { background: transparent; border: none; font-size: 20px; cursor: pointer; }
        .list { list-style: none; padding: 0; margin: 0; }
        .list-item { padding: 8px 0; display: flex; justify-content: space-between; }
        .toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .hint { color: #6b7280; font-size: 12px; margin-top: 8px; }
      `}</style>
    </div>
  );
};

export default FreelancerDashboard;
