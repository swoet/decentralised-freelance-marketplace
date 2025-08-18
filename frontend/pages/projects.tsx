import { useState } from 'react';
import ProjectList from '../components/ProjectList';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import { useProjects } from '../hooks/useProjects';

export default function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const pageSize = 9;
  const { projects, loading, error, total } = useProjects(page, pageSize);

  // TODO: Implement search/filter logic (API or client-side)
  const filteredProjects = search
    ? projects.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    : projects;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Projects</h1>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <input
          type="text"
          className="border border-gray-300 rounded px-3 py-2 w-full sm:w-64"
          placeholder="Search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {loading && <Loader />}
      {error && <Toast message={error} type="error" onClose={() => setPage(page)} />}
      <ProjectList projects={filteredProjects || []} />
      <Pagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} />
    </div>
  );
} 