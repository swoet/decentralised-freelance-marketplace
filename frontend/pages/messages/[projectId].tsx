import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ChatBox from '../../components/ChatBox';
import Loader from '../../components/Loader';

export default function ProjectMessagesPage() {
  const router = useRouter();
  const { projectId } = router.query;
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    fetch(`${API_URL}/projects/?limit=100`).then(async (res) => {
      const data = res.ok ? await res.json() : [];
      const found = Array.isArray(data) ? data.find((p: any) => String(p.id) === String(projectId)) : null;
      setProject(found || { id: projectId, title: '' });
    }).finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <Loader />;
  if (!project) return <div className="text-center py-8 text-gray-500">Project not found.</div>;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Chat: {project.title}</h1>
      <ChatBox projectId={project.id} userId="me" />
    </div>
  );
} 