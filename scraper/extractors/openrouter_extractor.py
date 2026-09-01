import json
import os
import re
from pathlib import Path
from typing import List, Optional

import requests
from dotenv import load_dotenv
from pydantic import BaseModel, Field

# Load scraper/.env
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)
load_dotenv()

class TenderAIExtractionResult(BaseModel):
    summary: str = Field(
        description="A concise 2-3 sentence executive summary explaining what is being purchased, key context, and scale."
    )
    key_buyer_intent: str = Field(
        default="Procure required goods and services fulfilling stated specifications.",
        description="The primary objective or problem the procuring entity is trying to solve."
    )
    products_services: List[str] = Field(
        default_factory=list,
        description="Bullet list of specific items, equipment, software, civil works, or deliverables required."
    )
    requirements: List[str] = Field(
        default_factory=list,
        description="Mandatory qualification criteria, certifications (e.g. MAF, ISO, MPWT grade, GDT tax certificate), and years of experience needed."
    )
    bid_security: Optional[str] = Field(
        default="Not specified in notice",
        description="Required bank guarantee, bid bond amount, or submission security if specified."
    )
    estimated_value: Optional[float] = Field(
        default=None,
        description="Estimated contract value or budget amount in USD if mentioned in the notice."
    )
    category_slug: Optional[str] = Field(
        default=None,
        description="Recommended category slug from standard taxonomy."
    )

class OpenRouterExtractor:
    """
    Procurement Intelligence Extractor powered by OpenRouter API.
    Supports high-speed free models, openrouter/auto, and custom models.
    """
    DEFAULT_MODELS = [
        "minimax/minimax-m3:free",
        "inclusionai/ling-3.0-flash-fin:free",
        "google/gemma-4-31b-it:free",
        "nvidia/nemotron-3.5-lightning:free",
        "openrouter/auto"
    ]

    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.custom_model = os.getenv("OPENROUTER_MODEL")
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"

    def is_available(self) -> bool:
        return bool(self.api_key and "your_" not in self.api_key)

    def _extract_json_block(self, text: str) -> Optional[dict]:
        clean = text.strip()
        if clean.startswith("```json"):
            clean = clean[7:]
        if clean.startswith("```"):
            clean = clean[3:]
        if clean.endswith("```"):
            clean = clean[:-3]
        clean = clean.strip()

        # Direct parse attempt
        try:
            return json.loads(clean)
        except Exception:
            pass

        # Regex search for first JSON object
        match = re.search(r'(\{[\s\S]*\})', clean)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass
        return None

    def extract_from_text(self, title: str, description: str, source_name: str = "") -> Optional[TenderAIExtractionResult]:
        if not self.is_available():
            return None

        prompt = f"""You are an expert procurement intelligence analyst for BidHubKH in Cambodia.
Analyze the following tender notice announcement and extract structured intelligence in JSON format.

Tender Title: {title}
Procuring Source / Organization: {source_name}
Notice Content / Description:
{description}

Output ONLY a JSON object with these keys:
{{
  "summary": "2-3 sentence executive summary in English",
  "key_buyer_intent": "Primary operational goal of the purchasing agency",
  "products_services": ["Specific goods, equipment, or service deliverables"],
  "requirements": ["Mandatory supplier eligibility rules, business registrations, licenses, or experience criteria"],
  "bid_security": "Bank guarantee or bid security if mentioned, otherwise 'Not specified in notice'",
  "estimated_value": null,
  "category_slug": "Choose single best fit: it-telecom, construction-civil, medical-healthcare, consulting-services, office-furniture, vehicles-transport, electrical-energy, agriculture-water, security-cctv, education-training"
}}
"""

        models_to_try = []
        if self.custom_model:
            models_to_try.append(self.custom_model)
        models_to_try.extend(self.DEFAULT_MODELS)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://bidhubkh.com",
            "X-Title": "BidHubKH Procurement Intelligence"
        }

        for model in models_to_try:
            try:
                payload = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "You are a JSON-only response bot. You must only output a valid JSON object."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.1,
                }
                response = requests.post(self.base_url, headers=headers, json=payload, timeout=45)
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    parsed = self._extract_json_block(content)
                    if parsed and "summary" in parsed:
                        raw_est = parsed.get("estimated_value")
                        if isinstance(raw_est, dict):
                            try:
                                parsed["estimated_value"] = float(raw_est.get("amount") or raw_est.get("value") or 0.0) or None
                            except Exception:
                                parsed["estimated_value"] = None
                        elif isinstance(raw_est, str):
                            clean_val = re.sub(r'[^\d.]', '', raw_est)
                            try:
                                parsed["estimated_value"] = float(clean_val) if clean_val else None
                            except Exception:
                                parsed["estimated_value"] = None
                        elif not isinstance(raw_est, (int, float)):
                            parsed["estimated_value"] = None

                        print(f"[OpenRouterExtractor] 🤖 Extracted using model: {model}")
                        return TenderAIExtractionResult(**parsed)
            except Exception as e:
                print(f"[OpenRouterExtractor] Model {model} error: {e}")
                continue

        return None
