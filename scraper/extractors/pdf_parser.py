"""
BidHubKH — Deep AI PDF & Attachment Spec Parser
Extracts line-item Bill of Quantities (BOQ), technical spec tables, and mandatory submission
checklists directly from PDF Standard Bidding Documents (SBD) and Terms of Reference (TOR).
"""

import io
import logging
import re
from typing import Optional

import requests

from scraper.extractors.ai_extractor import AIExtractionResult, MultiProviderAIExtractor

logger = logging.getLogger(__name__)

class DeepPDFSpecParser:
    def __init__(self):
        self.ai_extractor = MultiProviderAIExtractor()

    def extract_text_from_pdf_bytes(self, pdf_bytes: bytes) -> str:
        """Extracts text content from PDF bytes using pypdf or stream parsing."""
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(pdf_bytes))
            text_pages = []
            for page_num in range(min(len(reader.pages), 15)): # Process first 15 pages for speed & relevance
                page = reader.pages[page_num]
                text_pages.append(page.extract_text() or "")
            return "\n".join(text_pages)
        except Exception as e:
            logger.warning(f"pypdf extraction failed or not installed ({e}). Falling back to stream extraction.")
            # Fallback ascii stream extraction
            raw_text = re.sub(r'[^\x20-\x7E\n]', '', pdf_bytes.decode('latin-1', errors='ignore'))
            return raw_text[:10000]

    def download_and_parse_pdf_url(self, pdf_url: str) -> Optional[str]:
        """Downloads a remote PDF and extracts readable text."""
        try:
            resp = requests.get(pdf_url, timeout=20, headers={"User-Agent": "BidHubKH-Intelligence-Bot/1.0"})
            if resp.status_code == 200 and len(resp.content) > 100:
                return self.extract_text_from_pdf_bytes(resp.content)
            else:
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
    ) -> AIExtractionResult:
        """Extracts structured BOQ specifications and requirements from document text."""
        # Trim text to fit prompt context
        truncated_text = document_text[:12000]
        return self.ai_extractor.extract_from_text(
            title=tender_title,
            description=truncated_text,
            source_name=source_name
        )
