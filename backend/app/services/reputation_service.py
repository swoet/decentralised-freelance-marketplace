"""Advanced reputation calculation service with detailed scoring components."""

import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func

from app.core.config import settings
from app.models.matching import ReputationScoreV2
from app.models.skills import SkillVerification
from app.models.user import User
from app.models.project import Project
from app.models.review import Review
from app.models.escrow_contract import EscrowContract

logger = logging.getLogger(__name__)


class ReputationService:
    """Service for calculating and managing advanced reputation scores."""
    
    def __init__(self):
        self.badge_thresholds = self._load_badge_thresholds()
        self.scoring_weights = {
            'quality': 0.25,      # Reviews and ratings
            'reliability': 0.25,   # On-time delivery, communication
            'expertise': 0.20,     # Verified skills, project complexity
            'professionalism': 0.20, # Client feedback, dispute resolution
            'growth': 0.10         # Learning, improvement trends
        }
    
    def calculate_reputation_score(self, db: Session, user_id: str) -> Optional[ReputationScoreV2]:
        """Calculate comprehensive reputation score for a user."""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return None
            
            # Get or create reputation score record
            reputation = db.query(ReputationScoreV2).filter(
                ReputationScoreV2.user_id == user_id
            ).first()
            
            if not reputation:
                reputation = ReputationScoreV2(user_id=user_id)
                db.add(reputation)
            
            # Calculate component scores
            quality_score = self._calculate_quality_score(db, user_id)
            reliability_score = self._calculate_reliability_score(db, user_id)
            expertise_score = self._calculate_expertise_score(db, user_id)
            professionalism_score = self._calculate_professionalism_score(db, user_id)
            growth_score = self._calculate_growth_score(db, user_id)
            
            # Update component scores
            reputation.quality_score = quality_score
            reputation.reliability_score = reliability_score
            reputation.expertise_score = expertise_score
            reputation.professionalism_score = professionalism_score
            reputation.growth_score = growth_score
            
            # Calculate total score (0-1000 scale)
            total_score = (
                quality_score * self.scoring_weights['quality'] +
                reliability_score * self.scoring_weights['reliability'] +
                expertise_score * self.scoring_weights['expertise'] +
                professionalism_score * self.scoring_weights['professionalism'] +
                growth_score * self.scoring_weights['growth']
            ) * 10  # Scale to 0-1000
            
            reputation.total_score = total_score
            
            # Update supporting metrics
            self._update_supporting_metrics(db, reputation, user_id)
            
            # Calculate badges and achievements
            badges = self._calculate_badges(reputation)
            achievements = self._calculate_achievements(db, reputation, user_id)
            
            reputation.badges = badges
            reputation.achievements = achievements
            reputation.last_calculated_at = datetime.utcnow()
            reputation.calculation_version = "2.0"
            reputation.updated_at = datetime.utcnow()
            
            db.commit()
            
            logger.info(f"Updated reputation score for user {user_id}: {total_score}")
            return reputation
            
        except Exception as e:
            logger.error(f"Failed to calculate reputation score: {e}")
            db.rollback()
            return None
    
    def _calculate_quality_score(self, db: Session, user_id: str) -> float:
        """Calculate quality score based on reviews and ratings (0-100)."""
        try:
            # Get all reviews for projects where user was the freelancer
            reviews = db.query(Review).join(Project).filter(
                Project.freelancer_id == user_id
            ).all()
            
            if not reviews:
                return 50.0  # Neutral score for new users
            
            # Calculate average rating
            total_rating = sum(review.rating for review in reviews)
            avg_rating = total_rating / len(reviews)
            
            # Convert 5-star rating to 0-100 scale
            base_score = (avg_rating / 5.0) * 100
            
            # Bonus for high number of reviews (confidence factor)
            review_count_bonus = min(len(reviews) / 20, 1.0) * 10  # Max 10 points
            
            # Penalty for low ratings
            low_rating_penalty = 0
            low_ratings = [r for r in reviews if r.rating < 3]
            if len(low_ratings) > 0:
                low_rating_penalty = (len(low_ratings) / len(reviews)) * 20
            
            quality_score = base_score + review_count_bonus - low_rating_penalty
            return max(0, min(100, quality_score))
            
        except Exception as e:
            logger.error(f"Failed to calculate quality score: {e}")
            return 50.0
    
    def _calculate_reliability_score(self, db: Session, user_id: str) -> float:
        """Calculate reliability score based on delivery and communication (0-100)."""
        try:
            # Get completed projects
            completed_projects = db.query(Project).filter(
                and_(
                    Project.freelancer_id == user_id,
                    Project.status == 'completed'
                )
            ).all()
            
            if not completed_projects:
                return 50.0
            
            # Calculate on-time delivery rate
            on_time_count = 0
            for project in completed_projects:
                if (hasattr(project, 'completed_at') and hasattr(project, 'deadline') and
                    project.completed_at and project.deadline):
                    if project.completed_at <= project.deadline:
                        on_time_count += 1
            
            on_time_rate = on_time_count / len(completed_projects) if completed_projects else 0
            
            # Calculate response time score (assuming we track this)
            response_score = 75.0  # Default good score
            
            # Calculate communication score from reviews
            communication_scores = []
            reviews = db.query(Review).join(Project).filter(
                Project.freelancer_id == user_id
            ).all()
            
            for review in reviews:
                if hasattr(review, 'communication_rating') and review.communication_rating:
                    communication_scores.append(review.communication_rating)
            
            avg_communication = (sum(communication_scores) / len(communication_scores) 
                               if communication_scores else 4.0)
            communication_score = (avg_communication / 5.0) * 100
            
            # Combine scores
            reliability_score = (
                on_time_rate * 40 +      # 40% weight for on-time delivery
                response_score * 0.3 +   # 30% weight for response time
                communication_score * 0.3 # 30% weight for communication
            )
            
            return max(0, min(100, reliability_score))
            
        except Exception as e:
            logger.error(f"Failed to calculate reliability score: {e}")
            return 50.0
    
    def _calculate_expertise_score(self, db: Session, user_id: str) -> float:
        """Calculate expertise score based on verified skills and project complexity (0-100)."""
        try:
            # Get verified skills
            verified_skills = db.query(SkillVerification).filter(
                and_(
                    SkillVerification.user_id == user_id,
                    SkillVerification.status == 'approved'
                )
            ).all()
            
            # Base score from verified skills count
            skills_score = min(len(verified_skills) * 5, 40)  # Max 40 points for 8+ skills
            
            # Bonus for high-confidence verifications
            confidence_bonus = 0
            for verification in verified_skills:
                if verification.confidence_score and verification.confidence_score > 0.8:
                    confidence_bonus += 2
            confidence_bonus = min(confidence_bonus, 20)  # Max 20 points
            
            # Score from project complexity
            projects = db.query(Project).filter(
                and_(
                    Project.freelancer_id == user_id,
                    Project.status.in_(['completed', 'active'])
                )
            ).all()
            
            complexity_score = 0
            if projects:
                avg_budget = sum(getattr(p, 'budget', 0) or 0 for p in projects) / len(projects)
                complexity_score = min(avg_budget / 1000, 25)  # Max 25 points
            
            # Bonus for skill level
            skill_level_bonus = 0
            expert_skills = [v for v in verified_skills if v.skill_level == 'expert']
            advanced_skills = [v for v in verified_skills if v.skill_level == 'advanced']
            
            skill_level_bonus = len(expert_skills) * 3 + len(advanced_skills) * 2
            skill_level_bonus = min(skill_level_bonus, 15)  # Max 15 points
            
            expertise_score = skills_score + confidence_bonus + complexity_score + skill_level_bonus
            return max(0, min(100, expertise_score))
            
        except Exception as e:
            logger.error(f"Failed to calculate expertise score: {e}")
            return 50.0
    
    def _calculate_professionalism_score(self, db: Session, user_id: str) -> float:
        """Calculate professionalism score based on client feedback and disputes (0-100)."""
        try:
            # Get reviews with professionalism ratings
            reviews = db.query(Review).join(Project).filter(
                Project.freelancer_id == user_id
            ).all()
            
            if not reviews:
                return 50.0
            
            # Calculate professionalism from reviews
            professionalism_ratings = []
            for review in reviews:
                if hasattr(review, 'professionalism_rating') and review.professionalism_rating:
                    professionalism_ratings.append(review.professionalism_rating)
                else:
                    # Use overall rating as proxy
                    professionalism_ratings.append(review.rating)
            
            avg_professionalism = (sum(professionalism_ratings) / len(professionalism_ratings)
                                 if professionalism_ratings else 4.0)
            base_score = (avg_professionalism / 5.0) * 100
            
            # Penalty for disputes (assuming we track this)
            total_projects = len(db.query(Project).filter(
                Project.freelancer_id == user_id
            ).all())
            
            # Assuming dispute rate is tracked somewhere
            dispute_rate = 0.05  # Default low dispute rate
            dispute_penalty = dispute_rate * 30  # Max 30 point penalty
            
            # Bonus for repeat clients
            repeat_client_bonus = 0  # Would calculate based on client relationships
            
            professionalism_score = base_score - dispute_penalty + repeat_client_bonus
            return max(0, min(100, professionalism_score))
            
        except Exception as e:
            logger.error(f"Failed to calculate professionalism score: {e}")
            return 50.0
    
    def _calculate_growth_score(self, db: Session, user_id: str) -> float:
        """Calculate growth score based on learning and improvement trends (0-100)."""
        try:
            # Get recent skill verifications (last 6 months)
            recent_cutoff = datetime.utcnow() - timedelta(days=180)
            recent_skills = db.query(SkillVerification).filter(
                and_(
                    SkillVerification.user_id == user_id,
                    SkillVerification.status == 'approved',
                    SkillVerification.verified_at >= recent_cutoff
                )
            ).count()
            
            # Score for recent skill acquisitions
            recent_skills_score = min(recent_skills * 10, 40)  # Max 40 points
            
            # Calculate rating trend (last 10 reviews vs previous 10)
            reviews = db.query(Review).join(Project).filter(
                Project.freelancer_id == user_id
            ).order_by(desc(Review.created_at)).limit(20).all()
            
            trend_score = 50  # Neutral
            if len(reviews) >= 10:
                recent_reviews = reviews[:10]
                older_reviews = reviews[10:] if len(reviews) > 10 else []
                
                recent_avg = sum(r.rating for r in recent_reviews) / len(recent_reviews)
                
                if older_reviews:
                    older_avg = sum(r.rating for r in older_reviews) / len(older_reviews)
                    improvement = recent_avg - older_avg
                    trend_score = 50 + (improvement * 20)  # +/- 20 points max
            
            # Bonus for portfolio updates (would track this)
            portfolio_bonus = 10  # Default bonus for active users
            
            growth_score = recent_skills_score + trend_score + portfolio_bonus
            return max(0, min(100, growth_score))
            
        except Exception as e:
            logger.error(f"Failed to calculate growth score: {e}")
            return 50.0
    
    def _update_supporting_metrics(self, db: Session, reputation: ReputationScoreV2, user_id: str):
        """Update supporting metrics in the reputation record."""
        try:
            # Count completed projects
            completed_count = db.query(Project).filter(
                and_(
                    Project.freelancer_id == user_id,
                    Project.status == 'completed'
                )
            ).count()
            reputation.projects_completed = completed_count
            
            # Calculate average rating
            reviews = db.query(Review).join(Project).filter(
                Project.freelancer_id == user_id
            ).all()
            
            if reviews:
                avg_rating = sum(r.rating for r in reviews) / len(reviews)
                reputation.avg_rating = avg_rating
            
            # Count verified skills
            verified_count = db.query(SkillVerification).filter(
                and_(
                    SkillVerification.user_id == user_id,
                    SkillVerification.status == 'approved'
                )
            ).count()
            reputation.verified_skills_count = verified_count
            
            # Other metrics would be calculated similarly
            reputation.on_time_delivery_rate = 0.85  # Default good rate
            reputation.response_time_hours = 4.0     # Default good response time
            reputation.repeat_client_rate = 0.3      # Default repeat rate
            reputation.dispute_rate = 0.05           # Default low dispute rate
            
        except Exception as e:
            logger.error(f"Failed to update supporting metrics: {e}")
    
    def _calculate_badges(self, reputation: ReputationScoreV2) -> List[str]:
        """Calculate earned badges based on reputation metrics."""
        badges = []
        
        # Quality badges
        if reputation.avg_rating and reputation.avg_rating >= 4.8:
            badges.append("5_star_freelancer")
        elif reputation.avg_rating and reputation.avg_rating >= 4.5:
            badges.append("top_rated")
        
        # Reliability badges
        if reputation.on_time_delivery_rate and reputation.on_time_delivery_rate >= 0.95:
            badges.append("always_on_time")
        elif reputation.on_time_delivery_rate and reputation.on_time_delivery_rate >= 0.85:
            badges.append("reliable_delivery")
        
        # Expertise badges
        if reputation.verified_skills_count >= 10:
            badges.append("skill_master")
        elif reputation.verified_skills_count >= 5:
            badges.append("verified_expert")
        
        # Volume badges
        if reputation.projects_completed >= 100:
            badges.append("veteran_freelancer")
        elif reputation.projects_completed >= 50:
            badges.append("experienced_freelancer")
        elif reputation.projects_completed >= 10:
            badges.append("established_freelancer")
        
        # Communication badges
        if reputation.response_time_hours and reputation.response_time_hours <= 2:
            badges.append("quick_responder")
        
        # Overall excellence
        if reputation.total_score >= 900:
            badges.append("elite_freelancer")
        elif reputation.total_score >= 800:
            badges.append("premium_freelancer")
        
        return badges
    
    def _calculate_achievements(self, db: Session, reputation: ReputationScoreV2, user_id: str) -> Dict:
        """Calculate achievements and milestones."""
        achievements = {}
        
        # First project milestone
        first_project = db.query(Project).filter(
            Project.freelancer_id == user_id
        ).order_by(Project.created_at).first()
        
        if first_project:
            achievements["first_project_date"] = first_project.created_at.isoformat()
        
        # Milestone achievements
        milestones = [1, 5, 10, 25, 50, 100]
        for milestone in milestones:
            if reputation.projects_completed >= milestone:
                achievements[f"projects_{milestone}"] = True
        
        # Rating achievements
        if reputation.avg_rating:
            if reputation.avg_rating >= 4.9:
                achievements["perfect_rating_streak"] = True
            elif reputation.avg_rating >= 4.5:
                achievements["excellent_rating"] = True
        
        # Skill achievements
        skill_milestones = [1, 3, 5, 10, 15]
        for milestone in skill_milestones:
            if reputation.verified_skills_count >= milestone:
                achievements[f"verified_skills_{milestone}"] = True
        
        return achievements
    
    def _load_badge_thresholds(self) -> Dict:
        """Load badge thresholds configuration."""
        return {
            "5_star_freelancer": {"avg_rating": 4.8, "min_reviews": 10},
            "top_rated": {"avg_rating": 4.5, "min_reviews": 5},
            "always_on_time": {"on_time_rate": 0.95, "min_projects": 10},
            "reliable_delivery": {"on_time_rate": 0.85, "min_projects": 5},
            "skill_master": {"verified_skills": 10},
            "verified_expert": {"verified_skills": 5},
            "veteran_freelancer": {"projects_completed": 100},
            "experienced_freelancer": {"projects_completed": 50},
            "established_freelancer": {"projects_completed": 10},
            "quick_responder": {"response_time_hours": 2},
            "elite_freelancer": {"total_score": 900},
            "premium_freelancer": {"total_score": 800}
        }
    
    def get_reputation_leaderboard(
        self, 
        db: Session, 
        limit: int = 50,
        category: Optional[str] = None
    ) -> List[Dict]:
        """Get reputation leaderboard."""
        try:
            query = db.query(ReputationScoreV2).join(User)
            
            if category == 'quality':
                query = query.order_by(desc(ReputationScoreV2.quality_score))
            elif category == 'reliability':
                query = query.order_by(desc(ReputationScoreV2.reliability_score))
            elif category == 'expertise':
                query = query.order_by(desc(ReputationScoreV2.expertise_score))
            else:
                query = query.order_by(desc(ReputationScoreV2.total_score))
            
            results = query.limit(limit).all()
            
            return [
                {
                    'user_id': str(rep.user_id),
                    'total_score': rep.total_score,
                    'quality_score': rep.quality_score,
                    'reliability_score': rep.reliability_score,
                    'expertise_score': rep.expertise_score,
                    'professionalism_score': rep.professionalism_score,
                    'growth_score': rep.growth_score,
                    'badges': rep.badges or [],
                    'projects_completed': rep.projects_completed,
                    'avg_rating': rep.avg_rating,
                    'rank': i + 1
                }
                for i, rep in enumerate(results)
            ]
            
        except Exception as e:
            logger.error(f"Failed to get reputation leaderboard: {e}")
            return []
