import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

interface SearchSuggestion {
  id: string;
  type: 'project' | 'skill' | 'category' | 'location';
  text: string;
  metadata?: {
    budget?: string;
    location?: string;
    urgency?: string;
  };
}

interface SearchFilters {
  category: string;
  budgetMin: number;
  budgetMax: number;
  location: string;
  urgency: string;
  skills: string[];
  experienceLevel: string;
}

interface Props {
  onSearch: (query: string, filters: SearchFilters) => void;
  placeholder?: string;
  showFilters?: boolean;
}

export default function EnhancedProjectSearch({ 
  onSearch, 
  placeholder = "Search projects with AI assistance...",
  showFilters = true 
}: Props) {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilterPanel] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<SearchFilters>({
    category: '',
    budgetMin: 0,
    budgetMax: 10000,
    location: '',
    urgency: '',
    skills: [],
    experienceLevel: ''
  });

  // Sample categories and skills for suggestions
  const categories = [
    'Web Development', 'Mobile Development', 'UI/UX Design', 'Data Science',
    'Machine Learning', 'Blockchain', 'Digital Marketing', 'Content Writing',
    'Graphic Design', 'Video Editing', 'SEO', 'Social Media Management'
  ];

  const popularSkills = [
    'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'PHP', 'Java',
    'Swift', 'Kotlin', 'Flutter', 'React Native', 'Vue.js', 'Angular',
    'Machine Learning', 'AI', 'Blockchain', 'Solidity', 'Smart Contracts',
    'AWS', 'Google Cloud', 'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB'
  ];

  // Fetch AI-powered search suggestions
  const fetchSuggestions = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      
      // Try to get AI suggestions from backend
      if (token) {
        const response = await fetch(`${API_URL}/search/suggestions?q=${encodeURIComponent(searchQuery)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          setLoading(false);
          return;
        }
      }

      // Fallback to client-side suggestions
      const mockSuggestions: SearchSuggestion[] = [];

      // Category matches
      categories.forEach(category => {
        if (category.toLowerCase().includes(searchQuery.toLowerCase())) {
          mockSuggestions.push({
            id: `cat-${category}`,
            type: 'category',
            text: category,
            metadata: { budget: '$1K-$5K' }
          });
        }
      });

      // Skill matches
      popularSkills.forEach(skill => {
        if (skill.toLowerCase().includes(searchQuery.toLowerCase())) {
          mockSuggestions.push({
            id: `skill-${skill}`,
            type: 'skill',
            text: `Projects requiring ${skill}`,
            metadata: { urgency: 'High demand' }
          });
        }
      });

      // Project type suggestions
      const projectSuggestions = [
        { text: `${searchQuery} mobile app development`, type: 'project' as const },
        { text: `${searchQuery} web application`, type: 'project' as const },
        { text: `${searchQuery} API integration`, type: 'project' as const },
        { text: `${searchQuery} UI/UX design`, type: 'project' as const }
      ];

      projectSuggestions.forEach((suggestion, index) => {
        if (mockSuggestions.length < 8) {
          mockSuggestions.push({
            id: `proj-${index}`,
            type: suggestion.type,
            text: suggestion.text,
            metadata: { budget: '$2K-$8K', location: 'Remote' }
          });
        }
      });

      setSuggestions(mockSuggestions.slice(0, 8));
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get AI recommendations based on user profile
  const fetchAiRecommendations = async () => {
    if (!token) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(`${API_URL}/ai/recommendations/search`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAiRecommendations(data.recommendations || []);
      } else {
        // Fallback recommendations
        setAiRecommendations([
          'React development projects',
          'Machine learning consulting',
          'Blockchain smart contracts',
          'UI/UX mobile apps'
        ]);
      }
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      setAiRecommendations([
        'Full-stack development',
        'API integrations',
        'Database optimization',
        'Cloud deployment'
      ]);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  useEffect(() => {
    fetchAiRecommendations();
  }, [token]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    onSearch(query, filters);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    onSearch(suggestion.text, filters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const addSkillFilter = (skill: string) => {
    if (!filters.skills.includes(skill)) {
      const newFilters = { ...filters, skills: [...filters.skills, skill] };
      setFilters(newFilters);
      onSearch(query, newFilters);
    }
  };

  const removeSkillFilter = (skillToRemove: string) => {
    const newFilters = { ...filters, skills: filters.skills.filter(skill => skill !== skillToRemove) };
    setFilters(newFilters);
    onSearch(query, newFilters);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'category':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'skill':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'location':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* AI Recommendations */}
      {aiRecommendations.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">🤖 AI Recommendations for you:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {aiRecommendations.slice(0, 4).map((rec, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(rec);
                  onSearch(rec, filters);
                }}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition-colors"
              >
                {rec}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Search Bar */}
      <div className="relative">
        <div className="flex items-center bg-white rounded-xl shadow-lg border-2 border-gray-100 focus-within:border-blue-500 transition-colors">
          <div className="pl-4">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="flex-1 px-4 py-4 text-lg focus:outline-none bg-transparent"
          />
          {loading && (
            <div className="px-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-6 py-4 rounded-r-xl hover:bg-blue-700 transition-colors font-semibold"
          >
            Search
          </button>
          {showFilters && (
            <button
              onClick={() => setShowFilterPanel(!showFilters)}
              className="border-l border-gray-200 px-4 py-4 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
            </button>
          )}
        </div>

        {/* Search Suggestions */}
        {showSuggestions && (suggestions.length > 0 || query.length > 0) && (
          <div ref={suggestionsRef} className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-96 overflow-y-auto">
            {suggestions.length > 0 ? (
              <>
                <div className="px-4 py-2 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    AI-Powered Suggestions
                  </span>
                </div>
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      {getSuggestionIcon(suggestion.type)}
                      <div className="flex-1">
                        <div className="text-gray-900 font-medium">{suggestion.text}</div>
                        {suggestion.metadata && (
                          <div className="flex gap-3 text-xs text-gray-500 mt-1">
                            {suggestion.metadata.budget && (
                              <span>💰 {suggestion.metadata.budget}</span>
                            )}
                            {suggestion.metadata.location && (
                              <span>📍 {suggestion.metadata.location}</span>
                            )}
                            {suggestion.metadata.urgency && (
                              <span>⚡ {suggestion.metadata.urgency}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-1 rounded">
                        {suggestion.type}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : query.length > 0 ? (
              <div className="px-4 py-6 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                No suggestions found. Try a different search term.
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Active Skill Filters */}
      {filters.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 mr-2">Skills:</span>
          {filters.skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {skill}
              <button
                onClick={() => removeSkillFilter(skill)}
                className="text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Quick Skill Tags */}
      <div className="mt-3">
        <div className="text-sm text-gray-600 mb-2">Popular skills:</div>
        <div className="flex flex-wrap gap-2">
          {popularSkills.slice(0, 8).map((skill) => (
            <button
              key={skill}
              onClick={() => addSkillFilter(skill)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filters.skills.includes(skill)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              + {skill}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}