import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface SkillBadge {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: string;
  isVerified: boolean;
  blockchainTxHash?: string;
  earnedDate: string;
  expiryDate?: string;
  certificationBody?: string;
  projectsCompleted: number;
  averageRating: number;
  description: string;
  icon?: string;
}

interface CertificationRequirement {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  progress: number;
  maxProgress: number;
  type: 'project' | 'assessment' | 'portfolio' | 'peer_review';
}

interface Props {
  userId?: string;
  showAddBadge?: boolean;
  editable?: boolean;
}

export default function SkillBadges({ userId, showAddBadge = false, editable = false }: Props) {
  const { user, token } = useAuth();
  const [badges, setBadges] = useState<SkillBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<SkillBadge | null>(null);
  const [showCertificationModal, setShowCertificationModal] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [certificationRequirements, setCertificationRequirements] = useState<CertificationRequirement[]>([]);

  useEffect(() => {
    fetchSkillBadges();
    if (showAddBadge || editable) {
      fetchAvailableSkills();
    }
  }, [userId, user]);

  const fetchSkillBadges = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const targetUserId = userId || user?.id;
      
      const response = await fetch(`${API_URL}/users/${targetUserId}/badges`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBadges(data.badges || []);
      } else {
        // Fallback mock data
        setBadges([
          {
            id: '1',
            name: 'React Developer',
            level: 'expert',
            category: 'Frontend',
            isVerified: true,
            blockchainTxHash: '0x742d35cc65741234567890abc',
            earnedDate: '2024-01-15',
            certificationBody: 'CraftNexus Academy',
            projectsCompleted: 47,
            averageRating: 4.9,
            description: 'Expert-level React developer with proven track record',
            icon: '⚛️'
          },
          {
            id: '2',
            name: 'Smart Contracts',
            level: 'advanced',
            category: 'Blockchain',
            isVerified: true,
            blockchainTxHash: '0x8a9b2c5e4f6d78901234567',
            earnedDate: '2024-02-20',
            certificationBody: 'Blockchain Institute',
            projectsCompleted: 23,
            averageRating: 4.8,
            description: 'Advanced Solidity developer with DeFi experience',
            icon: '🔗'
          },
          {
            id: '3',
            name: 'UI/UX Design',
            level: 'intermediate',
            category: 'Design',
            isVerified: false,
            earnedDate: '2024-03-10',
            projectsCompleted: 15,
            averageRating: 4.6,
            description: 'Creative UI/UX designer with modern aesthetics',
            icon: '🎨'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching skill badges:', error);
      setBadges([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSkills = async () => {
    try {
      const skills = [
        'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Node.js',
        'Python', 'Django', 'Flask', 'Java', 'Spring Boot', 'C#', '.NET',
        'PHP', 'Laravel', 'Ruby', 'Rails', 'Go', 'Rust', 'Swift', 'Kotlin',
        'Flutter', 'React Native', 'iOS Development', 'Android Development',
        'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch',
        'Blockchain', 'Solidity', 'Smart Contracts', 'Web3', 'DeFi',
        'AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'DevOps',
        'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'REST APIs',
        'UI/UX Design', 'Figma', 'Adobe XD', 'Photoshop', 'Illustrator'
      ];
      setAvailableSkills(skills);
    } catch (error) {
      console.error('Error fetching available skills:', error);
    }
  };

  const initiateCertification = async (skillName: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      
      // Mock certification requirements
      setCertificationRequirements([
        {
          id: '1',
          name: 'Complete 3 Projects',
          description: 'Successfully complete 3 projects using this skill',
          completed: false,
          progress: 1,
          maxProgress: 3,
          type: 'project'
        },
        {
          id: '2',
          name: 'Skill Assessment',
          description: 'Pass a comprehensive skill assessment test',
          completed: false,
          progress: 0,
          maxProgress: 1,
          type: 'assessment'
        },
        {
          id: '3',
          name: 'Portfolio Review',
          description: 'Submit portfolio for expert review',
          completed: false,
          progress: 0,
          maxProgress: 1,
          type: 'portfolio'
        },
        {
          id: '4',
          name: 'Peer Reviews',
          description: 'Receive positive reviews from 5 clients',
          completed: false,
          progress: 3,
          maxProgress: 5,
          type: 'peer_review'
        }
      ]);
      
      setShowCertificationModal(true);
    } catch (error) {
      console.error('Error initiating certification:', error);
    }
  };

  const getBadgeStyle = (level: string, isVerified: boolean) => {
    const baseStyle = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium";
    
    if (!isVerified) {
      return `${baseStyle} bg-gray-100 text-gray-800 border border-gray-300`;
    }
    
    switch (level) {
      case 'expert':
        return `${baseStyle} bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg`;
      case 'advanced':
        return `${baseStyle} bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md`;
      case 'intermediate':
        return `${baseStyle} bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md`;
      case 'beginner':
        return `${baseStyle} bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-md`;
      default:
        return `${baseStyle} bg-gray-500 text-white`;
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'expert': return '👑';
      case 'advanced': return '🌟';
      case 'intermediate': return '⭐';
      case 'beginner': return '🌱';
      default: return '📋';
    }
  };

  const getRequirementIcon = (type: string) => {
    switch (type) {
      case 'project': return '💼';
      case 'assessment': return '📝';
      case 'portfolio': return '🎨';
      case 'peer_review': return '👥';
      default: return '✅';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Skill Badges</h3>
          <p className="text-gray-600 text-sm">Blockchain-verified skills and certifications</p>
        </div>
        {showAddBadge && (
          <button
            onClick={() => setShowCertificationModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            + Earn Badge
          </button>
        )}
      </div>

      {/* Badges Grid */}
      {badges.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-2xl">{badge.icon || '🏆'}</div>
                {badge.isVerified && (
                  <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Verified
                  </div>
                )}
              </div>
              
              <h4 className="font-semibold text-gray-900 mb-2">{badge.name}</h4>
              
              <div className="flex items-center gap-2 mb-2">
                <span className={getBadgeStyle(badge.level, badge.isVerified)}>
                  {getLevelIcon(badge.level)} {badge.level.charAt(0).toUpperCase() + badge.level.slice(1)}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Projects:</span>
                  <span className="font-medium">{badge.projectsCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rating:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{badge.averageRating}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-3 h-3 ${i < Math.floor(badge.averageRating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Earned: {new Date(badge.earnedDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <div className="text-4xl mb-4">🏆</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No skill badges yet</h4>
          <p className="text-gray-600 mb-4">Start earning blockchain-verified skill badges by completing projects and assessments</p>
          {showAddBadge && (
            <button
              onClick={() => setShowCertificationModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Earn Your First Badge
            </button>
          )}
        </div>
      )}

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="text-3xl">{selectedBadge.icon || '🏆'}</div>
              <button
                onClick={() => setSelectedBadge(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedBadge.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{selectedBadge.description}</p>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Level:</span>
                <span className={getBadgeStyle(selectedBadge.level, selectedBadge.isVerified)}>
                  {getLevelIcon(selectedBadge.level)} {selectedBadge.level.charAt(0).toUpperCase() + selectedBadge.level.slice(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium">{selectedBadge.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Projects Completed:</span>
                <span className="font-medium">{selectedBadge.projectsCompleted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Rating:</span>
                <span className="font-medium">{selectedBadge.averageRating} ⭐</span>
              </div>
              {selectedBadge.certificationBody && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Certified By:</span>
                  <span className="font-medium">{selectedBadge.certificationBody}</span>
                </div>
              )}
            </div>
            
            {selectedBadge.isVerified && (
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center text-green-800 mb-2">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/>
                  </svg>
                  Blockchain Verified
                </div>
                <div className="text-sm text-green-700 font-mono">
                  {selectedBadge.blockchainTxHash}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Certification Modal */}
      {showCertificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Earn Skill Certification</h3>
                  <p className="text-gray-600 text-sm">Complete requirements to earn blockchain-verified badges</p>
                </div>
                <button
                  onClick={() => setShowCertificationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Skill Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Skill to Certify
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                  <option>Choose a skill...</option>
                  {availableSkills.map(skill => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
              </div>
              
              {/* Requirements */}
              {certificationRequirements.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Certification Requirements</h4>
                  {certificationRequirements.map(req => (
                    <div key={req.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getRequirementIcon(req.type)}</span>
                          <h5 className="font-medium text-gray-900">{req.name}</h5>
                        </div>
                        {req.completed && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            ✅ Complete
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{req.description}</p>
                      
                      {/* Progress Bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(req.progress / req.maxProgress) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {req.progress}/{req.maxProgress}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowCertificationModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Certification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}