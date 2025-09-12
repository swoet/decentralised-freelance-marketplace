import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Head from 'next/head';
import Navbar from '../../components/Navbar';
import Toast from '../../components/Toast';

interface ProjectForm {
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  skills_required: string[];
  project_type: string;
  duration_estimate: string;
  complexity_level: string;
  milestones: Array<{
    title: string;
    description: string;
    amount: number;
    due_days: number;
  }>;
}

export default function CreateProject() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<any>(null);

  const [form, setForm] = useState<ProjectForm>({
    title: '',
    description: '',
    budget_min: 500,
    budget_max: 2000,
    skills_required: [],
    project_type: 'web_development',
    duration_estimate: '2-4 weeks',
    complexity_level: 'intermediate',
    milestones: [
      { title: 'Project Setup', description: 'Initial setup and planning', amount: 25, due_days: 7 },
      { title: 'Development', description: 'Core development work', amount: 60, due_days: 21 },
      { title: 'Testing & Delivery', description: 'Final testing and project delivery', amount: 15, due_days: 28 }
    ]
  });

  const skillOptions = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Django', 'Flask',
    'PHP', 'Laravel', 'Vue.js', 'Angular', 'HTML/CSS', 'UI/UX Design',
    'Figma', 'Photoshop', 'Illustrator', 'WordPress', 'Shopify',
    'Mobile Development', 'Flutter', 'React Native', 'iOS', 'Android',
    'DevOps', 'AWS', 'Docker', 'Kubernetes', 'Database Design',
    'MySQL', 'PostgreSQL', 'MongoDB', 'Machine Learning', 'AI',
    'Data Science', 'Content Writing', 'Copywriting', 'SEO', 'Marketing'
  ];

  const projectTypes = [
    { value: 'web_development', label: 'Web Development' },
    { value: 'mobile_app', label: 'Mobile App' },
    { value: 'design', label: 'Design & UI/UX' },
    { value: 'content_writing', label: 'Content & Writing' },
    { value: 'marketing', label: 'Digital Marketing' },
    { value: 'data_science', label: 'Data Science & AI' },
    { value: 'other', label: 'Other' }
  ];

  const handleSkillToggle = (skill: string) => {
    setForm(prev => ({
      ...prev,
      skills_required: prev.skills_required.includes(skill)
        ? prev.skills_required.filter(s => s !== skill)
        : [...prev.skills_required, skill]
    }));
  };

  const handleMilestoneChange = (index: number, field: string, value: string | number) => {
    setForm(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) => 
        i === index ? { ...milestone, [field]: value } : milestone
      )
    }));
  };

  const addMilestone = () => {
    setForm(prev => ({
      ...prev,
      milestones: [...prev.milestones, {
        title: '',
        description: '',
        amount: 0,
        due_days: 7
      }]
    }));
  };

  const removeMilestone = (index: number) => {
    if (form.milestones.length > 1) {
      setForm(prev => ({
        ...prev,
        milestones: prev.milestones.filter((_, i) => i !== index)
      }));
    }
  };

  const getAIAssistance = async () => {
    if (!token) return;
    
    setShowAIAssistant(true);
    setLoading(true);

    try {
      // Get AI-powered project enhancement
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai-content/project/enhance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          original_description: form.description,
          project_title: form.title,
          required_skills: form.skills_required,
          budget_range: `$${form.budget_min} - $${form.budget_max}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAISuggestions(data);
      }

      // Get title suggestions if title is empty
      if (!form.title && form.description) {
        const titleResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai-content/titles/suggest`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            description: form.description,
            skills: form.skills_required,
            count: 5
          })
        });

        if (titleResponse.ok) {
          const titleData = await titleResponse.json();
          setAISuggestions(prev => ({ ...prev, titles: titleData.titles }));
        }
      }
    } catch (err) {
      console.error('AI assistance error:', err);
      const errorMessage = err instanceof Error ? err.message : 'AI assistance temporarily unavailable';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const applyAISuggestion = (type: string, content: string) => {
    if (type === 'description') {
      setForm(prev => ({ ...prev, description: content }));
    } else if (type === 'title') {
      setForm(prev => ({ ...prev, title: content }));
    }
    setAISuggestions(null);
    setShowAIAssistant(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...form,
          client_id: user?.id,
          required_skills: form.skills_required,
          project_metadata: {
            project_type: form.project_type,
            duration_estimate: form.duration_estimate,
            complexity_level: form.complexity_level,
            required_skills: form.skills_required,
            milestones: form.milestones
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Project created successfully!');
        setTimeout(() => {
          router.push(`/projects/${data.id}`);
        }, 2000);
      } else {
        const errorData = await response.json();
        // Ensure error message is always a string
        let errorMessage = 'Failed to create project';
        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (typeof errorData.detail === 'object') {
            // Handle validation errors or other object-type errors
            errorMessage = errorData.detail.msg || errorData.detail.message || JSON.stringify(errorData.detail);
          }
        }
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Create Project - AI-Powered Freelance Marketplace</title>
      </Head>
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
            <button
              type="button"
              onClick={getAIAssistance}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors"
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Assistant
            </button>
          </div>

          {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
          {success && <Toast message={success} type="success" onClose={() => setSuccess(null)} />}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Build a React E-commerce Website"
              />
            </div>

            {/* Project Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Type *
              </label>
              <select
                value={form.project_type}
                onChange={(e) => setForm(prev => ({ ...prev, project_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {projectTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Description *
              </label>
              <textarea
                required
                rows={6}
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your project requirements, goals, and any specific features you need..."
              />
            </div>

            {/* Budget Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Budget ($)
                </label>
                <input
                  type="number"
                  min="100"
                  value={form.budget_min}
                  onChange={(e) => setForm(prev => ({ ...prev, budget_min: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Budget ($)
                </label>
                <input
                  type="number"
                  min="100"
                  value={form.budget_max}
                  onChange={(e) => setForm(prev => ({ ...prev, budget_max: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Duration & Complexity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration Estimate
                </label>
                <select
                  value={form.duration_estimate}
                  onChange={(e) => setForm(prev => ({ ...prev, duration_estimate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1-2 weeks">1-2 weeks</option>
                  <option value="2-4 weeks">2-4 weeks</option>
                  <option value="1-2 months">1-2 months</option>
                  <option value="2-3 months">2-3 months</option>
                  <option value="3+ months">3+ months</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complexity Level
                </label>
                <select
                  value={form.complexity_level}
                  onChange={(e) => setForm(prev => ({ ...prev, complexity_level: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>

            {/* Required Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Skills
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {skillOptions.map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillToggle(skill)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      form.skills_required.includes(skill)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              {form.skills_required.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {form.skills_required.join(', ')}
                </div>
              )}
            </div>

            {/* Milestones */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Project Milestones
                </label>
                <button
                  type="button"
                  onClick={addMilestone}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Milestone
                </button>
              </div>
              
              {form.milestones.map((milestone, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-gray-900">Milestone {index + 1}</h4>
                    {form.milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                      <input
                        type="text"
                        value={milestone.title}
                        onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        placeholder="Milestone title"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Amount (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={milestone.amount}
                        onChange={(e) => handleMilestoneChange(index, 'amount', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Due (days)</label>
                      <input
                        type="number"
                        min="1"
                        value={milestone.due_days}
                        onChange={(e) => handleMilestoneChange(index, 'due_days', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={milestone.description}
                      onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      placeholder="Describe what should be delivered in this milestone"
                    />
                  </div>
                </div>
              ))}
              
              <div className="text-sm text-gray-600">
                Total: {form.milestones.reduce((sum, m) => sum + m.amount, 0)}% 
                {form.milestones.reduce((sum, m) => sum + m.amount, 0) !== 100 && (
                  <span className="text-red-600 ml-2">⚠️ Should add up to 100%</span>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.push('/projects')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || form.milestones.reduce((sum, m) => sum + m.amount, 0) !== 100}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* AI Assistant Modal */}
      {showAIAssistant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">AI Assistant</h3>
                <button
                  onClick={() => setShowAIAssistant(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-2">AI is analyzing your project...</span>
                </div>
              ) : aiSuggestions ? (
                <div className="space-y-4">
                  {aiSuggestions.enhanced_description && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Enhanced Description:</h4>
                      <p className="text-sm text-gray-700 mb-3">{aiSuggestions.enhanced_description}</p>
                      <button
                        onClick={() => applyAISuggestion('description', aiSuggestions.enhanced_description)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Apply This Description
                      </button>
                    </div>
                  )}
                  
                  {aiSuggestions.titles && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Title Suggestions:</h4>
                      <div className="space-y-2">
                        {aiSuggestions.titles.map((title: string, index: number) => (
                          <button
                            key={index}
                            onClick={() => applyAISuggestion('title', title)}
                            className="block w-full text-left text-sm p-2 hover:bg-gray-50 rounded border text-gray-700"
                          >
                            {title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">Click "Get AI Assistance" to get smart suggestions for your project.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
