import React, { useState } from 'react';
import { 
  FiWand2, 
  FiRefreshCw,
  FiAlertCircle,
  FiCheck,
  FiArrowRight,
  FiCopy,
  FiSave,
  FiEdit3,
  FiInfo
} from 'react-icons/fi';

interface ProjectDescriptionEnhancerProps {
  projectId?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialSkills?: string[];
  onSave?: (enhancedDescription: string) => void;
}

const ProjectDescriptionEnhancer: React.FC<ProjectDescriptionEnhancerProps> = ({
  projectId,
  initialTitle = '',
  initialDescription = '',
  initialSkills = [],
  onSave
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [title, setTitle] = useState(initialTitle);
  const [originalDescription, setOriginalDescription] = useState(initialDescription);
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [budgetRange, setBudgetRange] = useState('');
  
  // Results
  const [enhancedDescription, setEnhancedDescription] = useState('');
  const [improvements, setImprovements] = useState<string[]>([]);
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  
  // UI state
  const [showComparison, setShowComparison] = useState(false);

  const enhanceDescription = async () => {
    if (!title.trim() || !originalDescription.trim()) {
      setError('Please provide both project title and description');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/ai/content/projects/enhance-description', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId || null,
          project_title: title,
          original_description: originalDescription,
          required_skills: skills.length > 0 ? skills : null,
          budget_range: budgetRange || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to enhance description');
      }

      const data = await response.json();
      setEnhancedDescription(data.enhanced_description);
      setImprovements(data.improvements || []);
      setIsAIGenerated(data.ai_generated);
      setShowComparison(true);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enhance description');
      console.error('Error enhancing description:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleSave = () => {
    if (enhancedDescription && onSave) {
      onSave(enhancedDescription);
    }
  };

  const addSkill = (skill: string) => {
    if (skill.trim() && !skills.includes(skill.trim())) {
      setSkills([...skills, skill.trim()]);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleSkillKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const input = e.target as HTMLInputElement;
      addSkill(input.value);
      input.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
          <FiWand2 className="text-2xl text-green-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Description Enhancer</h3>
            <p className="text-sm text-gray-600">Make your project description more compelling and clear</p>
          </div>
        </div>
        {isAIGenerated && (
          <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
            <FiWand2 className="mr-2" />
            AI Enhanced
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-6 space-y-6">
        {/* Project Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your project title..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Original Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Description *
          </label>
          <textarea
            value={originalDescription}
            onChange={(e) => setOriginalDescription(e.target.value)}
            placeholder="Paste your current project description here..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            rows={6}
          />
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Required Skills (Optional)
          </label>
          <input
            type="text"
            onKeyPress={handleSkillKeyPress}
            placeholder="Type a skill and press Enter to add..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-2"
          />
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Budget Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Budget Range (Optional)
          </label>
          <input
            type="text"
            value={budgetRange}
            onChange={(e) => setBudgetRange(e.target.value)}
            placeholder="e.g., $1,000 - $5,000"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Enhance Button */}
        <button
          onClick={enhanceDescription}
          disabled={loading || !title.trim() || !originalDescription.trim()}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        >
          {loading ? (
            <>
              <FiRefreshCw className="animate-spin mr-2" />
              Enhancing Description...
            </>
          ) : (
            <>
              <FiWand2 className="mr-2" />
              Enhance with AI
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-6 pb-4">
          <div className="flex items-center text-red-700 bg-red-50 p-4 rounded-lg">
            <FiAlertCircle className="mr-2 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Results */}
      {showComparison && enhancedDescription && (
        <div className="border-t border-gray-200">
          {/* Improvements */}
          {improvements.length > 0 && (
            <div className="p-6 bg-green-50 border-b border-gray-200">
              <div className="flex items-start">
                <FiInfo className="text-green-600 mr-2 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-green-900 mb-2">AI Improvements Applied:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    {improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start">
                        <FiCheck className="mr-2 mt-0.5 flex-shrink-0" />
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Comparison View */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Original */}
              <div>
                <div className="flex items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900 mr-3">Original Description</h4>
                  <button
                    onClick={() => copyToClipboard(originalDescription)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                    title="Copy original"
                  >
                    <FiCopy />
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-300">
                  <p className="text-gray-700 whitespace-pre-line">{originalDescription}</p>
                </div>
              </div>

              {/* Enhanced */}
              <div>
                <div className="flex items-center mb-4">
                  <FiArrowRight className="text-green-600 mr-2" />
                  <h4 className="text-lg font-medium text-gray-900 mr-3">AI Enhanced Description</h4>
                  <button
                    onClick={() => copyToClipboard(enhancedDescription)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                    title="Copy enhanced"
                  >
                    <FiCopy />
                  </button>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                  <p className="text-gray-700 whitespace-pre-line">{enhancedDescription}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => copyToClipboard(enhancedDescription)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center transition-colors"
              >
                <FiCopy className="mr-2" />
                Copy Enhanced
              </button>

              {onSave && (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center transition-colors"
                >
                  <FiSave className="mr-2" />
                  Save Enhanced Description
                </button>
              )}

              <button
                onClick={() => {
                  setOriginalDescription(enhancedDescription);
                  setShowComparison(false);
                  setEnhancedDescription('');
                }}
                className="px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 flex items-center transition-colors"
              >
                <FiEdit3 className="mr-2" />
                Use as New Original
              </button>

              <button
                onClick={enhanceDescription}
                disabled={loading}
                className="px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 flex items-center transition-colors disabled:opacity-50"
              >
                <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Enhance Again
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              {isAIGenerated ? (
                <p>✨ This description was enhanced using AI to improve clarity, appeal, and professionalism.</p>
              ) : (
                <p>📝 This description uses template enhancements. Consider using AI enhancement for better results.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!showComparison && !loading && (
        <div className="p-12 text-center border-t border-gray-200">
          <FiWand2 className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Enhance Your Project Description</h3>
          <p className="text-gray-600 mb-4">
            AI will analyze your description and make it more compelling, clear, and attractive to qualified freelancers.
          </p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>• Improve clarity and structure</p>
            <p>• Add professional tone</p>
            <p>• Include relevant technical details</p>
            <p>• Optimize for freelancer appeal</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDescriptionEnhancer;
