"""
Service interfaces following Interface Segregation and Dependency Inversion principles
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from backend.models import User, Segment, Campaign, Flow


class IAIService(ABC):
    """Interface for AI service operations"""
    
    @abstractmethod
    def generate_segment_criteria(self, prompt: str) -> Dict[str, Any]:
        """Generate segment criteria from natural language prompt"""
        pass
    
    @abstractmethod
    def generate_flow_content(self, segment_description: str, step_type: str, step_number: int) -> Dict[str, Any]:
        """Generate flow step content"""
        pass
    
    @abstractmethod
    def generate_flow_from_segment(self, segment_description: str, segment_criteria: Dict[str, Any]) -> Dict[str, Any]:
        """Generate complete flow from segment"""
        pass
    
    @abstractmethod
    def generate_campaign_details(self, segment_description: str, segment_criteria: Dict[str, Any], flow_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generate campaign details from segment and flow"""
        pass
    
    @abstractmethod
    def generate_suggestive_response(self, prompt: str, context: Optional[str] = None) -> Dict[str, Any]:
        """Generate suggestive AI response for chat"""
        pass


class ISegmentService(ABC):
    """Interface for segment operations"""
    
    @abstractmethod
    def evaluate_segment(self, segment: Segment, users: List[User]) -> List[User]:
        """Evaluate segment criteria against users"""
        pass
    
    @abstractmethod
    def get_segment_count(self, segment: Segment, users: List[User]) -> int:
        """Get count of users matching segment"""
        pass


class ICampaignService(ABC):
    """Interface for campaign operations"""
    
    @abstractmethod
    def execute_campaign(self, campaign: Campaign) -> Dict[str, Any]:
        """Execute a campaign"""
        pass
    
    @abstractmethod
    def update_campaign_status(self, campaign: Campaign, status: str) -> Campaign:
        """Update campaign status"""
        pass


class IUserService(ABC):
    """Interface for user operations"""
    
    @abstractmethod
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        pass
    
    @abstractmethod
    def create_user(self, user_data: Dict[str, Any]) -> User:
        """Create a new user"""
        pass
    
    @abstractmethod
    def update_user(self, user_id: str, user_data: Dict[str, Any]) -> Optional[User]:
        """Update user"""
        pass
    
    @abstractmethod
    def delete_user(self, user_id: str) -> bool:
        """Delete user"""
        pass
