"""AI-Powered Smart Matching Service - Tier 1 Revolutionary Implementation"""

import asyncio
import json
import hashlib
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timezone, timedelta
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.models.ai_matching import (
    PersonalityProfile, WorkPattern, CompatibilityScore, 
    SkillDemandPrediction, MatchingQueueItem
)
from app.models.user import User
from app.models.project import Project
from app.models.bid import Bid
from app.core.config import settings
import re
import logging

logger = logging.getLogger(__name__)


class PersonalityAnalyzer:
    """Analyzes personality traits from text and behavior patterns"""
    
    def __init__(self):
        # Personality indicators (simplified for demo - in production use advanced NLP models)
        self.personality_indicators = {
            'openness': {
                'high': ['creative', 'innovative', 'artistic', 'imaginative', 'experimental', 'novel'],
                'low': ['traditional', 'conventional', 'practical', 'routine', 'standard']
            },
            'conscientiousness': {
                'high': ['organized', 'planned', 'detailed', 'systematic', 'methodical', 'thorough'],
                'low': ['flexible', 'spontaneous', 'casual', 'adaptive', 'informal']
            },
            'extraversion': {
                'high': ['collaborative', 'team', 'communication', 'presentation', 'social', 'networking'],
                'low': ['independent', 'focused', 'analytical', 'research', 'individual', 'quiet']
            },
            'agreeableness': {
                'high': ['cooperative', 'supportive', 'helpful', 'understanding', 'diplomatic'],
                'low': ['competitive', 'direct', 'challenging', 'critical', 'assertive']
            },
            'neuroticism': {
                'high': ['urgent', 'pressure', 'stress', 'concern', 'worry', 'issue'],
                'low': ['calm', 'stable', 'consistent', 'reliable', 'steady', 'composed']
            }
        }
    
    async def analyze_text_personality(self, texts: List[str]) -> Dict[str, float]:
        """Analyze personality from text samples"""
        if not texts:
            return self._default_personality_scores()
        
        # Combine all texts
        combined_text = ' '.join(texts).lower()
        
        personality_scores = {}
        
        for trait, indicators in self.personality_indicators.items():
            high_count = sum(combined_text.count(word) for word in indicators['high'])
            low_count = sum(combined_text.count(word) for word in indicators['low'])
            
            # Calculate score (0-100 scale)
            total_indicators = high_count + low_count
            if total_indicators == 0:
                score = 50.0  # Neutral
            else:
                score = ((high_count / total_indicators) * 100)
            
            personality_scores[trait] = min(100.0, max(0.0, score))
        
        return personality_scores
    
    def _default_personality_scores(self) -> Dict[str, float]:
        """Return default neutral personality scores"""
        return {
            'openness': 50.0,
            'conscientiousness': 50.0,
            'extraversion': 50.0,
            'agreeableness': 50.0,
            'neuroticism': 50.0
        }


class AIMatchingService:
    """Revolutionary AI-Powered Smart Matching Service with Personality & Work Pattern Analysis"""
    
    def __init__(self):
        self.personality_analyzer = PersonalityAnalyzer()
        self.compatibility_weights = {
            'personality_match': 0.20,
            'work_style_match': 0.25,
            'skill_technical_match': 0.30,
            'communication_match': 0.15,
            'schedule_compatibility': 0.10
        }
    
    async def analyze_user_personality(self, user_id: str, db: Session) -> PersonalityProfile:
        """Analyze and store user personality profile using AI"""
        
        # Get existing profile or create new one
        profile = db.query(PersonalityProfile).filter(
            PersonalityProfile.user_id == user_id
        ).first()
        
        if not profile:
            profile = PersonalityProfile(user_id=user_id)
            db.add(profile)
        
        # Gather text samples for analysis
        text_samples = await self._gather_user_text_samples(user_id, db)
        
        # Analyze personality from text
        personality_scores = await self.personality_analyzer.analyze_text_personality(text_samples)
        
        # Update profile
        profile.openness = personality_scores.get('openness', 50.0)
        profile.conscientiousness = personality_scores.get('conscientiousness', 50.0)
        profile.extraversion = personality_scores.get('extraversion', 50.0)
        profile.agreeableness = personality_scores.get('agreeableness', 50.0)
        profile.neuroticism = personality_scores.get('neuroticism', 50.0)
        
        profile.text_analysis_count = len(text_samples)
        profile.data_points_analyzed = len(text_samples)
        profile.analysis_confidence = min(1.0, len(text_samples) / 20)
        profile.last_analysis = datetime.now(timezone.utc)
        profile.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(profile)
        
        logger.info(f"Analyzed personality for user {user_id}: confidence {profile.analysis_confidence}")
        return profile
    
    async def calculate_smart_compatibility(
        self, 
        freelancer_id: str, 
        project_id: str, 
        db: Session
    ) -> CompatibilityScore:
        """Calculate revolutionary compatibility score using AI analysis"""
        
        # Get project details
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError("Project not found")
        
        client_id = project.client_id
        
        # Get personality profiles
        freelancer_personality = db.query(PersonalityProfile).filter(
            PersonalityProfile.user_id == freelancer_id
        ).first()
        
        client_personality = db.query(PersonalityProfile).filter(
            PersonalityProfile.user_id == client_id
        ).first()
        
        # Get work patterns
        freelancer_pattern = db.query(WorkPattern).filter(
            WorkPattern.user_id == freelancer_id
        ).first()
        
        # Calculate compatibility dimensions
        personality_match = await self._calculate_personality_match(
            freelancer_personality, client_personality
        )
        
        skill_match = await self._calculate_skill_match(
            freelancer_id, project_id, db
        )
        
        work_style_match = await self._calculate_work_style_match(
            freelancer_pattern, project, db
        )
        
        communication_match = await self._calculate_communication_match(
            freelancer_personality, client_personality
        )
        
        schedule_compatibility = await self._calculate_schedule_compatibility(
            freelancer_personality, client_personality
        )
        
        # Calculate overall compatibility
        overall_compatibility = (
            personality_match * self.compatibility_weights['personality_match'] +
            work_style_match * self.compatibility_weights['work_style_match'] +
            skill_match * self.compatibility_weights['skill_technical_match'] +
            communication_match * self.compatibility_weights['communication_match'] +
            schedule_compatibility * self.compatibility_weights['schedule_compatibility']
        )
        
        # Predict success metrics
        predicted_success = self._predict_project_success(
            overall_compatibility, freelancer_pattern
        )
        
        predicted_satisfaction = self._predict_satisfaction(
            overall_compatibility, communication_match
        )
        
        risk_score = self._assess_project_risk(
            freelancer_pattern, overall_compatibility
        )
        
        # Create or update compatibility score
        score = db.query(CompatibilityScore).filter(
            and_(
                CompatibilityScore.freelancer_id == freelancer_id,
                CompatibilityScore.project_id == project_id
            )
        ).first()
        
        if not score:
            score = CompatibilityScore(
                freelancer_id=freelancer_id,
                client_id=client_id,
                project_id=project_id
            )
            db.add(score)
        
        # Update with calculated data
        score.overall_compatibility = overall_compatibility
        score.personality_match = personality_match
        score.work_style_match = work_style_match
        score.skill_technical_match = skill_match
        score.communication_match = communication_match
        score.schedule_compatibility = schedule_compatibility
        score.predicted_success_rate = predicted_success
        score.predicted_satisfaction_score = predicted_satisfaction
        score.risk_assessment_score = risk_score
        score.confidence_score = min(
            freelancer_personality.analysis_confidence if freelancer_personality else 0.5,
            client_personality.analysis_confidence if client_personality else 0.5
        )
        score.calculation_timestamp = datetime.now(timezone.utc)
        score.model_version = "2.0"  # Enhanced version
        
        db.commit()
        db.refresh(score)
        
        logger.info(f"Calculated compatibility: {overall_compatibility:.2f} for freelancer {freelancer_id} and project {project_id}")
        return score
    
    async def get_revolutionary_matches(
        self, 
        project_id: str, 
        db: Session, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get revolutionary AI-powered smart matches for a project"""
        
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return []
        
        # Get all freelancers
        freelancers = db.query(User).filter(User.role == 'freelancer').all()
        
        matches = []
        
        for freelancer in freelancers:
            try:
                # Ensure personality profile exists
                await self.analyze_user_personality(freelancer.id, db)
                
                # Calculate comprehensive compatibility
                compatibility = await self.calculate_smart_compatibility(
                    freelancer.id, project_id, db
                )
                
                match_data = {
                    'freelancer_id': freelancer.id,
                    'freelancer': {
                        'id': freelancer.id,
                        'full_name': freelancer.full_name,
                        'email': freelancer.email,
                        'skills': freelancer.skills,
                        'bio': freelancer.bio
                    },
                    'compatibility_score': compatibility.overall_compatibility,
                    'personality_match': compatibility.personality_match,
                    'skill_match': compatibility.skill_technical_match,
                    'work_style_match': compatibility.work_style_match,
                    'communication_match': compatibility.communication_match,
                    'success_prediction': compatibility.predicted_success_rate,
                    'satisfaction_prediction': compatibility.predicted_satisfaction_score,
                    'risk_score': compatibility.risk_assessment_score,
                    'confidence': compatibility.confidence_score,
                    'match_reasons': self._generate_match_reasons(compatibility),
                    'ai_insights': self._generate_ai_insights(compatibility)
                }
                
                matches.append(match_data)
                
            except Exception as e:
                logger.error(f"Error calculating compatibility for freelancer {freelancer.id}: {e}")
                continue
        
        # Sort by compatibility score
        matches.sort(key=lambda x: x['compatibility_score'], reverse=True)
        
        logger.info(f"Generated {len(matches)} AI-powered matches for project {project_id}")
        return matches[:limit]
    
    async def _gather_user_text_samples(self, user_id: str, db: Session) -> List[str]:
        """Gather text samples from user's messages, project descriptions, etc."""
        text_samples = []
        
        # Get user's profile info
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.bio:
            text_samples.append(user.bio)
        
        # Get user's bids
        bids = db.query(Bid).filter(Bid.freelancer_id == user_id).limit(20).all()
        for bid in bids:
            if bid.proposal_text:
                text_samples.append(bid.proposal_text)
        
        # Get user's projects (if client)
        projects = db.query(Project).filter(Project.client_id == user_id).limit(10).all()
        for project in projects:
            if project.description:
                text_samples.append(project.description)
        
        return text_samples
    
    async def _calculate_personality_match(
        self, 
        freelancer: Optional[PersonalityProfile], 
        client: Optional[PersonalityProfile]
    ) -> float:
        """Calculate personality compatibility score"""
        if not freelancer or not client:
            return 50.0  # Neutral score
        
        # Complementary traits scoring
        compatibility_factors = {
            'openness': 100 - abs(freelancer.openness - client.openness),
            'conscientiousness': min(freelancer.conscientiousness, client.conscientiousness),
            'extraversion': 100 - abs(freelancer.extraversion - client.extraversion),
            'agreeableness': (freelancer.agreeableness + client.agreeableness) / 2,
            'neuroticism': 100 - max(freelancer.neuroticism, client.neuroticism)
        }
        
        # Weighted average
        personality_weights = {
            'openness': 0.15,
            'conscientiousness': 0.25,
            'extraversion': 0.20,
            'agreeableness': 0.20,
            'neuroticism': 0.20
        }
        
        total_score = sum(
            score * personality_weights[trait] 
            for trait, score in compatibility_factors.items()
        )
        
        return min(100.0, max(0.0, total_score))
    
    async def _calculate_skill_match(
        self, 
        freelancer_id: str, 
        project_id: str, 
        db: Session
    ) -> float:
        """Calculate technical skill match"""
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return 70.0
        
        freelancer = db.query(User).filter(User.id == freelancer_id).first()
        if not freelancer:
            return 0.0
        
        # Simple keyword matching (in production, use semantic similarity)
        project_skills = project.required_skills or []
        freelancer_skills = freelancer.skills or []
        
        if not project_skills:
            return 80.0
        
        matches = sum(1 for skill in project_skills if skill in freelancer_skills)
        skill_match_ratio = matches / len(project_skills)
        
        return skill_match_ratio * 100
    
    async def _calculate_work_style_match(
        self, 
        freelancer_pattern: Optional[WorkPattern], 
        project: Project, 
        db: Session
    ) -> float:
        """Calculate work style compatibility"""
        if not freelancer_pattern:
            return 60.0  # Default score
        
        # Base score from freelancer's track record
        base_score = (
            (freelancer_pattern.quality_consistency_score or 70.0) * 0.4 +
            (freelancer_pattern.deadline_adherence_rate or 80.0) * 0.3 +
            (freelancer_pattern.project_success_rate or 70.0) * 0.3
        )
        
        return min(100.0, max(0.0, base_score))
    
    async def _calculate_communication_match(
        self, 
        freelancer: Optional[PersonalityProfile], 
        client: Optional[PersonalityProfile]
    ) -> float:
        """Calculate communication style compatibility"""
        if not freelancer or not client:
            return 70.0
        
        # Communication compatibility based on styles
        f_style = freelancer.communication_style or 'neutral'
        c_style = client.communication_style or 'neutral'
        
        compatibility_matrix = {
            ('direct', 'direct'): 90,
            ('direct', 'diplomatic'): 60,
            ('diplomatic', 'diplomatic'): 85,
            ('diplomatic', 'direct'): 60,
            ('neutral', 'direct'): 75,
            ('neutral', 'diplomatic'): 75,
            ('direct', 'neutral'): 75,
            ('diplomatic', 'neutral'): 75,
            ('neutral', 'neutral'): 80
        }
        
        return compatibility_matrix.get((f_style, c_style), 70.0)
    
    async def _calculate_schedule_compatibility(
        self, 
        freelancer: Optional[PersonalityProfile], 
        client: Optional[PersonalityProfile]
    ) -> float:
        """Calculate schedule/timezone compatibility"""
        if not freelancer or not client:
            return 80.0
        
        # Simplified timezone compatibility
        f_tz = freelancer.timezone_preference or 'UTC'
        c_tz = client.timezone_preference or 'UTC'
        
        if f_tz == c_tz:
            return 100.0
        else:
            return 70.0  # Different timezones but manageable
    
    def _predict_project_success(
        self, 
        compatibility: float, 
        freelancer_pattern: Optional[WorkPattern]
    ) -> float:
        """Predict project success rate"""
        if not freelancer_pattern:
            return compatibility * 0.8  # Base on compatibility only
        
        # Combine compatibility with historical performance
        historical_success = freelancer_pattern.project_success_rate or 70.0
        
        # Weighted average favoring recent compatibility
        predicted_success = (compatibility * 0.6 + historical_success * 0.4)
        
        return min(100.0, max(0.0, predicted_success))
    
    def _predict_satisfaction(
        self, 
        compatibility: float, 
        communication: float
    ) -> float:
        """Predict client satisfaction score (1-5 scale)"""
        # Convert compatibility scores to satisfaction prediction
        satisfaction_score = (compatibility * 0.7 + communication * 0.3) / 20
        return min(5.0, max(1.0, satisfaction_score))
    
    def _assess_project_risk(
        self, 
        freelancer_pattern: Optional[WorkPattern], 
        compatibility: float
    ) -> float:
        """Assess project risk (0=low risk, 100=high risk)"""
        if not freelancer_pattern:
            return 50.0  # Medium risk
        
        # Risk factors
        deadline_risk = 100 - (freelancer_pattern.deadline_adherence_rate or 80)
        quality_risk = 100 - (freelancer_pattern.quality_consistency_score or 70)
        compatibility_risk = 100 - compatibility
        
        # Weighted risk score
        total_risk = (deadline_risk * 0.4 + quality_risk * 0.3 + compatibility_risk * 0.3)
        
        return min(100.0, max(0.0, total_risk))
    
    def _generate_match_reasons(self, compatibility: CompatibilityScore) -> List[str]:
        """Generate human-readable reasons for the match"""
        reasons = []
        
        if compatibility.personality_match > 80:
            reasons.append("Excellent personality compatibility")
        elif compatibility.personality_match > 60:
            reasons.append("Good personality match")
        
        if compatibility.skill_technical_match > 85:
            reasons.append("Perfect skill alignment")
        elif compatibility.skill_technical_match > 70:
            reasons.append("Strong technical skills match")
        
        if compatibility.predicted_success_rate > 80:
            reasons.append("High predicted success rate")
        
        if compatibility.communication_match > 75:
            reasons.append("Compatible communication styles")
        
        if compatibility.risk_assessment_score < 30:
            reasons.append("Low risk collaboration")
        
        return reasons or ["General compatibility match"]
    
    def _generate_ai_insights(self, compatibility: CompatibilityScore) -> List[str]:
        """Generate AI insights for the match"""
        insights = []
        
        if compatibility.predicted_success_rate > 85:
            insights.append(f"🎯 {compatibility.predicted_success_rate:.0f}% predicted success rate")
        
        if compatibility.risk_assessment_score < 25:
            insights.append("🛡️ Very low project risk")
        elif compatibility.risk_assessment_score > 75:
            insights.append("⚠️ Higher than average project risk")
        
        if compatibility.predicted_satisfaction_score > 4.5:
            insights.append(f"⭐ Expected satisfaction: {compatibility.predicted_satisfaction_score:.1f}/5.0")
        
        if compatibility.confidence_score > 0.8:
            insights.append(f"🎯 High confidence prediction ({compatibility.confidence_score:.0%})")
        
        return insights
    
    async def update_skill_demand_predictions(self, db: Session) -> List[SkillDemandPrediction]:
        """Update skill demand predictions (simplified implementation)"""
        # Get recent project data
        from datetime import timedelta
        recent_projects = db.query(Project).filter(
            Project.created_at >= datetime.now(timezone.utc) - timedelta(days=30)
        ).all()
        
        # Count skill occurrences
        skill_counts = {}
        total_projects = len(recent_projects)
        
        for project in recent_projects:
            if project.required_skills:
                for skill in project.required_skills:
                    skill_counts[skill] = skill_counts.get(skill, 0) + 1
        
        # Create or update predictions
        updated_predictions = []
        
        for skill, count in skill_counts.items():
            demand_score = (count / total_projects) * 100 if total_projects > 0 else 0
            
            # Get existing prediction or create new one
            prediction = db.query(SkillDemandPrediction).filter(
                SkillDemandPrediction.skill_name == skill
            ).first()
            
            if not prediction:
                prediction = SkillDemandPrediction(skill_name=skill)
                db.add(prediction)
            
            # Update with simple trend prediction
            prediction.skill_category = self._categorize_skill(skill)
            prediction.current_demand_score = demand_score
            prediction.predicted_demand_1m = demand_score * 1.1
            prediction.predicted_demand_3m = demand_score * 1.15
            prediction.predicted_demand_6m = demand_score * 1.2
            prediction.predicted_demand_1y = demand_score * 1.3
            prediction.competition_level = self._assess_competition_level(skill, db)
            prediction.learning_difficulty = self._assess_learning_difficulty(skill)
            prediction.prediction_confidence = min(1.0, count / 10)
            prediction.data_points_analyzed = count
            prediction.model_version = '1.0'
            prediction.last_updated = datetime.now(timezone.utc)
            
            updated_predictions.append(prediction)
        
        db.commit()
        return updated_predictions
    
    def _categorize_skill(self, skill: str) -> str:
        """Categorize skill into broad categories"""
        skill_lower = skill.lower()
        
        if any(tech in skill_lower for tech in ['python', 'javascript', 'react', 'node', 'java']):
            return 'programming'
        elif any(design in skill_lower for design in ['design', 'ui', 'ux', 'photoshop']):
            return 'design'
        elif any(marketing in skill_lower for marketing in ['marketing', 'seo', 'social']):
            return 'marketing'
        elif any(writing in skill_lower for writing in ['writing', 'content', 'copywriting']):
            return 'writing'
        else:
            return 'other'
    
    def _assess_competition_level(self, skill: str, db: Session) -> str:
        """Assess competition level for a skill"""
        # Count freelancers with this skill
        freelancer_count = db.query(User).filter(
            User.role == 'freelancer',
            User.skills.contains([skill])
        ).count()
        
        if freelancer_count > 100:
            return 'high'
        elif freelancer_count > 20:
            return 'medium'
        else:
            return 'low'
    
    def _assess_learning_difficulty(self, skill: str) -> float:
        """Assess how difficult it is to learn a skill (0-100 scale)"""
        # Simplified difficulty assessment
        difficulty_map = {
            'python': 60, 'javascript': 50, 'react': 70, 'machine learning': 85,
            'design': 40, 'writing': 30, 'marketing': 35, 'project management': 45
        }
        
        skill_lower = skill.lower()
        for known_skill, difficulty in difficulty_map.items():
            if known_skill in skill_lower:
                return difficulty
        
        return 50.0  # Default medium difficulty
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
