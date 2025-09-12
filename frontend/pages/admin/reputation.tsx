import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../../components/Navbar';
import Toast from '../../components/Toast';

interface ReputationOverview {
  total_users_with_reputation: number;
  avg_reputation_score: number;
  high_reputation_users: number;
  low_reputation_users: number;
  pending_reviews: number;
  disputed_reviews: number;
}

interface UserReputation {
  user_id: string;
  username: string;
  email: string;
  reputation_score: number;
  total_reviews: number;
  positive_reviews: number;
  negative_reviews: number;
  avg_rating: number;
  projects_completed: number;
  last_activity: string;
  status: 'active' | 'suspended' | 'under_review';
  verification_level: 'basic' | 'verified' | 'premium';
}

interface ReviewDetails {
  id: string;
  project_id: string;
  project_title: string;
  reviewer_username: string;
  reviewee_username: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'disputed' | 'rejected';
  created_at: string;
  flags: string[];
}

interface ReputationMetrics {
  score_distribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  review_trends: {
    date: string;
    reviews_submitted: number;
    avg_rating: number;
  }[];
  top_performers: {
    user_id: string;
    username: string;
    score: number;
    reviews: number;
  }[];
}

export default function ReputationManagement() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [overview, setOverview] = useState<ReputationOverview | null>(null);
  const [userReputations, setUserReputations] = useState<UserReputation[]>([]);
  const [reviews, setReviews] = useState<ReviewDetails[]>([]);
  const [metrics, setMetrics] = useState<ReputationMetrics | null>(null);
  
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'reviews' | 'metrics'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'disputed'>('all');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }
    
    if (token) {
      fetchReputationData();
    }
  }, [user, token, router]);

  const fetchReputationData = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const [overviewRes, usersRes, reviewsRes, metricsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reputation/overview`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reputation/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reputation/reviews?status=${filterStatus}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reputation/metrics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setOverview(data);
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUserReputations(data.users || []);
      }

      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        setReviews(data.reviews || []);
      }

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Failed to fetch reputation data:', err);
      setError('Failed to load reputation data');
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, newStatus: 'active' | 'suspended' | 'under_review') => {
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reputation/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setSuccess(`User status updated to ${newStatus}`);
        fetchReputationData();
      } else {
        setError('Failed to update user status');
      }
    } catch (err) {
      setError('Network error while updating user status');
    }
  };

  const handleReview = async (reviewId: string, action: 'approve' | 'reject', reason?: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reputation/reviews/${reviewId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        setSuccess(`Review ${action}d successfully`);
        fetchReputationData();
      } else {
        setError(`Failed to ${action} review`);
      }
    } catch (err) {
      setError(`Network error while ${action}ing review`);
    }
  };

  const resetUserReputation = async (userId: string) => {
    if (!token) return;

    if (!confirm('Are you sure you want to reset this user\'s reputation? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reputation/users/${userId}/reset`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSuccess('User reputation reset successfully');
        fetchReputationData();
      } else {
        setError('Failed to reset user reputation');
      }
    } catch (err) {
      setError('Network error while resetting reputation');
    }
  };

  const getReputationColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'disputed':
        return 'bg-orange-100 text-orange-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationBadge = (level: string) => {
    switch (level) {
      case 'premium':
        return <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">Premium</span>;
      case 'verified':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Verified</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Basic</span>;
    }
  };

  const filteredUsers = userReputations.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.reviewer_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.reviewee_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.project_title.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && review.status === filterStatus;
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Access Denied</title>
        </Head>
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">Admin access required to manage reputation system.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Reputation Management - Loading</title>
        </Head>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reputation management...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Reputation Management - FreelanceX</title>
      </Head>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Reputation Management</h1>
          <p className="text-lg text-gray-600">Manage user reputation scores and review system</p>
        </div>

        {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
        {success && <Toast message={success} type="success" onClose={() => setSuccess(null)} />}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'users', label: 'User Reputation' },
                { key: 'reviews', label: 'Review Management' },
                { key: 'metrics', label: 'Analytics' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {selectedTab === 'overview' && overview && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Reputation System Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{overview.total_users_with_reputation.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Users with Reputation</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{overview.avg_reputation_score.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Average Score</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-3xl font-bold text-yellow-600">{overview.high_reputation_users}</div>
                    <div className="text-sm text-gray-600">High Reputation (80+)</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-3xl font-bold text-red-600">{overview.low_reputation_users}</div>
                    <div className="text-sm text-gray-600">Low Reputation (&lt;40)</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">{overview.pending_reviews}</div>
                    <div className="text-sm text-gray-600">Pending Reviews</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-3xl font-bold text-orange-600">{overview.disputed_reviews}</div>
                    <div className="text-sm text-gray-600">Disputed Reviews</div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {selectedTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">User Reputation Management</h2>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.user_id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{user.username}</h3>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                          {getVerificationBadge(user.verification_level)}
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.status)}`}>
                            {user.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold px-3 py-1 rounded-lg ${getReputationColor(user.reputation_score)}`}>
                            {user.reputation_score}
                          </div>
                          <div className="text-xs text-gray-600">Reputation Score</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 text-sm">
                        <div>
                          <div className="font-medium">Total Reviews</div>
                          <div className="text-gray-600">{user.total_reviews}</div>
                        </div>
                        <div>
                          <div className="font-medium">Positive</div>
                          <div className="text-green-600">{user.positive_reviews}</div>
                        </div>
                        <div>
                          <div className="font-medium">Negative</div>
                          <div className="text-red-600">{user.negative_reviews}</div>
                        </div>
                        <div>
                          <div className="font-medium">Avg Rating</div>
                          <div className="text-gray-600">{user.avg_rating.toFixed(1)}/5</div>
                        </div>
                        <div>
                          <div className="font-medium">Projects Completed</div>
                          <div className="text-gray-600">{user.projects_completed}</div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          Last active: {new Date(user.last_activity).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          {user.status !== 'active' && (
                            <button
                              onClick={() => updateUserStatus(user.user_id, 'active')}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              Activate
                            </button>
                          )}
                          {user.status !== 'suspended' && (
                            <button
                              onClick={() => updateUserStatus(user.user_id, 'suspended')}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                              Suspend
                            </button>
                          )}
                          <button
                            onClick={() => resetUserReputation(user.user_id)}
                            className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                          >
                            Reset Reputation
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {selectedTab === 'reviews' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Review Management</h2>
                  <div className="flex gap-4">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="all">All Reviews</option>
                      <option value="pending">Pending</option>
                      <option value="disputed">Disputed</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Search reviews..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredReviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{review.project_title}</h3>
                          <p className="text-sm text-gray-600">
                            {review.reviewer_username} → {review.reviewee_username}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-yellow-600">
                            {review.rating}/5 ⭐
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(review.status)}`}>
                            {review.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-gray-700">{review.comment}</p>
                      </div>

                      {review.flags.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-red-900 mb-2">Flags:</h4>
                          <div className="flex flex-wrap gap-2">
                            {review.flags.map((flag, index) => (
                              <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-sm rounded">
                                {flag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          Submitted: {new Date(review.created_at).toLocaleDateString()}
                        </div>
                        {review.status === 'pending' || review.status === 'disputed' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReview(review.id, 'approve')}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReview(review.id, 'reject', 'Violates community guidelines')}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">
                            Status: {review.status}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics Tab */}
            {selectedTab === 'metrics' && metrics && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Reputation Analytics</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Score Distribution */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h3>
                    <div className="space-y-3">
                      {metrics.score_distribution.map((dist, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-gray-700">{dist.range}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-gray-200 rounded-full h-4">
                              <div
                                className="bg-blue-600 h-4 rounded-full"
                                style={{ width: `${dist.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-16">{dist.count} users</span>
                            <span className="text-sm font-medium w-12">{dist.percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Performers */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
                    <div className="space-y-3">
                      {metrics.top_performers.map((performer, index) => (
                        <div key={performer.user_id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
                            <span className="font-medium text-gray-900">{performer.username}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">{performer.score}</div>
                            <div className="text-xs text-gray-600">{performer.reviews} reviews</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
