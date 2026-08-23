import os
import json
import requests
from typing import List, Optional
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

class TenderAIExtractionResult(BaseModel):
    summary: str = Field(
        description="A concise 2-3 sentence executive summary explaining what is being purchased, key context, and scale."
    )
    key_buyer_intent: str = Field(
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
        default=None,
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
    Supports free and custom models with JSON extraction.
    """
    DEFAULT_MODELS = [
        "google/gemini-2.0-flash-exp:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "deepseek/deepseek-r1:free",
        "qwen/qwen-2.5-72b-instruct:free",
        "openrouter/auto"
    ]

    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.custom_model = os.getenv("OPENROUTER_MODEL")
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"

    def is_available(self) -> bool:
        return bool(self.api_key and "your_" not in self.api_key)

    def extract_from_text(self, title: str, description: str, source_name: str = "") -> Optional[TenderAIExtractionResult]:
        if not self.is_available():
            return None

        prompt = f"""You are an expert procurement intelligence analyst for BidHubKH in Cambodia.
Analyze the following tender notice announcement and extract structured intelligence.

Tender Title: {title}
Procuring Source / Organization: {source_name}
Notice Content / Description:
{description}

Extract the following in strict raw JSON format with NO markdown wrapping:
{{
  "summary": "A clear 2-3 sentence executive summary in English explaining what is being procured, by whom, and the scope.",
  "key_buyer_intent": "The primary objective or operational goal of the purchasing agency.",
  "products_services": ["Array of specific goods, equipment, or service deliverables"],
  "requirements": ["Array of mandatory supplier eligibility rules, business registrations, licenses, or experience criteria"],
  "bid_security": "Bank guarantee or bid security if mentioned, otherwise 'Not specified in notice'",
  "estimated_value": null,
  "category_slug": "Choose single best fit slug from: it-telecom, construction-civil, medical-healthcare, consulting-services, office-furniture, vehicles-transport, electrical-energy, agriculture-water, security-cctv, education-training"
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
                        {"role": "system", "content": "You are a JSON-only response bot. You must only output valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.1,
                }
                response = requests.post(self.base_url, headers=headers, json=payload, timeout=25)
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"].strip()
                    if content.startswith("```json"):
                        content = content[7:]
                    if content.startswith("```"):
                        content = content[3:]
                    if content.endswith("```"):
                        content = content[:-3]
                    parsed = json.loads(content.strip())
                    print(f"[OpenRouterExtractor] Successfully extracted using model: {model}")
                    return TenderAIExtractionResult(**parsed)
            except Exception as e:
                continue

        return None
