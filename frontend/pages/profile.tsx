import { useEffect, useState } from 'react';
import ProfileEditor from '../components/ProfileEditor';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import Head from 'next/head';
import MFAManagement from '../components/security/MFAManagement';
import { ProjectMatches } from '../components/ai-matching';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  StatusBadge,
  Motion,
  Stagger
} from '../components/artisan-craft';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { token, user } = useAuth();
  const [aiProfile, setAiProfile] = useState<any | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';
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
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';
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
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';
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

  if (loading) return (
    <div className="min-h-screen bg-neutral-50 bg-craft-texture flex items-center justify-center">
      <Loader />
    </div>
  );
  if (error) return <Toast message={error} type="error" onClose={() => setError(null)} />;

  return (
    <>
      <Head>
        <title>My Profile - Artisan Marketplace</title>
        <meta name="description" content="Manage your artisan profile, skills, and portfolio" />
        
        {/* Artisan Craft Fonts */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+Pro:wght@400;500&family=Crimson+Text:wght@400;600&display=swap" 
          rel="stylesheet"
        />
      </Head>
      
      <div className="min-h-screen bg-neutral-50 bg-craft-texture">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Motion preset="slideInDown" className="mb-8">
            <div className="text-center space-y-4">
              <h1 className="heading-craft text-4xl text-mahogany-800">My Artisan Profile</h1>
              <p className="body-craft text-lg text-copper-700">
                Craft your professional identity and showcase your unique skills
              </p>
            </div>
          </Motion>
          <Motion preset="scaleIn" className="mb-8">
            <Card variant="leather" className="p-6">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your professional details and skills</CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileEditor
                  initialEmail={profile.email}
                  initialSkills={profile.skills}
                  initialRate={profile.rate}
                  onSave={handleSave}
                  loading={saving}
                />
              </CardContent>
            </Card>
          </Motion>
          <Motion preset="slideInUp" className="mb-8">
            <Card variant="parchment" interactive="hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gold-100 rounded-organic-leaf">
                    <svg className="w-5 h-5 text-gold-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  AI Profile Insights
                </CardTitle>
                <CardDescription>Discover your professional personality traits through AI analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {aiLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-mahogany-200 border-t-mahogany-600 rounded-full mx-auto mb-4"></div>
                    <p className="body-craft text-copper-700">Analyzing your profile...</p>
                  </div>
                ) : aiProfile ? (
                  <Stagger staggerDelay={100} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Card variant="filled" className="p-4 text-center">
                      <div className="body-craft text-sm text-copper-600 mb-1">Openness</div>
                      <div className="heading-craft text-2xl text-mahogany-800">{Math.round(aiProfile.openness)}%</div>
                    </Card>
                    <Card variant="filled" className="p-4 text-center">
                      <div className="body-craft text-sm text-copper-600 mb-1">Conscientiousness</div>
                      <div className="heading-craft text-2xl text-mahogany-800">{Math.round(aiProfile.conscientiousness)}%</div>
                    </Card>
                    <Card variant="filled" className="p-4 text-center">
                      <div className="body-craft text-sm text-copper-600 mb-1">Extraversion</div>
                      <div className="heading-craft text-2xl text-mahogany-800">{Math.round(aiProfile.extraversion)}%</div>
                    </Card>
                    <Card variant="filled" className="p-4 text-center">
                      <div className="body-craft text-sm text-copper-600 mb-1">Agreeableness</div>
                      <div className="heading-craft text-2xl text-mahogany-800">{Math.round(aiProfile.agreeableness)}%</div>
                    </Card>
                    <Card variant="filled" className="p-4 text-center">
                      <div className="body-craft text-sm text-copper-600 mb-1">Stability</div>
                      <div className="heading-craft text-2xl text-mahogany-800">{Math.round(100 - aiProfile.neuroticism)}%</div>
                    </Card>
                    <Card variant="filled" className="p-4 text-center">
                      <div className="body-craft text-sm text-copper-600 mb-1">Confidence</div>
                      <div className="heading-craft text-2xl text-mahogany-800">{Math.round((aiProfile.analysis_confidence || 0) * 100)}%</div>
                    </Card>
                  </Stagger>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl opacity-30 mb-4">🤖</div>
                    <p className="body-craft text-bronze-600">AI insights not available yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </Motion>

          <Motion preset="slideInUp" transition={{ delay: 200 }} className="mb-8">
            <Card variant="default" interactive="hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-forest-100 rounded-organic-craft">
                    <svg className="w-5 h-5 text-forest-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Portfolio Showcase
                </CardTitle>
                <CardDescription>Your creative works and professional achievements</CardDescription>
              </CardHeader>
              <CardContent>
                {profile.portfolio.length > 0 ? (
                  <div className="space-y-3">
                    {profile.portfolio.map((item: any, i: number) => (
                      <div key={i} className="border-l-4 border-gold-500 pl-4 py-2 hover:bg-mahogany-50 rounded-r-organic-gentle transition-colors duration-gentle">
                        <a href={item.url} className="heading-craft text-lg font-semibold text-mahogany-800 hover:text-copper-600 transition-colors">
                          {item.name}
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl opacity-30 mb-4">🎨</div>
                    <p className="body-craft text-bronze-600">No portfolio items yet. Add your work to showcase your skills!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </Motion>

          <Motion preset="slideInUp" transition={{ delay: 300 }} className="mb-8">
            <Card variant="elevated" interactive="hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-copper-100 rounded-organic-wax">
                    <svg className="w-5 h-5 text-copper-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Security Settings
                </CardTitle>
                <CardDescription>Protect your account with advanced security features</CardDescription>
              </CardHeader>
              <CardContent>
                <MFAManagement
                  apiUrl={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'}
                  token={token || ''}
                  onStatusChange={() => {}} // Profile page doesn't need to handle status changes
                />
              </CardContent>
              <CardFooter>
                <Link href="/security/mfa">
                  <Button variant="ghost" size="sm" shape="rounded">
                    Manage MFA Settings →
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </Motion>

          <Motion preset="slideInUp" transition={{ delay: 400 }}>
            <Card variant="leather" interactive="hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gold-100 rounded-organic-leaf">
                    <svg className="w-5 h-5 text-gold-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  Client Reviews
                </CardTitle>
                <CardDescription>What clients say about your work</CardDescription>
              </CardHeader>
              <CardContent>
                {profile.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {profile.reviews.map((review: any, index: number) => (
                      <Motion key={review.id} preset="fadeIn" transition={{ delay: (index + 5) * 100 }}>
                        <div className="border-l-4 border-gold-500 pl-4 py-3 hover:bg-neutral-50 rounded-r-organic-gentle transition-colors duration-gentle">
                          <div className="heading-craft text-base font-semibold text-mahogany-800 mb-1">{review.reviewer}</div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="text-gold-500 text-lg">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                            <Badge variant="success" size="xs">{review.rating}/5</Badge>
                          </div>
                          <p className="body-craft text-copper-700 text-sm">{review.comment}</p>
                        </div>
                      </Motion>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl opacity-30 mb-4">⭐</div>
                    <p className="body-craft text-bronze-600">No reviews yet. Complete projects to start building your reputation!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </Motion>
        </div>
      </div>
    </>
  );
}
