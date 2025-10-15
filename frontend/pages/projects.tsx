import { useState } from 'react';
import ProjectList from '../components/ProjectList';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import EnhancedProjectSearch from '../components/EnhancedProjectSearch';
import { useProjects } from '../hooks/useProjects';

interface SearchFilters {
  category: string;
  budgetMin: number;
  budgetMax: number;
  location: string;
  urgency: string;
  skills: string[];
  experienceLevel: string;
}

export default function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    category: '',
    budgetMin: 0,
    budgetMax: 10000,
    location: '',
    urgency: '',
    skills: [],
    experienceLevel: ''
  });
  const pageSize = 9;
  const { projects, loading, error, total } = useProjects(page, pageSize);

  // Enhanced search/filter logic with AI support
  const filteredProjects = projects.filter(project => {
    // Text search
    const matchesSearch = !search || 
      project.title.toLowerCase().includes(search.toLowerCase()) ||
      project.description?.toLowerCase().includes(search.toLowerCase());
    
    // Budget filter
    const matchesBudget = (!filters.budgetMin || project.budget_min >= filters.budgetMin) &&
      (!filters.budgetMax || project.budget_max <= filters.budgetMax);
    
    // Skills filter
    const matchesSkills = filters.skills.length === 0 || 
      filters.skills.some(skill => 
        project.required_skills?.some(projectSkill => 
          projectSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
    
    return matchesSearch && matchesBudget && matchesSkills;
  });

  const handleSearch = (query: string, searchFilters: SearchFilters) => {
    setSearch(query);
    setFilters(searchFilters);
    setPage(1); // Reset to first page when searching
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto py-8 px-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Discover <span className="text-blue-600">Amazing</span> Projects
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Find the perfect project with AI-powered search and smart filtering
            </p>
            
            {/* Enhanced Search Component */}
            <EnhancedProjectSearch 
              onSearch={handleSearch}
              placeholder="Search projects with AI assistance..."
            />
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-6xl mx-auto py-8 px-6">
        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {search || filters.skills.length > 0 ? 
                `Search Results (${filteredProjects.length} found)` : 
                `All Projects (${projects.length} available)`
              }
            </h2>
            {search && (
              <p className="text-gray-600 mt-1">
                Showing results for "<span className="font-medium">{search}</span>"
              </p>
            )}
          </div>
          
          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
              <option>Most Recent</option>
              <option>Budget: High to Low</option>
              <option>Budget: Low to High</option>
              <option>Deadline</option>
            </select>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && <Loader />}
        {error && <Toast message={error} type="error" onClose={() => setPage(page)} />}
        
        {/* Results */}
        {!loading && filteredProjects.length === 0 && (search || filters.skills.length > 0) && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria or browse all projects</p>
            <button 
              onClick={() => { setSearch(''); setFilters({ category: '', budgetMin: 0, budgetMax: 10000, location: '', urgency: '', skills: [], experienceLevel: '' }); }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Search
            </button>
          </div>
        )}
        
        {!loading && filteredProjects.length > 0 && (
          <>
            <ProjectList projects={filteredProjects} />
            <div className="mt-8">
              <Pagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
} 