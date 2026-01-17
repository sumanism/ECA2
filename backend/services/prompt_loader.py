"""
Prompt loader following Single Responsibility Principle
Handles only prompt file loading
"""
import os
from typing import Optional


class PromptLoader:
    """Responsible for loading prompt files"""
    
    @staticmethod
    def get_prompts_directory() -> str:
        """Get the prompts directory path"""
        return os.path.join(os.path.dirname(__file__), '..', 'prompts')
    
    @staticmethod
    def load_prompt(filename: str, fallback: Optional[str] = None) -> str:
        """Load prompt from file with optional fallback"""
        prompt_path = os.path.join(PromptLoader.get_prompts_directory(), filename)
        
        try:
            with open(prompt_path, 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            if fallback:
                return fallback
            raise FileNotFoundError(f"Prompt file not found: {prompt_path}")
