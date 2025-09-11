import React, { useState } from 'react';
import { 
  FiEdit3, 
  FiWand2, 
  FiCheck,
  FiRefreshCw,
  FiAlertCircle,
  FiInfo,
  FiCopy,
  FiSend,
  FiSave
} from 'react-icons/fi';

interface ProposalContent {
  introduction: string;
  approach: string;
  experience: string;
  timeline: string;
  closing: string;
}

interface ProposalGeneratorProps {
  projectId: string;
  onSaveProposal?: (content: string) => void;
  onSubmitProposal?: (content: string) => void;
}

const ProposalGenerator: React.FC<ProposalGeneratorProps> = ({
  projectId,
  onSaveProposal,
  onSubmitProposal
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposalContent, setProposalContent] = useState<ProposalContent | null>(null);
  const [editingSections, setEditingSections] = useState<Set<string>>(new Set());
  const [additionalContext, setAdditionalContext] = useState('');
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const generateProposal = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/ai/content/proposals/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          additional_context: additionalContext || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate proposal');
      }

      const data = await response.json();
      setProposalContent(data.content);
      setIsAIGenerated(data.ai_generated);
      setSuggestions(data.suggestions || []);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate proposal');
      console.error('Error generating proposal:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionEdit = (section: string, value: string) => {
    if (proposalContent) {
      setProposalContent({
        ...proposalContent,
        [section]: value
      });
    }
  };

  const toggleEditSection = (section: string) => {
    const newEditingSections = new Set(editingSections);
    if (newEditingSections.has(section)) {
      newEditingSections.delete(section);
    } else {
      newEditingSections.add(section);
    }
    setEditingSections(newEditingSections);
  };

  const copyToClipboard = async () => {
    if (!proposalContent) return;
    
    const fullProposal = Object.values(proposalContent).join('\n\n');
    
    try {
      await navigator.clipboard.writeText(fullProposal);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleSaveProposal = () => {
    if (!proposalContent) return;
    
    const fullProposal = Object.values(proposalContent).join('\n\n');
    onSaveProposal?.(fullProposal);
  };

  const handleSubmitProposal = () => {
    if (!proposalContent) return;
    
    const fullProposal = Object.values(proposalContent).join('\n\n');
    onSubmitProposal?.(fullProposal);
  };

  const getSectionLabel = (section: string) => {
    switch (section) {
      case 'introduction': return 'Introduction';
      case 'approach': return 'Approach & Methodology';
      case 'experience': return 'Relevant Experience';
      case 'timeline': return 'Timeline & Availability';
      case 'closing': return 'Closing Statement';
      default: return section;
    }
  };

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'introduction': return '👋';
      case 'approach': return '🎯';
      case 'experience': return '💼';
      case 'timeline': return '📅';
      case 'closing': return '🤝';
      default: return '📝';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
          <FiWand2 className="text-2xl text-purple-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Proposal Generator</h3>
            <p className="text-sm text-gray-600">Create compelling proposals with AI assistance</p>
          </div>
        </div>
        {isAIGenerated && (
          <div className="flex items-center text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
            <FiWand2 className="mr-2" />
            AI Generated
          </div>
        )}
      </div>

      {/* Generator Section */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Context (Optional)
            </label>
            <textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Add any specific details, requirements, or personal experience you'd like to highlight..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              This will help the AI create a more personalized and relevant proposal
            </p>
          </div>

          <button
            onClick={generateProposal}
            disabled={loading}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {loading ? (
              <>
                <FiRefreshCw className="animate-spin mr-2" />
                Generating AI Proposal...
              </>
            ) : (
              <>
                <FiWand2 className="mr-2" />
                Generate AI Proposal
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 border-b border-gray-200 bg-red-50">
          <div className="flex items-center text-red-700">
            <FiAlertCircle className="mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <div className="flex items-start">
            <FiInfo className="text-blue-600 mr-2 mt-1 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-2">Improvement Suggestions:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Proposal Content */}
      {proposalContent && (
        <div className="divide-y divide-gray-200">
          {Object.entries(proposalContent).map(([section, content]) => (
            <div key={section} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                  <span className="mr-2">{getSectionIcon(section)}</span>
                  {getSectionLabel(section)}
                </h4>
                <button
                  onClick={() => toggleEditSection(section)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center transition-colors"
                >
                  {editingSections.has(section) ? (
                    <>
                      <FiCheck className="mr-1" />
                      Done
                    </>
                  ) : (
                    <>
                      <FiEdit3 className="mr-1" />
                      Edit
                    </>
                  )}
                </button>
              </div>

              {editingSections.has(section) ? (
                <textarea
                  value={content}
                  onChange={(e) => handleSectionEdit(section, e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={6}
                />
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-line">{content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {proposalContent && (
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center transition-colors"
            >
              <FiCopy className="mr-2" />
              Copy All
            </button>

            {onSaveProposal && (
              <button
                onClick={handleSaveProposal}
                className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 flex items-center transition-colors"
              >
                <FiSave className="mr-2" />
                Save Draft
              </button>
            )}

            {onSubmitProposal && (
              <button
                onClick={handleSubmitProposal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors"
              >
                <FiSend className="mr-2" />
                Submit Proposal
              </button>
            )}

            <button
              onClick={generateProposal}
              disabled={loading}
              className="px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 flex items-center transition-colors disabled:opacity-50"
            >
              <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            {isAIGenerated ? (
              <p>✨ This proposal was generated using AI and can be fully customized to match your style and approach.</p>
            ) : (
              <p>📝 This proposal uses template content. Consider using AI generation for more personalized results.</p>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!proposalContent && !loading && (
        <div className="p-12 text-center">
          <FiWand2 className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to create your proposal?</h3>
          <p className="text-gray-600 mb-6">
            Use AI to generate a professional, tailored proposal that highlights your strengths and addresses the client's needs.
          </p>
          <p className="text-sm text-gray-500">
            Add any additional context above and click "Generate AI Proposal" to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProposalGenerator;
