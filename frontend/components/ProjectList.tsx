import { Project } from '../types';
import ProjectCard from './ProjectCard';

export default function ProjectList({ projects }: { projects: Project[] }) {
  if (!projects.length) {
    return <div className="text-gray-500 text-center py-8">No projects found.</div>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
} 