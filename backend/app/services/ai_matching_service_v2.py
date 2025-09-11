"""
Stabilized AI-Powered Matching Service
Simplified version with proper error handling and field mapping
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
import numpy as np

try:
    from sentence_transformers import SentenceTransformer
    from sklearn.metrics.pairwise import cosine_similarity
    EMBEDDINGS_AVAILABLE = True
except ImportError:
    SentenceTransformer = None
    EMBEDDINGS_AVAILABLE = False

from ..models.matching import (
    ProjectEmbedding, FreelancerProfile, MatchingResult,
    ReputationScoreV2
)
from ..models.ai_matching import (
    PersonalityProfile, WorkPattern, CompatibilityScore
)
from ..models.user import User
from ..models.project import Project
from ..models.bid import Bid
from ..core.config import settings

logger = logging.getLogger(__name__)


class AIMatchingService:
    """Stabilized AI-Powered Smart Matching Service"""
    
    def __init__(self):
        self.embedding_model = None
        self.embedding_version = "2.0"
        self.is_initialized = False
        
        # Initialize sentence transformer if available
        if EMBEDDINGS_AVAILABLE and settings.AI_MATCHING_ENABLED:
            try:
                self.embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
                self.is_initialized = True
                logger.info(f"AI Matching initialized with model: {settings.EMBEDDING_MODEL}")
            except Exception as e:
                logger.warning(f"Failed to initialize embedding model: {e}")
                self.is_initialized = False
        else:
            logger.info("AI Matching running without embeddings (sentence-transformers not available)")
    
    def generate_project_embedding(self, db: Session, project: Project) -> Optional[ProjectEmbedding]:
        """Generate and store embedding for a project"""
        if not self.embedding_model:
            logger.debug("Embedding model not available, skipping embedding generation")
            return None
        
        try:
            # Prepare text for embedding
            text_parts = []
            
            if project.title:
                text_parts.append(project.title)
            
            if project.description:
                text_parts.append(project.description)
            
            # Extract skills from project metadata if available
            skills = []
            if project.project_metadata and isinstance(project.project_metadata, dict):
                skills = project.project_metadata.get('required_skills', [])
                if skills:
                    text_parts.append(f"Required skills: {', '.join(skills)}")
            
            # Combine text
            combined_text = " ".join(text_parts) if text_parts else f"Project: {project.title}"
            
            # Generate embedding
            embedding = self.embedding_model.encode(combined_text).tolist()
            
            # Check if embedding already exists
            existing = db.query(ProjectEmbedding).filter(
                ProjectEmbedding.project_id == project.id
            ).first()
            
            if existing:
                # Update existing
                existing.embedding_vector = embedding
                existing.embedding_model = settings.EMBEDDING_MODEL
                existing.embedding_version = self.embedding_version
                existing.title = project.title
                existing.description = project.description
                existing.skills_required = skills
                existing.budget_min = float(project.budget_min) if project.budget_min else None
                existing.budget_max = float(project.budget_max) if project.budget_max else None
                existing.complexity_score = self._calculate_project_complexity(project)
                existing.updated_at = datetime.utcnow()
                
                db.commit()
                return existing
            else:
                # Create new
                project_embedding = ProjectEmbedding(
                    project_id=project.id,
                    embedding_vector=embedding,
                    embedding_model=settings.EMBEDDING_MODEL,
                    embedding_version=self.embedding_version,
                    title=project.title,
                    description=project.description,
                    skills_required=skills,
                    budget_min=float(project.budget_min) if project.budget_min else None,
                    budget_max=float(project.budget_max) if project.budget_max else None,
                    complexity_score=self._calculate_project_complexity(project)
                )
                
                db.add(project_embedding)
                db.commit()
                db.refresh(project_embedding)
                return project_embedding
                
        except Exception as e:
            logger.error(f"Failed to generate project embedding for {project.id}: {e}")
            return None
    
    def generate_freelancer_embedding(self, db: Session, user: User) -> Optional[FreelancerProfile]:
        """Generate and store embedding for a freelancer"""
        if not self.embedding_model:
            logger.debug("Embedding model not available, skipping freelancer embedding generation")
            return None
        
        if user.role != 'freelancer':
            logger.debug(f"User {user.id} is not a freelancer, skipping embedding generation")
            return None
        
        try:
            # Prepare text for embedding
            text_parts = []
            
            if user.bio:
                text_parts.append(user.bio)
            
            if user.skills:
                text_parts.append(f"Skills: {', '.join(user.skills)}")
            
            # Add recent bid proposals for context
            recent_bids = db.query(Bid).filter(
                Bid.freelancer_id == user.id
            ).order_by(desc(Bid.created_at)).limit(5).all()
            
            for bid in recent_bids:
                if hasattr(bid, 'proposal_text') and bid.proposal_text:
                    text_parts.append(bid.proposal_text[:200])  # First 200 chars
            
            # Combine text
            combined_text = " ".join(text_parts) if text_parts else f"Freelancer profile for {user.full_name or user.email}"
            
            # Generate embedding
            embedding = self.embedding_model.encode(combined_text).tolist()
            
            # Check if profile already exists
            existing = db.query(FreelancerProfile).filter(
                FreelancerProfile.user_id == user.id
            ).first()
            
            if existing:
                # Update existing
                existing.embedding_vector = embedding
                existing.embedding_model = settings.EMBEDDING_MODEL
                existing.embedding_version = self.embedding_version
                existing.bio = user.bio
                existing.skills = user.skills
                existing.updated_at = datetime.utcnow()
                
                db.commit()
                return existing
            else:
                # Create new
                freelancer_profile = FreelancerProfile(
                    user_id=user.id,
                    embedding_vector=embedding,
                    embedding_model=settings.EMBEDDING_MODEL,
                    embedding_version=self.embedding_version,
                    bio=user.bio,
                    skills=user.skills
                )
                
                db.add(freelancer_profile)
                db.commit()
                db.refresh(freelancer_profile)
                return freelancer_profile
                
        except Exception as e:
            logger.error(f"Failed to generate freelancer embedding for {user.id}: {e}")
            return None
    
    def find_matching_freelancers(
        self, 
        db: Session, 
        project_id: str, 
        limit: int = 10,
        min_similarity: float = 0.3
    ) -> List[Dict[str, Any]]:
        """Find best matching freelancers for a project"""
        
        try:
            project = db.query(Project).filter(Project.id == project_id).first()
            if not project:
                logger.warning(f"Project {project_id} not found")
                return []
            
            # Generate project embedding if it doesn't exist
            project_embedding = self.generate_project_embedding(db, project)
            
            if not project_embedding or not self.embedding_model:
                logger.info("Falling back to basic skill matching")
                return self._fallback_skill_matching(db, project, limit)
            
            # Check for cached results first
            cache_cutoff = datetime.utcnow() - timedelta(seconds=settings.MATCHING_CACHE_TTL)
            cached_results = db.query(MatchingResult).filter(
                and_(
                    MatchingResult.project_id == project_id,
                    MatchingResult.created_at > cache_cutoff,
                    MatchingResult.expires_at > datetime.utcnow()
                )
            ).order_by(desc(MatchingResult.compatibility_score)).limit(limit).all()
            
            if cached_results:
                logger.info(f"Using cached results for project {project_id}")
                return self._format_cached_results(db, cached_results)
            
            # Get all freelancer profiles
            freelancer_profiles = db.query(FreelancerProfile).all()
            
            if not freelancer_profiles:
                logger.warning("No freelancer profiles found")
                return self._fallback_skill_matching(db, project, limit)
            
            # Calculate similarities using embeddings
            project_vector = np.array(project_embedding.embedding_vector).reshape(1, -1)
            matches = []
            
            for profile in freelancer_profiles:
                try:
                    freelancer_vector = np.array(profile.embedding_vector).reshape(1, -1)
                    similarity = cosine_similarity(project_vector, freelancer_vector)[0][0]
                    
                    if similarity >= min_similarity:
                        # Calculate additional scores
                        budget_score = self._calculate_budget_compatibility(project_embedding, profile)
                        skill_score = self._calculate_skill_compatibility(project_embedding, profile)
                        
                        # Overall compatibility
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
                
                except Exception as e:
                    logger.warning(f"Error calculating similarity for profile {profile.user_id}: {e}")
                    continue
            
            # Sort by compatibility
            matches.sort(key=lambda x: x['compatibility_score'], reverse=True)
            matches = matches[:limit]
            
            # Cache results
            self._cache_matching_results(db, project_id, matches)
            
            # Format results
            return self._format_embedding_results(db, matches)
            
        except Exception as e:
            logger.error(f"Error in find_matching_freelancers: {e}")
            return self._fallback_skill_matching(db, project, limit)
    
    def find_matching_projects(
        self,
        db: Session,
        freelancer_id: str,
        limit: int = 10,
        min_similarity: float = 0.3
    ) -> List[Dict[str, Any]]:
        """Find matching projects for a freelancer"""
        
        try:
            freelancer = db.query(User).filter(User.id == freelancer_id).first()
            if not freelancer or freelancer.role != 'freelancer':
                logger.warning(f"Freelancer {freelancer_id} not found or not a freelancer")
                return []
            
            # Generate freelancer embedding if it doesn't exist
            freelancer_profile = self.generate_freelancer_embedding(db, freelancer)
            
            if not freelancer_profile or not self.embedding_model:
                logger.info("Falling back to basic skill matching for projects")
                return self._fallback_project_matching(db, freelancer, limit)
            
            # Get open project embeddings
            project_embeddings = db.query(ProjectEmbedding).join(Project).filter(
                Project.status.in_(['open'])
            ).all()
            
            if not project_embeddings:
                return []
            
            # Calculate similarities
            freelancer_vector = np.array(freelancer_profile.embedding_vector).reshape(1, -1)
            matches = []
            
            for proj_embedding in project_embeddings:
                try:
                    project_vector = np.array(proj_embedding.embedding_vector).reshape(1, -1)
                    similarity = cosine_similarity(freelancer_vector, project_vector)[0][0]
                    
                    if similarity >= min_similarity:
                        budget_score = self._calculate_budget_compatibility(proj_embedding, freelancer_profile)
                        skill_score = self._calculate_skill_compatibility(proj_embedding, freelancer_profile)
                        
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
                
                except Exception as e:
                    logger.warning(f"Error calculating similarity for project {proj_embedding.project_id}: {e}")
                    continue
            
            # Sort and return
            matches.sort(key=lambda x: x['compatibility_score'], reverse=True)
            return matches[:limit]
            
        except Exception as e:
            logger.error(f"Error in find_matching_projects: {e}")
            return []
    
    def _calculate_project_complexity(self, project: Project) -> float:
        """Calculate project complexity score (0-1)"""
        complexity = 0.0
        
        # Description length
        if project.description:
            complexity += min(len(project.description) / 1000, 0.3)
        
        # Skills count
        if project.project_metadata and isinstance(project.project_metadata, dict):
            skills = project.project_metadata.get('required_skills', [])
            complexity += min(len(skills) / 10, 0.3)
        
        # Budget factor
        if project.budget_max:
            complexity += min(float(project.budget_max) / 10000, 0.4)
        
        return min(complexity, 1.0)
    
    def _calculate_budget_compatibility(self, project_embedding: ProjectEmbedding, freelancer_profile: FreelancerProfile) -> float:
        """Calculate budget compatibility (0-1)"""
        if not project_embedding.budget_min or not freelancer_profile.preferred_budget_min:
            return 0.5
        
        proj_min = project_embedding.budget_min or 0
        proj_max = project_embedding.budget_max or float('inf')
        freelancer_min = freelancer_profile.preferred_budget_min or 0
        freelancer_max = freelancer_profile.preferred_budget_max or float('inf')
        
        overlap_min = max(proj_min, freelancer_min)
        overlap_max = min(proj_max, freelancer_max)
        
        if overlap_max >= overlap_min:
            proj_range = proj_max - proj_min
            if proj_range > 0:
                overlap_range = overlap_max - overlap_min
                return min(overlap_range / proj_range, 1.0)
            else:
                return 1.0
        else:
            return 0.1
    
    def _calculate_skill_compatibility(self, project_embedding: ProjectEmbedding, freelancer_profile: FreelancerProfile) -> float:
        """Calculate skill compatibility (0-1)"""
        if not project_embedding.skills_required or not freelancer_profile.skills:
            return 0.5
        
        project_skills = set(project_embedding.skills_required)
        freelancer_skills = set(freelancer_profile.skills)
        
        intersection = len(project_skills.intersection(freelancer_skills))
        union = len(project_skills.union(freelancer_skills))
        
        return intersection / union if union > 0 else 0.0
    
    def _fallback_skill_matching(self, db: Session, project: Project, limit: int) -> List[Dict[str, Any]]:
        """Fallback to basic skill matching when embeddings aren't available"""
        
        # Extract project skills
        project_skills = []
        if project.project_metadata and isinstance(project.project_metadata, dict):
            project_skills = project.project_metadata.get('required_skills', [])
        
        # Get all freelancers
        freelancers = db.query(User).filter(User.role == 'freelancer').all()
        
        matches = []
        for freelancer in freelancers:
            if not freelancer.skills:
                continue
            
            # Calculate skill overlap
            freelancer_skills = set(freelancer.skills)
            project_skill_set = set(project_skills)
            
            if not project_skill_set:
                skill_score = 0.5  # Neutral when no specific skills required
            else:
                intersection = len(freelancer_skills.intersection(project_skill_set))
                skill_score = intersection / len(project_skill_set)
            
            if skill_score > 0.1:  # Only include if some relevance
                matches.append({
                    'freelancer_id': str(freelancer.id),
                    'freelancer': freelancer,
                    'similarity_score': skill_score,
                    'skill_match_score': skill_score,
                    'compatibility_score': skill_score,
                    'budget_match_score': 0.5,
                    'matching_skills': list(freelancer_skills.intersection(project_skill_set))
                })
        
        # Sort and return
        matches.sort(key=lambda x: x['compatibility_score'], reverse=True)
        return matches[:limit]
    
    def _fallback_project_matching(self, db: Session, freelancer: User, limit: int) -> List[Dict[str, Any]]:
        """Fallback project matching when embeddings aren't available"""
        
        if not freelancer.skills:
            return []
        
        freelancer_skills = set(freelancer.skills)
        
        # Get open projects
        projects = db.query(Project).filter(Project.status == 'open').all()
        
        matches = []
        for project in projects:
            project_skills = []
            if project.project_metadata and isinstance(project.project_metadata, dict):
                project_skills = project.project_metadata.get('required_skills', [])
            
            project_skill_set = set(project_skills)
            
            if not project_skill_set:
                skill_score = 0.5
            else:
                intersection = len(freelancer_skills.intersection(project_skill_set))
                skill_score = intersection / len(project_skill_set)
            
            if skill_score > 0.1:
                matches.append({
                    'project_id': str(project.id),
                    'project': project,
                    'similarity_score': skill_score,
                    'skill_match_score': skill_score,
                    'compatibility_score': skill_score,
                    'budget_match_score': 0.5
                })
        
        matches.sort(key=lambda x: x['compatibility_score'], reverse=True)
        return matches[:limit]
    
    def _cache_matching_results(self, db: Session, project_id: str, matches: List[Dict]):
        """Cache matching results"""
        try:
            # Clear old cache
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
            logger.error(f"Failed to cache results: {e}")
            db.rollback()
    
    def _format_cached_results(self, db: Session, cached_results: List[MatchingResult]) -> List[Dict[str, Any]]:
        """Format cached results for response"""
        results = []
        for result in cached_results:
            freelancer = db.query(User).filter(User.id == result.freelancer_id).first()
            if freelancer:
                results.append({
                    'freelancer_id': str(result.freelancer_id),
                    'freelancer': freelancer,
                    'similarity_score': result.similarity_score,
                    'compatibility_score': result.compatibility_score,
                    'budget_match_score': result.budget_match_score,
                    'skill_match_score': result.skill_match_score,
                    'rank_position': result.rank_position,
                    'cached': True
                })
        return results
    
    def _format_embedding_results(self, db: Session, matches: List[Dict]) -> List[Dict[str, Any]]:
        """Format embedding-based results"""
        results = []
        for match in matches:
            freelancer = db.query(User).filter(User.id == match['freelancer_id']).first()
            if freelancer:
                results.append({
                    'freelancer_id': str(match['freelancer_id']),
                    'freelancer': freelancer,
                    'similarity_score': match['similarity_score'],
                    'compatibility_score': match['compatibility_score'],
                    'budget_match_score': match['budget_match_score'],
                    'skill_match_score': match['skill_match_score'],
                    'cached': False
                })
        return results


# Global instance
ai_matching_service = AIMatchingService()
