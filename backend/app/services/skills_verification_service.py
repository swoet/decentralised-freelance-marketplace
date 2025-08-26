"""Skills verification service with evidence upload and quiz management."""

import logging
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import hashlib
import json
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc

from app.core.config import settings
from app.models.matching import SkillVerification
from app.models.skills import Skill
from app.models.user import User

logger = logging.getLogger(__name__)


class SkillsVerificationService:
    """Service for managing skills verification through various methods."""
    
    def __init__(self):
        self.quiz_questions = self._load_quiz_questions()
    
    def create_verification_request(
        self,
        db: Session,
        user_id: str,
        skill_id: str,
        verification_type: str,
        evidence_data: Optional[Dict] = None
    ) -> Optional[SkillVerification]:
        """Create a new skill verification request."""
        try:
            # Check if verification already exists
            existing = db.query(SkillVerification).filter(
                and_(
                    SkillVerification.user_id == user_id,
                    SkillVerification.skill_id == skill_id,
                    SkillVerification.status.in_(['pending', 'approved'])
                )
            ).first()
            
            if existing:
                logger.warning(f"Verification already exists for user {user_id}, skill {skill_id}")
                return existing
            
            # Create new verification request
            verification = SkillVerification(
                user_id=user_id,
                skill_id=skill_id,
                verification_type=verification_type,
                status='pending'
            )
            
            # Handle different verification types
            if verification_type == 'evidence' and evidence_data:
                verification.evidence_url = evidence_data.get('evidence_url')
                verification.evidence_type = evidence_data.get('evidence_type')
                verification.evidence_description = evidence_data.get('description')
            
            elif verification_type == 'oauth' and evidence_data:
                verification.oauth_provider = evidence_data.get('provider')
                verification.oauth_data = evidence_data.get('oauth_data')
            
            db.add(verification)
            db.commit()
            
            logger.info(f"Created verification request: {verification.id}")
            return verification
            
        except Exception as e:
            logger.error(f"Failed to create verification request: {e}")
            db.rollback()
            return None
    
    def start_quiz_verification(
        self,
        db: Session,
        user_id: str,
        skill_id: str,
        difficulty_level: str = 'intermediate'
    ) -> Optional[Dict]:
        """Start a quiz-based skill verification."""
        try:
            # Get skill information
            skill = db.query(Skill).filter(Skill.id == skill_id).first()
            if not skill:
                return None
            
            # Create verification record
            verification = self.create_verification_request(
                db, user_id, skill_id, 'quiz'
            )
            
            if not verification:
                return None
            
            # Generate quiz questions
            questions = self._generate_quiz_questions(skill.name, difficulty_level)
            
            # Store quiz metadata
            verification.quiz_questions_count = len(questions)
            db.commit()
            
            return {
                'verification_id': str(verification.id),
                'skill_name': skill.name,
                'questions': questions,
                'time_limit_minutes': 30,
                'passing_score': 70
            }
            
        except Exception as e:
            logger.error(f"Failed to start quiz verification: {e}")
            return None
    
    def submit_quiz_answers(
        self,
        db: Session,
        verification_id: str,
        answers: List[Dict]
    ) -> Optional[Dict]:
        """Submit quiz answers and calculate score."""
        try:
            verification = db.query(SkillVerification).filter(
                SkillVerification.id == verification_id
            ).first()
            
            if not verification or verification.verification_type != 'quiz':
                return None
            
            # Calculate score
            correct_answers = 0
            total_questions = len(answers)
            
            for answer in answers:
                question_id = answer.get('question_id')
                user_answer = answer.get('answer')
                
                # Get correct answer (this would be stored/cached somewhere)
                correct_answer = self._get_correct_answer(question_id)
                
                if user_answer == correct_answer:
                    correct_answers += 1
            
            score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
            
            # Update verification record
            verification.quiz_score = score
            verification.quiz_questions_count = total_questions
            verification.quiz_correct_answers = correct_answers
            
            # Determine pass/fail
            passing_score = 70
            if score >= passing_score:
                verification.status = 'approved'
                verification.verified_at = datetime.utcnow()
                verification.confidence_score = min(score / 100, 1.0)
                verification.skill_level = self._determine_skill_level(score)
            else:
                verification.status = 'rejected'
                verification.rejection_reason = f"Quiz score {score}% below passing threshold {passing_score}%"
            
            db.commit()
            
            return {
                'verification_id': str(verification.id),
                'score': score,
                'correct_answers': correct_answers,
                'total_questions': total_questions,
                'passed': score >= passing_score,
                'status': verification.status
            }
            
        except Exception as e:
            logger.error(f"Failed to submit quiz answers: {e}")
            db.rollback()
            return None
    
    def submit_evidence_verification(
        self,
        db: Session,
        user_id: str,
        skill_id: str,
        evidence_url: str,
        evidence_type: str,
        description: str
    ) -> Optional[SkillVerification]:
        """Submit evidence-based verification."""
        try:
            evidence_data = {
                'evidence_url': evidence_url,
                'evidence_type': evidence_type,
                'description': description
            }
            
            verification = self.create_verification_request(
                db, user_id, skill_id, 'evidence', evidence_data
            )
            
            if verification:
                # Auto-approve certain types of evidence or queue for manual review
                if evidence_type in ['certificate', 'diploma']:
                    # These might get auto-approved with high confidence
                    verification.confidence_score = 0.8
                else:
                    # Portfolio items need manual review
                    verification.confidence_score = 0.5
            
            return verification
            
        except Exception as e:
            logger.error(f"Failed to submit evidence verification: {e}")
            return None
    
    def submit_oauth_verification(
        self,
        db: Session,
        user_id: str,
        skill_id: str,
        provider: str,
        oauth_data: Dict
    ) -> Optional[SkillVerification]:
        """Submit OAuth-based verification (GitHub, etc.)."""
        try:
            # Validate OAuth data based on provider
            if provider == 'github':
                verification_result = self._verify_github_skills(oauth_data, skill_id)
            elif provider == 'linkedin':
                verification_result = self._verify_linkedin_skills(oauth_data, skill_id)
            else:
                logger.warning(f"Unsupported OAuth provider: {provider}")
                return None
            
            if not verification_result:
                return None
            
            evidence_data = {
                'provider': provider,
                'oauth_data': oauth_data
            }
            
            verification = self.create_verification_request(
                db, user_id, skill_id, 'oauth', evidence_data
            )
            
            if verification:
                verification.confidence_score = verification_result.get('confidence_score', 0.5)
                verification.skill_level = verification_result.get('skill_level', 'intermediate')
                
                # Auto-approve if confidence is high enough
                if verification.confidence_score >= 0.7:
                    verification.status = 'approved'
                    verification.verified_at = datetime.utcnow()
                
                db.commit()
            
            return verification
            
        except Exception as e:
            logger.error(f"Failed to submit OAuth verification: {e}")
            return None
    
    def review_verification(
        self,
        db: Session,
        verification_id: str,
        reviewer_id: str,
        approved: bool,
        notes: Optional[str] = None,
        skill_level: Optional[str] = None
    ) -> Optional[SkillVerification]:
        """Manual review of a verification request."""
        try:
            verification = db.query(SkillVerification).filter(
                SkillVerification.id == verification_id
            ).first()
            
            if not verification:
                return None
            
            # Update verification status
            verification.status = 'approved' if approved else 'rejected'
            verification.verified_by = reviewer_id
            verification.reviewer_notes = notes
            
            if approved:
                verification.verified_at = datetime.utcnow()
                verification.skill_level = skill_level or 'intermediate'
                # Set confidence based on verification type
                if verification.verification_type == 'evidence':
                    verification.confidence_score = 0.9
                elif verification.verification_type == 'peer_review':
                    verification.confidence_score = 0.8
            else:
                verification.rejection_reason = notes or "Manual review rejection"
            
            db.commit()
            
            logger.info(f"Verification {verification_id} reviewed: {verification.status}")
            return verification
            
        except Exception as e:
            logger.error(f"Failed to review verification: {e}")
            db.rollback()
            return None
    
    def get_user_verifications(
        self,
        db: Session,
        user_id: str,
        status: Optional[str] = None
    ) -> List[SkillVerification]:
        """Get all verifications for a user."""
        try:
            query = db.query(SkillVerification).filter(
                SkillVerification.user_id == user_id
            )
            
            if status:
                query = query.filter(SkillVerification.status == status)
            
            return query.order_by(desc(SkillVerification.created_at)).all()
            
        except Exception as e:
            logger.error(f"Failed to get user verifications: {e}")
            return []
    
    def get_pending_verifications(
        self,
        db: Session,
        verification_type: Optional[str] = None,
        limit: int = 50
    ) -> List[SkillVerification]:
        """Get pending verifications for admin review."""
        try:
            query = db.query(SkillVerification).filter(
                SkillVerification.status == 'pending'
            )
            
            if verification_type:
                query = query.filter(SkillVerification.verification_type == verification_type)
            
            return query.order_by(SkillVerification.created_at).limit(limit).all()
            
        except Exception as e:
            logger.error(f"Failed to get pending verifications: {e}")
            return []
    
    def _load_quiz_questions(self) -> Dict:
        """Load quiz questions from configuration or database."""
        # This would typically load from a database or configuration file
        # For now, return a sample structure
        return {
            'python': {
                'beginner': [
                    {
                        'id': 'py_b_1',
                        'question': 'What is the correct way to define a function in Python?',
                        'options': ['def function():', 'function def():', 'define function():', 'func function():'],
                        'correct': 0
                    }
                ],
                'intermediate': [
                    {
                        'id': 'py_i_1',
                        'question': 'What is a decorator in Python?',
                        'options': ['A design pattern', 'A function that modifies another function', 'A class method', 'A variable type'],
                        'correct': 1
                    }
                ]
            }
        }
    
    def _generate_quiz_questions(self, skill_name: str, difficulty: str, count: int = 10) -> List[Dict]:
        """Generate quiz questions for a skill."""
        skill_lower = skill_name.lower()
        
        if skill_lower in self.quiz_questions and difficulty in self.quiz_questions[skill_lower]:
            questions = self.quiz_questions[skill_lower][difficulty]
            # Return up to 'count' questions
            return questions[:count]
        
        # Return sample questions if skill not found
        return [
            {
                'id': f'generic_{i}',
                'question': f'Sample question {i+1} for {skill_name}',
                'options': ['Option A', 'Option B', 'Option C', 'Option D'],
                'correct': 0
            }
            for i in range(min(count, 5))
        ]
    
    def _get_correct_answer(self, question_id: str) -> int:
        """Get the correct answer for a question ID."""
        # This would look up the correct answer from storage
        # For now, return 0 as default
        return 0
    
    def _determine_skill_level(self, score: float) -> str:
        """Determine skill level based on quiz score."""
        if score >= 90:
            return 'expert'
        elif score >= 80:
            return 'advanced'
        elif score >= 70:
            return 'intermediate'
        else:
            return 'beginner'
    
    def _verify_github_skills(self, oauth_data: Dict, skill_id: str) -> Optional[Dict]:
        """Verify skills based on GitHub data."""
        try:
            # Analyze GitHub repositories, languages, contributions
            repos = oauth_data.get('repositories', [])
            languages = oauth_data.get('languages', {})
            
            # Simple scoring based on repository count and language usage
            confidence_score = 0.5
            
            if len(repos) > 5:
                confidence_score += 0.2
            
            if len(languages) > 3:
                confidence_score += 0.1
            
            # Determine skill level based on activity
            if oauth_data.get('contributions', 0) > 100:
                skill_level = 'advanced'
                confidence_score += 0.1
            elif oauth_data.get('contributions', 0) > 50:
                skill_level = 'intermediate'
            else:
                skill_level = 'beginner'
            
            return {
                'confidence_score': min(confidence_score, 1.0),
                'skill_level': skill_level
            }
            
        except Exception as e:
            logger.error(f"Failed to verify GitHub skills: {e}")
            return None
    
    def _verify_linkedin_skills(self, oauth_data: Dict, skill_id: str) -> Optional[Dict]:
        """Verify skills based on LinkedIn data."""
        try:
            # Analyze LinkedIn profile data
            endorsements = oauth_data.get('endorsements', 0)
            experience_years = oauth_data.get('experience_years', 0)
            
            confidence_score = 0.5
            
            if endorsements > 10:
                confidence_score += 0.2
            elif endorsements > 5:
                confidence_score += 0.1
            
            if experience_years > 5:
                skill_level = 'advanced'
                confidence_score += 0.2
            elif experience_years > 2:
                skill_level = 'intermediate'
                confidence_score += 0.1
            else:
                skill_level = 'beginner'
            
            return {
                'confidence_score': min(confidence_score, 1.0),
                'skill_level': skill_level
            }
            
        except Exception as e:
            logger.error(f"Failed to verify LinkedIn skills: {e}")
            return None
