from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.project import Project
from app.models.community import Event
from app.models.matching import FreelancerProfile
import logging

logger = logging.getLogger(__name__)

class EventRelevanceService:
    """Service to match events with user interests based on their projects and skills"""
    
    def __init__(self):
        # Mapping of project categories to event keywords
        self.category_keywords = {
            'web_development': ['javascript', 'react', 'vue', 'angular', 'node', 'frontend', 'backend', 'fullstack', 'web'],
            'mobile_development': ['ios', 'android', 'react native', 'flutter', 'mobile', 'app development'],
            'data_science': ['python', 'data science', 'machine learning', 'ai', 'analytics', 'big data', 'tensorflow'],
            'blockchain': ['blockchain', 'cryptocurrency', 'web3', 'ethereum', 'smart contracts', 'defi', 'nft'],
            'devops': ['devops', 'kubernetes', 'docker', 'aws', 'cloud', 'ci/cd', 'infrastructure'],
            'design': ['ui/ux', 'design', 'figma', 'adobe', 'graphic design', 'user experience'],
            'business': ['startup', 'entrepreneur', 'business', 'marketing', 'growth', 'strategy', 'finance'],
            'cybersecurity': ['security', 'cybersecurity', 'penetration testing', 'ethical hacking', 'infosec'],
            'game_development': ['unity', 'unreal', 'game development', 'gaming', 'c#', 'c++'],
            'api_development': ['api', 'rest', 'graphql', 'microservices', 'backend', 'integration']
        }
        
        # Tech stack to category mapping
        self.tech_stack_mapping = {
            'React': 'web_development',
            'Vue.js': 'web_development', 
            'Angular': 'web_development',
            'Node.js': 'web_development',
            'Python': 'data_science',
            'JavaScript': 'web_development',
            'TypeScript': 'web_development',
            'Solidity': 'blockchain',
            'Swift': 'mobile_development',
            'Kotlin': 'mobile_development',
            'Flutter': 'mobile_development',
            'React Native': 'mobile_development',
            'Docker': 'devops',
            'Kubernetes': 'devops',
            'AWS': 'devops',
            'Figma': 'design',
            'Adobe': 'design'
        }

    def get_user_interests(self, user: User, db: Session) -> List[str]:
        """Extract user interests from their projects and profile"""
        interests = set()
        
        # Get interests from user's projects
        user_projects = db.query(Project).filter(Project.client_id == user.id).all()
        for project in user_projects:
            if project.category:
                interests.add(project.category.lower())
            if project.tech_stack:
                for tech in project.tech_stack:
                    if tech in self.tech_stack_mapping:
                        interests.add(self.tech_stack_mapping[tech])
        
        # Get interests from freelancer profile if user is a freelancer
        if user.role == 'freelancer':
            profile = db.query(FreelancerProfile).filter(FreelancerProfile.user_id == user.id).first()
            if profile and profile.skills:
                for skill in profile.skills:
                    skill_lower = skill.lower()
                    for category, keywords in self.category_keywords.items():
                        if any(keyword in skill_lower for keyword in keywords):
                            interests.add(category)
        
        return list(interests)

    def score_event_relevance(self, event: Event, user_interests: List[str]) -> float:
        """Score how relevant an event is to user interests (0-1 scale)"""
        if not user_interests:
            return 0.5  # Default relevance if no interests known
        
        score = 0.0
        max_score = 0.0
        
        event_text = f"{event.title} {event.description or ''} {event.category or ''}".lower()
        
        for interest in user_interests:
            max_score += 1.0
            
            # Direct category match
            if interest == event.category:
                score += 1.0
                continue
            
            # Keyword matching
            if interest in self.category_keywords:
                keywords = self.category_keywords[interest]
                keyword_matches = sum(1 for keyword in keywords if keyword in event_text)
                if keyword_matches > 0:
                    # Score based on percentage of keywords matched
                    score += min(keyword_matches / len(keywords), 1.0)
        
        # Normalize score
        return score / max_score if max_score > 0 else 0.0

    def filter_and_rank_events(self, events: List[Event], user: User, db: Session, 
                              min_relevance: float = 0.3) -> List[Dict]:
        """Filter and rank events by relevance to user"""
        user_interests = self.get_user_interests(user, db)
        
        scored_events = []
        for event in events:
            relevance_score = self.score_event_relevance(event, user_interests)
            
            if relevance_score >= min_relevance:
                scored_events.append({
                    'event': event,
                    'relevance_score': relevance_score,
                    'matched_interests': self._get_matched_interests(event, user_interests)
                })
        
        # Sort by relevance score (descending) and then by date
        scored_events.sort(key=lambda x: (x['relevance_score'], x['event'].starts_at), reverse=True)
        
        return scored_events

    def _get_matched_interests(self, event: Event, user_interests: List[str]) -> List[str]:
        """Get list of user interests that match this event"""
        matched = []
        event_text = f"{event.title} {event.description or ''} {event.category or ''}".lower()
        
        for interest in user_interests:
            # Direct category match
            if interest == event.category:
                matched.append(interest)
                continue
            
            # Keyword matching
            if interest in self.category_keywords:
                keywords = self.category_keywords[interest]
                if any(keyword in event_text for keyword in keywords):
                    matched.append(interest)
        
        return matched

    def get_recommended_event_categories(self, user: User, db: Session) -> List[str]:
        """Get recommended event categories for user based on their interests"""
        user_interests = self.get_user_interests(user, db)
        
        # Add related categories
        recommended = set(user_interests)
        
        # Add complementary categories
        category_relationships = {
            'web_development': ['api_development', 'devops', 'design'],
            'mobile_development': ['api_development', 'design'],
            'data_science': ['business', 'api_development'],
            'blockchain': ['web_development', 'cybersecurity'],
            'devops': ['cybersecurity', 'web_development'],
            'design': ['web_development', 'mobile_development'],
            'business': ['data_science', 'design']
        }
        
        for interest in user_interests:
            if interest in category_relationships:
                recommended.update(category_relationships[interest])
        
        return list(recommended)
