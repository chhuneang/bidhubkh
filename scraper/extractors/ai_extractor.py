import os
from typing import Optional
from dotenv import load_dotenv
from scraper.extractors.gemini_extractor import GeminiExtractor, TenderAIExtractionResult
from scraper.extractors.openrouter_extractor import OpenRouterExtractor

load_dotenv()

class MultiProviderAIExtractor:
    """
    Unified AI extraction engine that cascades between:
    1. OpenRouter (Supports free models, experimental alpha models, Llama 3.3, DeepSeek R1)
    2. Google Gemini Flash (Direct high-speed Google API)
    3. Deterministic Heuristic Fallback (Offline safe)
    """
    def __init__(self):
        self.openrouter = OpenRouterExtractor()
        self.gemini = GeminiExtractor()

    def is_available(self) -> bool:
        return self.openrouter.is_available() or self.gemini.is_available()

    def get_active_provider_name(self) -> str:
        if self.openrouter.is_available():
            model = os.getenv("OPENROUTER_MODEL") or "OpenRouter Free Tier"
            return f"OpenRouter ({model})"
        elif self.gemini.is_available():
            return "Google Gemini Flash"
        return "Heuristic Rule Engine"

    def extract_from_text(self, title: str, description: str, source_name: str = "") -> TenderAIExtractionResult:
        # 1. Try OpenRouter if key is present
        if self.openrouter.is_available():
            res = self.openrouter.extract_from_text(title, description, source_name)
            if res:
                return res

        # 2. Try Gemini
        if self.gemini.is_available():
            return self.gemini.extract_from_text(title, description, source_name)

        # 3. Fallback
        return self.gemini._heuristic_fallback(title, description)
