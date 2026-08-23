from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, List

from pydantic import BaseModel


class RawTenderData(BaseModel):
    source_code: str
    external_id: str
    source_url: str
    title: str
    description: str | None = None
    raw_payload: Dict[str, Any]

class NormalizedTenderData(BaseModel):
    source_code: str
    external_id: str
    reference_number: str | None = None
    title: str
    slug: str
    summary: str | None = None
    description: str | None = None
    organization_slug: str | None = None
    organization_name: str | None = None
    category_slug: str | None = None
    location: str = "Cambodia"
    published_at: datetime
    deadline: datetime | None = None
    estimated_value: float | None = None
    currency: str = "USD"
    procurement_method: str | None = None
    eligibility: str | None = None
    original_url: str
    products_services: List[str] = []
    requirements: List[str] = []
    confidence_score: int = 100

class BaseSource(ABC):
    """
    Abstract interface that every tender source adapter must implement.
    """
    def __init__(self, code: str, name: str, website_url: str):
        self.code = code
        self.name = name
        self.website_url = website_url

    @abstractmethod
    def fetch_raw(self) -> List[RawTenderData]:
        """Fetches raw notices from external API or website."""
        pass

    @abstractmethod
    def parse_and_normalize(self, raw: RawTenderData) -> NormalizedTenderData:
        """Converts raw data into standard BidHubKH format."""
        pass
