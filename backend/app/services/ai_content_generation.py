"""
AI-Powered Content Generation Service
Provides intelligent content assistance for proposals, project descriptions, and contracts
"""

import logging
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
from sqlalchemy.orm import Session

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

from ..core.config import settings
from ..models.user import User
from ..models.project import Project

logger = logging.getLogger(__name__)


class AIContentGenerator:
    """AI-powered content generation service"""
    
    def __init__(self):
        self.is_initialized = False
        self.model_name = "gpt-3.5-turbo"
        
        # Initialize OpenAI if available and configured
        if OPENAI_AVAILABLE and hasattr(settings, 'OPENAI_API_KEY') and settings.OPENAI_API_KEY:
            try:
                openai.api_key = settings.OPENAI_API_KEY
                self.is_initialized = True
                logger.info("AI Content Generation initialized with OpenAI")
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI: {e}")
                self.is_initialized = False
        else:
            logger.info("AI Content Generation running without OpenAI (fallback mode)")
    
    async def generate_proposal_draft(
        self,
        project: Project,
        freelancer: User,
        additional_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate an AI-powered proposal draft for a freelancer"""
        
        if not self.is_initialized:
            return self._fallback_proposal_template(project, freelancer)
        
        try:
            # Build context for the AI
            context = self._build_proposal_context(project, freelancer, additional_context)
            
            # Generate proposal using OpenAI
            response = await self._call_openai(
                system_message="You are an expert freelance proposal writer. Create compelling, professional proposals that highlight relevant experience and provide clear value propositions.",
                user_message=context,
                max_tokens=800,
                temperature=0.7
            )
            
            # Parse and structure the response
            proposal_content = self._parse_proposal_response(response)
            
            return {
                "success": True,
                "content": proposal_content,
                "ai_generated": True,
                "model": self.model_name,
                "suggestions": self._generate_proposal_suggestions(project, freelancer)
            }
            
        except Exception as e:
            logger.error(f"Error generating AI proposal: {e}")
            return self._fallback_proposal_template(project, freelancer)
    
    async def enhance_project_description(
        self,
        original_description: str,
        project_title: str,
        required_skills: List[str],
        budget_range: Optional[str] = None
    ) -> Dict[str, Any]:
        """Enhance a project description using AI"""
        
        if not self.is_initialized:
            return self._fallback_description_enhancement(original_description)
        
        try:
            context = f"""
            Project Title: {project_title}
            Current Description: {original_description}
            Required Skills: {', '.join(required_skills) if required_skills else 'Not specified'}
            Budget: {budget_range or 'Not specified'}
            
            Please enhance this project description to:
            1. Make it more clear and compelling
            2. Better attract qualified freelancers
            3. Include specific requirements and expectations
            4. Maintain professional tone
            5. Add relevant technical details if applicable
            """
            
            response = await self._call_openai(
                system_message="You are an expert project manager and technical writer. Enhance project descriptions to be clear, comprehensive, and attractive to qualified freelancers while maintaining the original intent.",
                user_message=context,
                max_tokens=600,
                temperature=0.6
            )
            
            return {
                "success": True,
                "enhanced_description": response.strip(),
                "original_description": original_description,
                "ai_generated": True,
                "model": self.model_name,
                "improvements": self._analyze_description_improvements(original_description, response)
            }
            
        except Exception as e:
            logger.error(f"Error enhancing project description: {e}")
            return self._fallback_description_enhancement(original_description)
    
    async def generate_contract_clauses(
        self,
        project_type: str,
        project_value: float,
        timeline_days: int,
        special_requirements: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Generate standard contract clauses for a project"""
        
        if not self.is_initialized:
            return self._fallback_contract_clauses(project_type)
        
        try:
            context = f"""
            Project Type: {project_type}
            Project Value: ${project_value:,.2f}
            Timeline: {timeline_days} days
            Special Requirements: {', '.join(special_requirements) if special_requirements else 'None'}
            
            Generate professional contract clauses covering:
            1. Scope of work and deliverables
            2. Payment terms and milestones
            3. Timeline and deadlines
            4. Intellectual property rights
            5. Revision and change requests
            6. Termination conditions
            7. Communication expectations
            """
            
            response = await self._call_openai(
                system_message="You are a legal expert specializing in freelance contracts. Generate comprehensive, fair contract clauses that protect both parties while being clear and professional.",
                user_message=context,
                max_tokens=1000,
                temperature=0.5
            )
            
            # Parse clauses into structured format
            clauses = self._parse_contract_clauses(response)
            
            return {
                "success": True,
                "clauses": clauses,
                "raw_content": response,
                "ai_generated": True,
                "model": self.model_name,
                "disclaimer": "These are AI-generated suggestions. Please review with legal counsel before use."
            }
            
        except Exception as e:
            logger.error(f"Error generating contract clauses: {e}")
            return self._fallback_contract_clauses(project_type)
    
    async def generate_project_title_suggestions(
        self,
        description: str,
        skills: List[str],
        count: int = 5
    ) -> Dict[str, Any]:
        """Generate compelling project title suggestions"""
        
        if not self.is_initialized:
            return self._fallback_title_suggestions(description, skills)
        
        try:
            context = f"""
            Project Description: {description[:500]}...
            Required Skills: {', '.join(skills[:10])}
            
            Generate {count} compelling, professional project titles that:
            1. Clearly communicate the project's purpose
            2. Attract qualified freelancers
            3. Are concise (under 60 characters)
            4. Include relevant keywords
            5. Sound professional and engaging
            """
            
            response = await self._call_openai(
                system_message="You are a marketing expert specializing in project titles. Create compelling titles that attract the right freelancers and clearly communicate project value.",
                user_message=context,
                max_tokens=200,
                temperature=0.8
            )
            
            titles = self._parse_title_suggestions(response, count)
            
            return {
                "success": True,
                "titles": titles,
                "ai_generated": True,
                "model": self.model_name
            }
            
        except Exception as e:
            logger.error(f"Error generating title suggestions: {e}")
            return self._fallback_title_suggestions(description, skills)
    
    async def improve_bid_response(
        self,
        original_bid: str,
        project_context: str,
        freelancer_skills: List[str]
    ) -> Dict[str, Any]:
        """Improve a freelancer's bid response using AI"""
        
        if not self.is_initialized:
            return self._fallback_bid_improvement(original_bid)
        
        try:
            context = f"""
            Original Bid: {original_bid}
            Project Context: {project_context[:400]}
            Freelancer Skills: {', '.join(freelancer_skills)}
            
            Improve this bid by:
            1. Making it more professional and compelling
            2. Better highlighting relevant skills and experience
            3. Addressing project requirements specifically
            4. Adding value propositions
            5. Maintaining authentic voice while improving clarity
            """
            
            response = await self._call_openai(
                system_message="You are an expert freelance consultant. Help improve bid responses to be more compelling and professional while maintaining authenticity.",
                user_message=context,
                max_tokens=600,
                temperature=0.6
            )
            
            return {
                "success": True,
                "improved_bid": response.strip(),
                "original_bid": original_bid,
                "ai_generated": True,
                "model": self.model_name,
                "improvements": self._analyze_bid_improvements(original_bid, response)
            }
            
        except Exception as e:
            logger.error(f"Error improving bid response: {e}")
            return self._fallback_bid_improvement(original_bid)
    
    async def _call_openai(
        self,
        system_message: str,
        user_message: str,
        max_tokens: int = 500,
        temperature: float = 0.7
    ) -> str:
        """Make a call to OpenAI API"""
        
        try:
            response = await openai.ChatCompletion.acreate(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=max_tokens,
                temperature=temperature,
                timeout=30
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}")
            raise
    
    def _build_proposal_context(
        self,
        project: Project,
        freelancer: User,
        additional_context: Optional[str]
    ) -> str:
        """Build context for proposal generation"""
        
        context = f"""
        Project Title: {project.title}
        Project Description: {project.description}
        Budget Range: ${project.budget_min:,} - ${project.budget_max:,} (if available)
        
        Freelancer Profile:
        Name: {freelancer.full_name or 'Freelancer'}
        Skills: {', '.join(freelancer.skills or [])}
        Bio: {freelancer.bio or 'Experienced professional'}
        
        {f'Additional Context: {additional_context}' if additional_context else ''}
        
        Create a compelling proposal that:
        1. Addresses the project requirements specifically
        2. Highlights relevant experience and skills
        3. Provides a clear approach or methodology
        4. Shows understanding of the client's needs
        5. Includes a professional closing
        """
        
        return context
    
    def _parse_proposal_response(self, response: str) -> Dict[str, str]:
        """Parse AI proposal response into structured format"""
        
        # Try to identify sections in the response
        sections = {
            "introduction": "",
            "approach": "",
            "experience": "",
            "timeline": "",
            "closing": ""
        }
        
        # Simple section parsing (could be enhanced with more sophisticated NLP)
        lines = response.split('\n')
        current_section = "introduction"
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Detect section headers
            line_lower = line.lower()
            if any(word in line_lower for word in ['approach', 'methodology', 'solution']):
                current_section = "approach"
            elif any(word in line_lower for word in ['experience', 'background', 'expertise']):
                current_section = "experience"
            elif any(word in line_lower for word in ['timeline', 'schedule', 'delivery']):
                current_section = "timeline"
            elif any(word in line_lower for word in ['conclusion', 'summary', 'next steps']):
                current_section = "closing"
            
            sections[current_section] += f"{line}\n"
        
        # If no clear sections found, put everything in introduction
        if not any(sections.values()):
            sections["introduction"] = response
        
        return sections
    
    def _parse_contract_clauses(self, response: str) -> List[Dict[str, str]]:
        """Parse contract clauses into structured format"""
        
        clauses = []
        lines = response.split('\n')
        current_clause = {"title": "", "content": ""}
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Detect clause headers (numbered or titled sections)
            if any(line.startswith(str(i)) for i in range(1, 20)) or line.endswith(':'):
                if current_clause["content"]:
                    clauses.append(current_clause.copy())
                current_clause = {"title": line.rstrip(':'), "content": ""}
            else:
                current_clause["content"] += f"{line} "
        
        # Add the last clause
        if current_clause["content"]:
            clauses.append(current_clause)
        
        return clauses
    
    def _parse_title_suggestions(self, response: str, count: int) -> List[str]:
        """Parse title suggestions from AI response"""
        
        lines = response.split('\n')
        titles = []
        
        for line in lines:
            line = line.strip()
            if line and len(titles) < count:
                # Clean up numbering and formatting
                cleaned = line.lstrip('1234567890.-• ').strip('"\'')
                if cleaned and len(cleaned) <= 100:  # Reasonable title length
                    titles.append(cleaned)
        
        return titles[:count]
    
    def _generate_proposal_suggestions(self, project: Project, freelancer: User) -> List[str]:
        """Generate suggestions for improving proposals"""
        
        suggestions = [
            "Include specific examples from your portfolio",
            "Mention relevant technologies or tools you'll use",
            "Propose a clear project timeline",
            "Address potential challenges and solutions"
        ]
        
        # Add context-specific suggestions
        if project.budget_min and project.budget_max:
            suggestions.append("Explain your pricing structure and value proposition")
        
        if freelancer.skills:
            suggestions.append(f"Highlight your expertise in {', '.join(freelancer.skills[:3])}")
        
        return suggestions
    
    def _analyze_description_improvements(self, original: str, enhanced: str) -> List[str]:
        """Analyze improvements made to project description"""
        
        improvements = []
        
        if len(enhanced) > len(original) * 1.2:
            improvements.append("Added more detailed requirements")
        
        if "deliverable" in enhanced.lower() and "deliverable" not in original.lower():
            improvements.append("Clarified deliverables")
        
        if any(word in enhanced.lower() for word in ['timeline', 'deadline', 'duration']):
            improvements.append("Added timeline expectations")
        
        improvements.append("Enhanced clarity and professionalism")
        
        return improvements
    
    def _analyze_bid_improvements(self, original: str, improved: str) -> List[str]:
        """Analyze improvements made to bid response"""
        
        improvements = [
            "Enhanced professional tone",
            "Better structured content",
            "Clearer value proposition"
        ]
        
        if len(improved) > len(original):
            improvements.append("Added more comprehensive details")
        
        return improvements
    
    def _fallback_proposal_template(self, project: Project, freelancer: User) -> Dict[str, Any]:
        """Provide fallback proposal template when AI is not available"""
        
        template_content = {
            "introduction": f"Dear {project.client.full_name if project.client else 'Client'},\n\nI am excited to submit my proposal for '{project.title}'. With my experience in {', '.join(freelancer.skills[:3]) if freelancer.skills else 'various technologies'}, I believe I can deliver excellent results for your project.",
            
            "approach": "My approach to this project will include:\n• Thorough analysis of your requirements\n• Regular communication and progress updates\n• Quality assurance at each milestone\n• Timely delivery of all deliverables",
            
            "experience": f"I bring relevant experience in {', '.join(freelancer.skills[:5]) if freelancer.skills else 'the required areas'}. {freelancer.bio or 'I have successfully completed similar projects and am committed to delivering high-quality work.'}",
            
            "timeline": "I can begin work immediately and will provide regular updates throughout the project timeline.",
            
            "closing": "I look forward to discussing your project in more detail. Please feel free to contact me with any questions.\n\nBest regards,\n" + (freelancer.full_name or "Your Freelancer")
        }
        
        return {
            "success": True,
            "content": template_content,
            "ai_generated": False,
            "model": "template",
            "suggestions": self._generate_proposal_suggestions(project, freelancer)
        }
    
    def _fallback_description_enhancement(self, original: str) -> Dict[str, Any]:
        """Provide fallback description enhancement"""
        
        enhanced = f"{original}\n\nProject Requirements:\n• Clear communication throughout the project\n• Regular progress updates\n• High-quality deliverables\n• Adherence to agreed timeline\n\nTo apply for this project, please include:\n• Relevant portfolio examples\n• Proposed timeline\n• Any questions about the requirements"
        
        return {
            "success": True,
            "enhanced_description": enhanced,
            "original_description": original,
            "ai_generated": False,
            "model": "template",
            "improvements": ["Added project requirements", "Included application guidelines"]
        }
    
    def _fallback_contract_clauses(self, project_type: str) -> Dict[str, Any]:
        """Provide fallback contract clauses"""
        
        clauses = [
            {
                "title": "Scope of Work",
                "content": "The freelancer agrees to complete the work as described in the project requirements and any additional specifications agreed upon by both parties."
            },
            {
                "title": "Payment Terms",
                "content": "Payment will be made according to the agreed milestones. Each milestone payment is due within 7 days of milestone completion and client approval."
            },
            {
                "title": "Timeline",
                "content": "The project will be completed according to the agreed timeline. Any changes to the timeline must be agreed upon by both parties in writing."
            },
            {
                "title": "Revisions",
                "content": "The client is entitled to reasonable revisions within the scope of work. Additional revisions may be subject to additional charges."
            }
        ]
        
        return {
            "success": True,
            "clauses": clauses,
            "raw_content": "\n\n".join([f"{c['title']}: {c['content']}" for c in clauses]),
            "ai_generated": False,
            "model": "template",
            "disclaimer": "These are template clauses. Please review with legal counsel before use."
        }
    
    def _fallback_title_suggestions(self, description: str, skills: List[str]) -> Dict[str, Any]:
        """Provide fallback title suggestions"""
        
        # Extract key words from description and skills
        key_skills = skills[:3] if skills else ["Development"]
        
        titles = [
            f"{' & '.join(key_skills)} Project",
            f"Professional {key_skills[0]} Services",
            f"{key_skills[0]} Development Project",
            f"Custom {' and '.join(key_skills)} Solution",
            f"Expert {key_skills[0]} Implementation"
        ]
        
        return {
            "success": True,
            "titles": titles,
            "ai_generated": False,
            "model": "template"
        }
    
    def _fallback_bid_improvement(self, original_bid: str) -> Dict[str, Any]:
        """Provide fallback bid improvement"""
        
        improved = f"Dear Client,\n\n{original_bid}\n\nI am committed to delivering high-quality work that meets your expectations. I believe in clear communication throughout the project and will provide regular updates on progress.\n\nI look forward to the opportunity to work with you on this project.\n\nBest regards"
        
        return {
            "success": True,
            "improved_bid": improved,
            "original_bid": original_bid,
            "ai_generated": False,
            "model": "template",
            "improvements": ["Added professional greeting and closing", "Enhanced commitment statement"]
        }


# Global instance
ai_content_generator = AIContentGenerator()
