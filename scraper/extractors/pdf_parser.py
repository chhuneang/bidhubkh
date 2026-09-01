"""
BidHubKH — Deep AI PDF & Attachment Spec Parser
Extracts line-item Bill of Quantities (BOQ), technical spec tables, and mandatory submission
checklists directly from PDF Standard Bidding Documents (SBD) and Terms of Reference (TOR).
"""

import io
import logging
from typing import Optional

import requests

from scraper.extractors.ai_extractor import MultiProviderAIExtractor
from scraper.extractors.gemini_extractor import TenderAIExtractionResult

logger = logging.getLogger(__name__)


class DeepPDFSpecParser:
    def __init__(self):
        self.ai_extractor = MultiProviderAIExtractor()

    def extract_text_from_pdf_bytes(self, pdf_bytes: bytes) -> str:
        """Extracts text content from PDF bytes using pypdf."""
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(pdf_bytes))
            return "\n".join(
                page.extract_text() or ""
                for page in reader.pages[:15]
            )
        except Exception as e:
            logger.warning(f"pypdf extraction failed ({e}).")
            return ""

    def download_and_parse_pdf_url(self, pdf_url: str) -> Optional[str]:
        """Downloads a remote PDF and extracts readable text."""
        try:
            resp = requests.get(pdf_url, timeout=20, headers={"User-Agent": "BidHubKH-Intelligence-Bot/1.0"})
            if resp.status_code == 200 and len(resp.content) > 100:
                return self.extract_text_from_pdf_bytes(resp.content)
            logger.warning(f"Could not download PDF from {pdf_url} (HTTP {resp.status_code})")
            return None
        except Exception as e:
            logger.error(f"Error fetching PDF {pdf_url}: {e}")
            return None

    def analyze_document_with_ai(
        self,
        document_text: str,
        tender_title: str,
        source_name: str = "Official Procurement Document"
    ) -> TenderAIExtractionResult:
        """Extracts structured BOQ specifications and requirements from document text."""
        return self.ai_extractor.extract_from_text(
            title=tender_title,
            description=document_text[:12000],
            source_name=source_name
        )
