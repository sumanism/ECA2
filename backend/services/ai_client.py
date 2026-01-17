"""
AI Client abstraction following Single Responsibility Principle
Handles only OpenAI client initialization and configuration
"""
import os
from typing import Optional
from openai import OpenAI
from dotenv import load_dotenv


class AIClientFactory:
    """Factory for creating AI clients (Dependency Inversion)"""
    
    @staticmethod
    def load_env_file() -> Optional[str]:
        """Load .env file from appropriate location"""
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        backend_env = os.path.join(backend_dir, ".env")
        root_env = os.path.join(os.path.dirname(backend_dir), ".env")
        
        if os.path.exists(backend_env):
            load_dotenv(backend_env, override=True)
            return backend_env
        elif os.path.exists(root_env):
            load_dotenv(root_env, override=True)
            return root_env
        else:
            load_dotenv(override=True)
            return None
    
    @staticmethod
    def get_api_key() -> Optional[str]:
        """Get API key from environment variables"""
        AIClientFactory.load_env_file()
        return (
            os.getenv("OPENAI_API_KEY") or 
            os.getenv("AI_API_KEY") or 
            os.getenv("GEMINI_API_KEY")
        )
    
    @staticmethod
    def get_base_url() -> str:
        """Get base URL from environment variables"""
        AIClientFactory.load_env_file()
        return (
            os.getenv("OPENAI_BASE_URL") or 
            os.getenv("AI_BASE_URL") or 
            "https://generativelanguage.googleapis.com/v1beta/openai/"
        )
    
    @staticmethod
    def get_model() -> str:
        """Get model from environment variables"""
        AIClientFactory.load_env_file()
        return (
            os.getenv("OPENAI_MODEL") or 
            os.getenv("AI_MODEL") or 
            "gemini-2.5-flash"
        )
    
    @staticmethod
    def create_client() -> OpenAI:
        """Create and return OpenAI client instance"""
        api_key = AIClientFactory.get_api_key()
        base_url = AIClientFactory.get_base_url()
        
        if not api_key:
            raise ValueError(
                "OPENAI_API_KEY is missing. Please set one of the following environment variables:\n"
                "  - OPENAI_API_KEY (recommended, OpenAI SDK standard)\n"
                "  - AI_API_KEY (fallback)\n"
                "  - GEMINI_API_KEY (legacy fallback)\n\n"
                "Get your API key from:\n"
                "  - OpenAI: https://platform.openai.com/api-keys\n"
                "  - Gemini: https://aistudio.google.com/apikey"
            )
        
        # Set environment variables for SDK auto-detection
        if not os.getenv("OPENAI_API_KEY"):
            os.environ["OPENAI_API_KEY"] = api_key
        if not os.getenv("OPENAI_BASE_URL"):
            os.environ["OPENAI_BASE_URL"] = base_url
        
        try:
            client = OpenAI(api_key=api_key, base_url=base_url)
        except TypeError as e:
            # Fallback for compatibility issues
            if "proxies" in str(e).lower() or "unexpected keyword" in str(e).lower():
                client = OpenAI(api_key=api_key)
                if hasattr(client, '_client') and hasattr(client._client, 'base_url'):
                    client._client.base_url = base_url
            else:
                raise
        
        return client
