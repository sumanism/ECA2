"""
AI Error Handler following Single Responsibility Principle
Handles only error processing and formatting
"""
import os
from typing import Dict, Any
from openai import APIError, RateLimitError, AuthenticationError
import re


class AIErrorHandler:
    """Handles AI API errors and returns user-friendly messages"""
    
    @staticmethod
    def _is_openai_endpoint() -> bool:
        """Check if using OpenAI endpoint"""
        base_url = os.getenv("OPENAI_BASE_URL") or os.getenv("AI_BASE_URL") or ""
        return "openai.com" in base_url.lower()
    
    @staticmethod
    def handle_error(e: Exception) -> Dict[str, Any]:
        """Handle AI API errors and return user-friendly error information"""
        error_str = str(e).lower()
        is_openai = AIErrorHandler._is_openai_endpoint()
        
        # Check for rate limit errors
        if isinstance(e, RateLimitError) or "429" in error_str or "rate limit" in error_str or "quota" in error_str:
            retry_delay = 60  # Default 60 seconds
            if "retry in" in error_str:
                match = re.search(r'retry in ([\d.]+)s', error_str)
                if match:
                    retry_delay = int(float(match.group(1))) + 5
            
            return {
                "error": "quota_exceeded",
                "message": "API rate limit or quota exceeded. Please wait before trying again.",
                "details": "The API has rate limits based on your plan. Please wait a moment and try again.",
                "retry_after": retry_delay,
                "help_url": "https://platform.openai.com/docs/guides/rate-limits" if is_openai else "https://ai.google.dev/gemini-api/docs/rate-limits"
            }
        
        # Check for authentication errors
        if isinstance(e, AuthenticationError) or "401" in error_str or "403" in error_str or ("invalid" in error_str and "api key" in error_str):
            return {
                "error": "authentication_error",
                "message": "Invalid API key or authentication failed.",
                "details": "Please check your AI API key in the .env file or backend configuration.",
                "help_url": "https://platform.openai.com/api-keys" if is_openai else "https://aistudio.google.com/apikey"
            }
        
        # Check for API errors
        if isinstance(e, APIError):
            return {
                "error": "api_error",
                "message": f"AI API error: {str(e)[:100]}",
                "details": "Please check your API key and account status.",
                "help_url": "https://platform.openai.com/docs" if is_openai else "https://ai.google.dev/docs"
            }
        
        # Generic error
        return {
            "error": "api_error",
            "message": "An error occurred while calling the AI API.",
            "details": str(e)[:200],
            "help_url": "https://platform.openai.com/docs" if is_openai else "https://ai.google.dev/docs"
        }
