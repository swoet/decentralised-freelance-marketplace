import { useEffect, useState } from 'react';
import ProfileEditor from '../components/ProfileEditor';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import MFAManagement from '../components/security/MFAManagement';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { token, user } = useAuth();
  const [aiProfile, setAiProfile] = useState<any | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${API_URL}/users/me`, { headers })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        setProfile({
          id: data.id || '',
          email: data.email || '',
          skills: data.skills || '',
          rate: data.rate || 0,
          portfolio: data.portfolio || [],
          reviews: data.reviews || [],
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token || !user?.id) return;
    const fetchAI = async () => {
      try {
        setAiLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        const res = await fetch(`${API_URL}/ai/personality/analyze/${user.id}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        setAiProfile(data);
      } finally {
        setAiLoading(false);
      }
    };
    fetchAI();
  }, [token, user?.id]);

  const handleSave = (data: any) => {
    setSaving(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const targetId = profile?.id;
    const url = targetId ? `${API_URL}/users/${targetId}` : `${API_URL}/users/me`;
    fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to save profile');
        const saved = await res.json();
        setProfile({ ...profile, ...saved });
      })
      .catch((e) => setError(e.message))
      .finally(() => setSaving(false));
  };

  if (loading) return <Loader />;
  if (error) return <Toast message={error} type="error" onClose={() => setError(null)} />;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">My Profile</h1>
      <ProfileEditor
        initialEmail={profile.email}
        initialSkills={profile.skills}
        initialRate={profile.rate}
        onSave={handleSave}
        loading={saving}
      />
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2 text-gray-700">AI Profile Insights</h2>
        <div className="bg-white rounded-lg shadow p-4">
          {aiLoading ? (
            <div className="text-sm text-gray-500">Analyzing your profile...</div>
          ) : aiProfile ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-gray-500">Openness</div>
                <div className="font-semibold">{Math.round(aiProfile.openness)}%</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-gray-500">Conscientiousness</div>
                <div className="font-semibold">{Math.round(aiProfile.conscientiousness)}%</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-gray-500">Extraversion</div>
                <div className="font-semibold">{Math.round(aiProfile.extraversion)}%</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-gray-500">Agreeableness</div>
                <div className="font-semibold">{Math.round(aiProfile.agreeableness)}%</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-gray-500">Stability</div>
                <div className="font-semibold">{Math.round(100 - aiProfile.neuroticism)}%</div>
              </div>
              <div className="p-3 bg-gray-50 rounded col-span-2">
                <div className="text-gray-500 mb-1">Analysis Confidence</div>
                <div className="font-semibold">{Math.round((aiProfile.analysis_confidence || 0) * 100)}%</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">AI insights not available yet.</div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2 text-gray-700">Portfolio</h2>
        <ul className="list-disc list-inside text-gray-600">
          {profile.portfolio.map((item: any, i: number) => (
            <li key={i}><a href={item.url} className="text-blue-600 hover:underline">{item.name}</a></li>
          ))}
        </ul>
      </div>
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2 text-gray-700">Security Settings</h2>
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <MFAManagement
            apiUrl={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}
            token={token || ''}
            onStatusChange={() => {}} // Profile page doesn't need to handle status changes
          />
          <div className="mt-4">
            <Link href="/security/mfa" className="text-blue-600 hover:underline text-sm">
              Manage MFA Settings →
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2 text-gray-700">Reviews</h2>
        <ul className="divide-y divide-gray-200 bg-white rounded-lg shadow">
          {profile.reviews.map((review: any) => (
            <li key={review.id} className="px-4 py-3">
              <div className="font-medium text-gray-800">{review.reviewer}</div>
              <div className="text-yellow-500 text-sm mb-1">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
              <div className="text-gray-600 text-sm">{review.comment}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
