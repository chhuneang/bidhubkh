import json
import os
from typing import List, Optional

from dotenv import load_dotenv
from pydantic import BaseModel, Field

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
        description="Recommended category slug from: it-telecom, construction-civil, medical-healthcare, consulting-services, office-furniture, vehicles-transport, electrical-energy, agriculture-water, security-cctv, education-training."
    )

class GeminiExtractor:
    """
    Tender Document & Notice Intelligence Extractor powered by Google Gemini Flash.
    Extracts structured requirements, products, and concise summaries with automatic multi-model failover.
    """
    MODELS = ['gemini-2.5-flash-lite', 'gemini-flash-latest', 'gemini-3.7-flash']

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.client = None

        if self.api_key and "your_free" not in self.api_key and "your-gemini" not in self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                print("[GeminiExtractor] Initialized Gemini AI Client successfully.")
            except Exception as e:
                print(f"[GeminiExtractor] Client initialization notice: {e}")

    def is_available(self) -> bool:
        return self.client is not None

    def extract_from_text(self, title: str, description: str, source_name: str = "") -> TenderAIExtractionResult:
        """
        Extracts structured tender intelligence from raw text or tender notices with model fallback.
        """
        if not self.is_available():
            return self._heuristic_fallback(title, description)

        prompt = f"""You are an expert procurement intelligence analyst for BidHubKH in Cambodia.
Analyze the following tender notice announcement and extract structured intelligence.

Tender Title: {title}
Procuring Source / Organization: {source_name}
Notice Content / Description:
{description}

Extract the following in strict JSON format:
1. summary: A clear 2-3 sentence executive summary in English explaining what is being procured, by whom, and the scope.
2. key_buyer_intent: The primary objective or operational goal of the purchasing agency.
3. products_services: An array of specific goods, equipment, or service deliverables.
4. requirements: An array of mandatory supplier eligibility rules, business registrations, licenses, or experience criteria.
5. bid_security: Bank guarantee or bid security if mentioned, otherwise "Not specified in notice".
6. estimated_value: Float numeric budget if found, otherwise null.
7. category_slug: Choose the single best fit category slug from:
   - "it-telecom"
   - "construction-civil"
   - "medical-healthcare"
   - "consulting-services"
   - "office-furniture"
   - "vehicles-transport"
   - "electrical-energy"
   - "agriculture-water"
   - "security-cctv"
   - "education-training"
"""

        for model_name in self.MODELS:
            try:
                response = self.client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config={
                        'response_mime_type': 'application/json',
                        'response_schema': TenderAIExtractionResult,
                        'temperature': 0.1,
                    }
                )
                
                if response.text:
                    data = json.loads(response.text)
                    return TenderAIExtractionResult(**data)
            except Exception:
                continue

        return self._heuristic_fallback(title, description)

    def _heuristic_fallback(self, title: str, description: str) -> TenderAIExtractionResult:
        """
        Deterministic rule-based extractor when AI key is not configured or offline.
        """
        title_lower = title.lower()

        category = "consulting-services"
        products = []
        requirements = [
            "Valid Certificate of Tax Compliance (GDT) and Ministry of Commerce business registration.",
            "Demonstrated relevant track record and past performance in similar contract assignments."
        ]

        if any(w in title_lower for w in ["laptop", "computer", "it", "software", "network", "server", "digital", "grid"]):
            category = "it-telecom"
            products = ["Enterprise IT Hardware / Systems Equipment", "Manufacturer Authorized Warranty & Technical Support"]
            requirements.append("Manufacturer Authorization Form (MAF) from authorized hardware vendor.")
        elif any(w in title_lower for w in ["road", "bridge", "civil", "construction", "building", "paving", "drainage"]):
            category = "construction-civil"
            products = ["Civil Works & Infrastructure Construction", "Materials, Earthworks & Quality Testing"]
            requirements.append("Registered construction contractor with proven machinery availability.")
        elif any(w in title_lower for w in ["medical", "health", "hospital", "pharma", "ultrasound", "scanner"]):
            category = "medical-healthcare"
            products = ["Diagnostic Medical Equipment & Consumables", "Biomedical Installation & Training"]
            requirements.append("Valid Ministry of Health Medical Device Import License & ISO Certification.")
        elif any(w in title_lower for w in ["vehicle", "car", "truck", "pickup"]):
            category = "vehicles-transport"
            products = ["Commercial Vehicles & Transportation Equipment", "After-sales Spare Parts & Scheduled Servicing"]
        elif any(w in title_lower for w in ["solar", "energy", "power", "grid", "electrical"]):
            category = "electrical-energy"
            products = ["Solar PV Generation / High-Voltage Power Equipment", "Grid Integration & Inverters"]

        summary = f"Procurement opportunity for '{title}'. Open for qualified domestic and international suppliers."
        if description and len(description) > 30:
            summary = description[:240].strip() + ("..." if len(description) > 240 else "")

        return TenderAIExtractionResult(
            summary=summary,
            key_buyer_intent=f"Procure goods and services fulfilling stated specifications for {title}.",
            products_services=products if products else [title],
            requirements=requirements,
            bid_security="Bank Guarantee / Bid Security required as detailed in bidding dossier.",
            estimated_value=None,
            category_slug=category
        )
