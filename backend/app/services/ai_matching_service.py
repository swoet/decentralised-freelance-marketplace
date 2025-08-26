"""AI-powered matching service for projects and freelancers."""

import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc

from app.core.config import settings
from app.models.matching import ProjectEmbedding, FreelancerProfile, MatchingResult
from app.models.project import Project
from app.models.user import User
from app.models.skills import Skill

logger = logging.getLogger(__name__)


class AIMatchingService:
    """Service for AI-powered project-freelancer matching."""
    
    def __init__(self):
        self.model = None
        self.embedding_version = "1.0"
        self._load_model()
    
    def _load_model(self):
        """Load the sentence transformer model."""
        try:
            if settings.AI_MATCHING_ENABLED:
                self.model = SentenceTransformer(settings.EMBEDDING_MODEL)
                logger.info(f"Loaded embedding model: {settings.EMBEDDING_MODEL}")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            self.model = None
    
    def generate_project_embedding(self, db: Session, project: Project) -> Optional[ProjectEmbedding]:
        """Generate and store embedding for a project."""
        if not self.model or not settings.AI_MATCHING_ENABLED:
            return None
        
        try:
            # Prepare text for embedding
            text_parts = [
                project.title or "",
                project.description or "",
            ]
            
            # Add skills if available
            if project.skills_required:
                skills_text = " ".join(project.skills_required)
                text_parts.append(f"Skills: {skills_text}")
            
            # Combine text
            combined_text = " ".join(filter(None, text_parts))
            
            # Generate embedding
            embedding = self.model.encode(combined_text).tolist()
            
            # Calculate complexity score based on description length, skills count, etc.
            complexity_score = self._calculate_project_complexity(project)
            
            # Check if embedding already exists
            existing = db.query(ProjectEmbedding).filter(
                ProjectEmbedding.project_id == project.id
            ).first()
            
            if existing:
                # Update existing embedding
                existing.embedding_vector = embedding
                existing.embedding_model = settings.EMBEDDING_MODEL
                existing.embedding_version = self.embedding_version
                existing.title = project.title
                existing.description = project.description
                existing.skills_required = project.skills_required
                existing.budget_min = getattr(project, 'budget_min', None)
                existing.budget_max = getattr(project, 'budget_max', None)
                existing.duration_days = getattr(project, 'duration_days', None)
                existing.complexity_score = complexity_score
                existing.updated_at = datetime.utcnow()
                db.commit()
                return existing
            else:
                # Create new embedding
                project_embedding = ProjectEmbedding(
                    project_id=project.id,
                    embedding_vector=embedding,
                    embedding_model=settings.EMBEDDING_MODEL,
                    embedding_version=self.embedding_version,
                    title=project.title,
                    description=project.description,
                    skills_required=project.skills_required,
                    budget_min=getattr(project, 'budget_min', None),
                    budget_max=getattr(project, 'budget_max', None),
                    duration_days=getattr(project, 'duration_days', None),
                    complexity_score=complexity_score
                )
                db.add(project_embedding)
                db.commit()
                return project_embedding
                
        except Exception as e:
            logger.error(f"Failed to generate project embedding: {e}")
            return None
    
    def generate_freelancer_embedding(self, db: Session, user: User) -> Optional[FreelancerProfile]:
        """Generate and store embedding for a freelancer profile."""
        if not self.model or not settings.AI_MATCHING_ENABLED:
            return None
        
        try:
            # Prepare text for embedding
            text_parts = []
            
            # Add bio if available
            if hasattr(user, 'bio') and user.bio:
                text_parts.append(user.bio)
            
            # Add skills from user's skill associations
            user_skills = db.query(Skill).join(
                # Assuming there's a user_skills association table
                # This would need to be adjusted based on actual schema
            ).filter_by(user_id=user.id).all()
            
            if user_skills:
                skills_text = " ".join([skill.name for skill in user_skills])
                text_parts.append(f"Skills: {skills_text}")
            
            # Combine text
            combined_text = " ".join(filter(None, text_parts)) or f"User profile for {user.email}"
            
            # Generate embedding
            embedding = self.model.encode(combined_text).tolist()
            
            # Check if profile already exists
            existing = db.query(FreelancerProfile).filter(
                FreelancerProfile.user_id == user.id
            ).first()
            
            if existing:
                # Update existing profile
                existing.embedding_vector = embedding
                existing.embedding_model = settings.EMBEDDING_MODEL
                existing.embedding_version = self.embedding_version
                existing.bio = getattr(user, 'bio', None)
                existing.skills = [skill.name for skill in user_skills]
                existing.updated_at = datetime.utcnow()
                db.commit()
                return existing
            else:
                # Create new profile
                freelancer_profile = FreelancerProfile(
                    user_id=user.id,
                    embedding_vector=embedding,
                    embedding_model=settings.EMBEDDING_MODEL,
                    embedding_version=self.embedding_version,
                    bio=getattr(user, 'bio', None),
                    skills=[skill.name for skill in user_skills]
                )
                db.add(freelancer_profile)
                db.commit()
                return freelancer_profile
                
        except Exception as e:
            logger.error(f"Failed to generate freelancer embedding: {e}")
            return None
    
    def find_matching_freelancers(
        self, 
        db: Session, 
        project_id: str, 
        limit: int = 20,
        min_similarity: float = 0.3
    ) -> List[Dict]:
        """Find matching freelancers for a project using AI similarity."""
        if not self.model or not settings.AI_MATCHING_ENABLED:
            return []
        
        try:
            # Get project embedding
            project_embedding = db.query(ProjectEmbedding).filter(
                ProjectEmbedding.project_id == project_id
            ).first()
            
            if not project_embedding:
                logger.warning(f"No embedding found for project {project_id}")
                return []
            
            # Check for cached results
            cache_cutoff = datetime.utcnow() - timedelta(seconds=settings.MATCHING_CACHE_TTL)
            cached_results = db.query(MatchingResult).filter(
                and_(
                    MatchingResult.project_id == project_id,
                    MatchingResult.created_at > cache_cutoff,
                    MatchingResult.expires_at > datetime.utcnow()
                )
            ).order_by(desc(MatchingResult.compatibility_score)).limit(limit).all()
            
            if cached_results:
                logger.info(f"Using cached matching results for project {project_id}")
                return self._format_matching_results(cached_results)
            
            # Get all freelancer profiles
            freelancer_profiles = db.query(FreelancerProfile).all()
            
            if not freelancer_profiles:
                logger.warning("No freelancer profiles found for matching")
                return []
            
            # Calculate similarities
            project_vector = np.array(project_embedding.embedding_vector).reshape(1, -1)
            matches = []
            
            for profile in freelancer_profiles:
                freelancer_vector = np.array(profile.embedding_vector).reshape(1, -1)
                similarity = cosine_similarity(project_vector, freelancer_vector)[0][0]
                
                if similarity >= min_similarity:
                    # Calculate additional compatibility scores
                    budget_score = self._calculate_budget_compatibility(
                        project_embedding, profile
                    )
                    skill_score = self._calculate_skill_compatibility(
                        project_embedding, profile
                    )
                    
                    # Overall compatibility score
                    compatibility_score = (
                        similarity * 0.4 +
                        budget_score * 0.3 +
                        skill_score * 0.3
                    )
                    
                    matches.append({
                        'freelancer_id': profile.user_id,
                        'similarity_score': float(similarity),
                        'budget_match_score': float(budget_score),
                        'skill_match_score': float(skill_score),
                        'compatibility_score': float(compatibility_score),
                        'profile': profile
                    })
            
            # Sort by compatibility score
            matches.sort(key=lambda x: x['compatibility_score'], reverse=True)
            matches = matches[:limit]
            
            # Cache results
            self._cache_matching_results(db, project_id, matches)
            
            return self._format_matching_results_from_dict(matches)
            
        except Exception as e:
            logger.error(f"Failed to find matching freelancers: {e}")
            return []
    
    def find_matching_projects(
        self,
        db: Session,
        freelancer_id: str,
        limit: int = 20,
        min_similarity: float = 0.3
    ) -> List[Dict]:
        """Find matching projects for a freelancer using AI similarity."""
        if not self.model or not settings.AI_MATCHING_ENABLED:
            return []
        
        try:
            # Get freelancer profile
            freelancer_profile = db.query(FreelancerProfile).filter(
                FreelancerProfile.user_id == freelancer_id
            ).first()
            
            if not freelancer_profile:
                logger.warning(f"No profile found for freelancer {freelancer_id}")
                return []
            
            # Get active project embeddings
            project_embeddings = db.query(ProjectEmbedding).join(Project).filter(
                Project.status.in_(['open', 'active'])
            ).all()
            
            if not project_embeddings:
                return []
            
            # Calculate similarities
            freelancer_vector = np.array(freelancer_profile.embedding_vector).reshape(1, -1)
            matches = []
            
            for proj_embedding in project_embeddings:
                project_vector = np.array(proj_embedding.embedding_vector).reshape(1, -1)
                similarity = cosine_similarity(freelancer_vector, project_vector)[0][0]
                
                if similarity >= min_similarity:
                    # Calculate additional compatibility scores
                    budget_score = self._calculate_budget_compatibility(
                        proj_embedding, freelancer_profile
                    )
                    skill_score = self._calculate_skill_compatibility(
                        proj_embedding, freelancer_profile
                    )
                    
                    # Overall compatibility score
                    compatibility_score = (
                        similarity * 0.4 +
                        budget_score * 0.3 +
                        skill_score * 0.3
                    )
                    
                    matches.append({
                        'project_id': proj_embedding.project_id,
                        'similarity_score': float(similarity),
                        'budget_match_score': float(budget_score),
                        'skill_match_score': float(skill_score),
                        'compatibility_score': float(compatibility_score),
                        'project_embedding': proj_embedding
                    })
            
            # Sort by compatibility score
            matches.sort(key=lambda x: x['compatibility_score'], reverse=True)
            return matches[:limit]
            
        except Exception as e:
            logger.error(f"Failed to find matching projects: {e}")
            return []
    
    def _calculate_project_complexity(self, project: Project) -> float:
        """Calculate project complexity score (0-1)."""
        complexity = 0.0
        
        # Description length factor
        if project.description:
            desc_length = len(project.description)
            complexity += min(desc_length / 1000, 0.3)  # Max 0.3 for description
        
        # Skills count factor
        if project.skills_required:
            skills_count = len(project.skills_required)
            complexity += min(skills_count / 10, 0.3)  # Max 0.3 for skills
        
        # Budget factor (higher budget = higher complexity)
        if hasattr(project, 'budget_max') and project.budget_max:
            budget_factor = min(project.budget_max / 10000, 0.4)  # Max 0.4 for budget
            complexity += budget_factor
        
        return min(complexity, 1.0)
    
    def _calculate_budget_compatibility(
        self, 
        project_embedding: ProjectEmbedding, 
        freelancer_profile: FreelancerProfile
    ) -> float:
        """Calculate budget compatibility score (0-1)."""
        if not project_embedding.budget_min or not freelancer_profile.preferred_budget_min:
            return 0.5  # Neutral score if budget info missing
        
        # Check if budgets overlap
        proj_min = project_embedding.budget_min or 0
        proj_max = project_embedding.budget_max or float('inf')
        freelancer_min = freelancer_profile.preferred_budget_min or 0
        freelancer_max = freelancer_profile.preferred_budget_max or float('inf')
        
        # Calculate overlap
        overlap_min = max(proj_min, freelancer_min)
        overlap_max = min(proj_max, freelancer_max)
        
        if overlap_max >= overlap_min:
            # There's an overlap - calculate how good it is
            proj_range = proj_max - proj_min
            overlap_range = overlap_max - overlap_min
            
            if proj_range > 0:
                return min(overlap_range / proj_range, 1.0)
            else:
                return 1.0  # Perfect match if single budget point
        else:
            return 0.1  # No overlap
    
    def _calculate_skill_compatibility(
        self,
        project_embedding: ProjectEmbedding,
        freelancer_profile: FreelancerProfile
    ) -> float:
        """Calculate skill compatibility score (0-1)."""
        if not project_embedding.skills_required or not freelancer_profile.skills:
            return 0.5  # Neutral score if skills info missing
        
        project_skills = set(project_embedding.skills_required)
        freelancer_skills = set(freelancer_profile.skills)
        
        # Calculate Jaccard similarity
        intersection = len(project_skills.intersection(freelancer_skills))
        union = len(project_skills.union(freelancer_skills))
        
        if union > 0:
            return intersection / union
        else:
            return 0.0
    
    def _cache_matching_results(self, db: Session, project_id: str, matches: List[Dict]):
        """Cache matching results for faster subsequent queries."""
        try:
            # Clear old cache entries for this project
            db.query(MatchingResult).filter(
                MatchingResult.project_id == project_id
            ).delete()
            
            # Create new cache entries
            expires_at = datetime.utcnow() + timedelta(seconds=settings.MATCHING_CACHE_TTL)
            
            for i, match in enumerate(matches):
                result = MatchingResult(
                    project_id=project_id,
                    freelancer_id=match['freelancer_id'],
                    similarity_score=match['similarity_score'],
                    compatibility_score=match['compatibility_score'],
                    budget_match_score=match['budget_match_score'],
                    skill_match_score=match['skill_match_score'],
                    rank_position=i + 1,
                    algorithm_version=self.embedding_version,
                    expires_at=expires_at
                )
                db.add(result)
            
            db.commit()
            
        except Exception as e:
            logger.error(f"Failed to cache matching results: {e}")
            db.rollback()
    
    def _format_matching_results(self, results: List[MatchingResult]) -> List[Dict]:
        """Format matching results for API response."""
        return [
            {
                'freelancer_id': str(result.freelancer_id),
                'similarity_score': result.similarity_score,
                'compatibility_score': result.compatibility_score,
                'budget_match_score': result.budget_match_score,
                'skill_match_score': result.skill_match_score,
                'rank_position': result.rank_position,
                'match_reasons': result.match_reasons or [],
                'skill_gaps': result.skill_gaps or []
            }
            for result in results
        ]
    
    def _format_matching_results_from_dict(self, matches: List[Dict]) -> List[Dict]:
        """Format matching results from dictionary format."""
        return [
            {
                'freelancer_id': str(match['freelancer_id']),
                'similarity_score': match['similarity_score'],
                'compatibility_score': match['compatibility_score'],
                'budget_match_score': match['budget_match_score'],
                'skill_match_score': match['skill_match_score'],
                'rank_position': i + 1
            }
            for i, match in enumerate(matches)
        ]
