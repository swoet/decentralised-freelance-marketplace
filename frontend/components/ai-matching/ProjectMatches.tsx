import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Clock, Zap, DollarSign, Calendar, User } from 'lucide-react';
import Link from 'next/link';

interface ProjectMatch {
  project_id: string;
  project_title: string;
  project_description: string;
  client_name: string;
  budget_min?: number;
  budget_max?: number;
  required_skills: string[];
  similarity_score: number;
  compatibility_score: number;
  skill_match_score: number;
  budget_match_score: number;
  matching_skills: string[];
  complexity_score: number;
}

interface ProjectMatchesProps {
  freelancerId: string;
  limit?: number;
  minSimilarity?: number;
  statusFilter?: string;
  className?: string;
}

export const ProjectMatches: React.FC<ProjectMatchesProps> = ({
  freelancerId,
  limit = 10,
  minSimilarity = 0.3,
  statusFilter,
  className = ''
}) => {
  const [matches, setMatches] = useState<ProjectMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: limit.toString(),
        min_similarity: minSimilarity.toString(),
      });

      if (statusFilter) {
        params.append('status_filter', statusFilter);
      }

      const response = await fetch(
        `/api/v1/ai/matching/freelancers/${freelancerId}/projects?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch project matches: ${response.statusText}`);
      }

      const data = await response.json();
      setMatches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project matches');
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
    if (freelancerId) {
      fetchMatches();
    }
  }, [freelancerId, limit, minSimilarity, statusFilter]);

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

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return 'Budget not specified';
    if (min && max && min !== max) {
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    }
    const amount = min || max || 0;
    return `$${amount.toLocaleString()}`;
  };

  const getComplexityLabel = (score: number) => {
    if (score >= 0.8) return 'Expert';
    if (score >= 0.6) return 'Intermediate';
    if (score >= 0.3) return 'Beginner';
    return 'Entry Level';
  };

  const getComplexityColor = (score: number) => {
    if (score >= 0.8) return 'text-purple-600';
    if (score >= 0.6) return 'text-blue-600';
    if (score >= 0.3) return 'text-green-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            AI-Recommended Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Finding perfect projects for your skills...</span>
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
            AI-Recommended Projects
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
            AI-Recommended Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No matching projects found</p>
            <p className="text-sm text-gray-400">
              Try updating your skills profile or adjusting the search criteria
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
            AI-Recommended Projects
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
          Personalized project recommendations based on your skills and preferences
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {matches.map((match, index) => (
            <div
              key={match.project_id}
              className="p-6 border rounded-lg hover:shadow-md transition-all hover:border-blue-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {match.project_title}
                    </h3>
                    <Badge variant={getScoreBadgeVariant(match.similarity_score)}>
                      {Math.round(match.similarity_score * 100)}% match
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {match.client_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {formatBudget(match.budget_min, match.budget_max)}
                    </span>
                    <span className={`flex items-center gap-1 ${getComplexityColor(match.complexity_score)}`}>
                      <Calendar className="h-4 w-4" />
                      {getComplexityLabel(match.complexity_score)} Level
                    </span>
                  </div>
                  
                  <p className="text-gray-700 text-sm line-clamp-3 mb-4">
                    {match.project_description}
                  </p>
                </div>
              </div>

              {/* Skills */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {match.required_skills.slice(0, 6).map((skill) => (
                    <Badge 
                      key={skill} 
                      variant={match.matching_skills?.includes(skill) ? "default" : "outline"}
                      className="text-xs"
                    >
                      {skill}
                      {match.matching_skills?.includes(skill) && (
                        <span className="ml-1">✓</span>
                      )}
                    </Badge>
                  ))}
                  {match.required_skills.length > 6 && (
                    <Badge variant="outline" className="text-xs">
                      +{match.required_skills.length - 6} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Match Scores */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">Skill Match</span>
                    <span className={`font-medium ${getScoreColor(match.skill_match_score)}`}>
                      {Math.round(match.skill_match_score * 100)}%
                    </span>
                  </div>
                  <Progress value={match.skill_match_score * 100} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">Budget Match</span>
                    <span className={`font-medium ${getScoreColor(match.budget_match_score)}`}>
                      {Math.round(match.budget_match_score * 100)}%
                    </span>
                  </div>
                  <Progress value={match.budget_match_score * 100} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">Compatibility</span>
                    <span className={`font-medium ${getScoreColor(match.compatibility_score)}`}>
                      {Math.round(match.compatibility_score * 100)}%
                    </span>
                  </div>
                  <Progress value={match.compatibility_score * 100} className="h-2" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  AI Analysis · Rank #{index + 1}
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/projects/${match.project_id}`}>
                      View Details
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/projects/${match.project_id}/bid`}>
                      Submit Bid
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {matches.length >= limit && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-2">
              Showing top {limit} recommendations
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Load More Projects
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectMatches;
