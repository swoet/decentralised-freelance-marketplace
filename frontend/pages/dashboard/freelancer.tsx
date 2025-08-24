import { useEffect, useMemo, useRef, useState } from "react";
import type { NextPage } from "next";

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

const defaultWidgets: WidgetDef[] = [
  {
    id: "active-projects",
    title: "Active Projects",
    defaultVisible: true,
    render: () => (
      <ul>
        <li>Project A — 60% complete</li>
        <li>Project B — 25% complete</li>
        <li>Project C — Awaiting client feedback</li>
      </ul>
    ),
  },
  {
    id: "milestones",
    title: "Milestones",
    defaultVisible: true,
    render: () => (
      <ul>
        <li>Project A — Milestone 2 due in 3 days</li>
        <li>Project B — Milestone 1 payment pending</li>
      </ul>
    ),
  },
  {
    id: "earnings",
    title: "Earnings",
    defaultVisible: true,
    render: () => (
      <div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>$12,840</div>
        <div>Total earned this quarter</div>
      </div>
    ),
  },
  {
    id: "messages",
    title: "Messages",
    defaultVisible: true,
    render: () => (
      <ul>
        <li>Client X: "Can we adjust the timeline?"</li>
        <li>Client Y: "Draft looks great — sent comments."</li>
      </ul>
    ),
  },
  {
    id: "alerts",
    title: "Alerts",
    defaultVisible: true,
    render: () => (
      <ul>
        <li>Security: Enable 2FA for enhanced protection</li>
        <li>Profile: Verify skills to improve matching</li>
      </ul>
    ),
  },
  {
    id: "reputation",
    title: "Reputation",
    defaultVisible: true,
    render: () => (
      <div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>4.7 / 5.0</div>
        <div>Based on 28 reviews</div>
      </div>
    ),
  },
];

const LAYOUT_KEY = "freelancerDashboardLayout";
const VISIBILITY_KEY = "freelancerDashboardVisibility";

const FreelancerDashboard: NextPage = () => {
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
        <h1>Freelancer Dashboard</h1>
        <div className="actions">
          <button className="btn" onClick={() => setSettingsOpen(true)}>Customize</button>
          <button className="btn" onClick={resetLayout}>Reset</button>
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
