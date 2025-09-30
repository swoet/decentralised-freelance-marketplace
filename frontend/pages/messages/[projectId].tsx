import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ProjectChat from '../../components/ProjectChat';
import Loader from '../../components/Loader';
import Navbar from '../../components/Navbar';

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
      setProject(found || { id: projectId, title: 'Project Chat' });
    }).finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <Loader />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-8 text-gray-500">Project not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <button 
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Project Chat</h1>
          <p className="text-gray-600 mt-2">{project.title}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow">
          <ProjectChat 
            projectId={String(project.id)} 
            projectTitle={project.title}
          />
        </div>
      </div>
    </div>
  );
} 