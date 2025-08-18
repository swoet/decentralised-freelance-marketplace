import Link from 'next/link';
import { Project } from '../types';

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-col justify-between h-full">
      <div>
        <h2 className="text-xl font-semibold text-blue-700 mb-2 truncate">{project.title}</h2>
        <p className="text-gray-600 mb-2 line-clamp-2">{project.description}</p>
        <div className="text-sm text-gray-500 mb-2">
          Budget: <span className="font-medium text-green-700">${project.budget_min} - ${project.budget_max}</span>
        </div>
      </div>
      <Link href={`/projects/${project.id}`} className="mt-2 inline-block text-blue-600 hover:underline font-medium">View Details &rarr;</Link>
    </div>
  );
} 