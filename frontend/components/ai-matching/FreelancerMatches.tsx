import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Loader2, Star, MapPin, Clock, Zap } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface FreelancerMatch {
  freelancer_id: string;
  freelancer_name: string;
  freelancer_email: string;
  freelancer_bio: string;
  freelancer_skills: string[];
  similarity_score: number;
  compatibility_score: number;
  skill_match_score: number;
  budget_match_score: number;
  matching_skills: string[];
  cached: boolean;
  rank_position: number;
}

interface FreelancerMatchesProps {
  projectId: string;
  limit?: number;
  minSimilarity?: number;
  className?: string;
}

export const FreelancerMatches: React.FC<FreelancerMatchesProps> = ({
  projectId,
  limit = 10,
  minSimilarity = 0.3,
  className = ''
}) => {
  const { token } = useAuth();
  const [matches, setMatches] = useState<FreelancerMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        setError('Authentication required to view AI matches');
        setLoading(false);
        return;
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(
        `${API_BASE_URL}/ai/matching/projects/${projectId}/freelancers?limit=${limit}&min_similarity=${minSimilarity}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch matches: ${response.statusText}`);
      }

      const data = await response.json();
      setMatches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI matches');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
  };

  useEffect(() => {
    if (projectId && token) {
      fetchMatches();
    }
  }, [projectId, limit, minSimilarity, token]);

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 0.8) return 'default';
    if (score >= 0.6) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            AI-Powered Freelancer Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Finding the best freelancers for you...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            AI-Powered Freelancer Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            AI-Powered Freelancer Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No matching freelancers found</p>
            <p className="text-sm text-gray-400">
              Try lowering the similarity threshold or updating your project requirements
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            AI-Powered Freelancer Matches
            <Badge variant="secondary">{matches.length}</Badge>
          </CardTitle>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Refresh'
            )}
          </Button>
        </div>
        <p className="text-sm text-gray-500">
          Based on skills, experience, and compatibility analysis
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {matches.map((match, index) => (
            <div
              key={match.freelancer_id}
              className="flex items-start gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
            >
              <Avatar className="h-12 w-12">
                <AvatarImage 
                  src={`/api/avatars/${match.freelancer_id}`} 
                  alt={match.freelancer_name}
                />
                <AvatarFallback>
                  {match.freelancer_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-lg">{match.freelancer_name}</h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {match.freelancer_bio}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <Badge variant={getScoreBadgeVariant(match.similarity_score)}>
                      {Math.round(match.similarity_score * 100)}% match
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      #{match.rank_position + 1} recommendation
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex flex-wrap gap-2">
                    {match.matching_skills.slice(0, 5).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {match.matching_skills.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{match.matching_skills.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Skill Match:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress 
                        value={match.skill_match_score * 100} 
                        className="flex-1 h-2" 
                      />
                      <span className={`font-medium ${getScoreColor(match.skill_match_score)}`}>
                        {Math.round(match.skill_match_score * 100)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Budget Match:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress 
                        value={match.budget_match_score * 100} 
                        className="flex-1 h-2" 
                      />
                      <span className={`font-medium ${getScoreColor(match.budget_match_score)}`}>
                        {Math.round(match.budget_match_score * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {match.cached ? 'Cached result' : 'Fresh analysis'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/freelancers/${match.freelancer_id}`}>
                        View Profile
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/projects/${projectId}/hire/${match.freelancer_id}`}>
                        Invite to Bid
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {matches.length >= limit && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-2">
              Showing top {limit} matches
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Load More Matches
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FreelancerMatches;
