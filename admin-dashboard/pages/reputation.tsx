import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminLayout from '../components/AdminLayout';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function ReputationPage() {
  const { admin, token, isLoading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !admin) {
      router.push('/login');
      return;
    }
  }, [admin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <AdminLayout title="Reputation System">
      <Head>
        <title>Reputation - Admin Dashboard</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reputation System</h1>
          <p className="text-gray-600 mt-1">Monitor and manage user reputation scores and reviews</p>
        </div>

        {/* Reputation Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Total Reviews</p>
                <p className="text-3xl font-bold text-yellow-900 mt-2">2,847</p>
              </div>
              <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Avg Rating</p>
                <p className="text-3xl font-bold text-green-900 mt-2">4.7</p>
              </div>
              <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Verified Reviews</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">89%</p>
              </div>
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Flagged Reviews</p>
                <p className="text-3xl font-bold text-red-900 mt-2">12</p>
              </div>
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Top Rated Users */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Top Rated Freelancers</h2>
          <div className="space-y-4">
            {[
              { name: 'Alice Johnson', rating: 4.9, reviews: 127, specialty: 'Web Development' },
              { name: 'Bob Smith', rating: 4.8, reviews: 98, specialty: 'UI/UX Design' },
              { name: 'Carol Davis', rating: 4.8, reviews: 84, specialty: 'Mobile Development' }
            ].map((user, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-lg">{user.name[0]}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.specialty}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-lg font-bold text-gray-900">{user.rating}</span>
                  </div>
                  <p className="text-sm text-gray-500">{user.reviews} reviews</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Rating Distribution</h2>
          <div className="space-y-3">
            {[
              { stars: 5, count: 1847, percentage: 65 },
              { stars: 4, count: 682, percentage: 24 },
              { stars: 3, count: 198, percentage: 7 },
              { stars: 2, count: 85, percentage: 3 },
              { stars: 1, count: 35, percentage: 1 }
            ].map((rating) => (
              <div key={rating.stars} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-16">
                  <span className="font-medium text-gray-700">{rating.stars}</span>
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full"
                      style={{ width: `${rating.percentage}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-gray-600 w-20 text-right">{rating.count} ({rating.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
