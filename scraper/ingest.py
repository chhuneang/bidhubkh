#!/usr/bin/env python3
"""
BidHubKH Data Ingestion CLI Runner
Supports 6 official Cambodian procurement sources:
  1. world_bank_kh (World Bank Cambodia)
  2. adb_kh (Asian Development Bank Cambodia)
  3. mef_gdipp (Cambodian Government MEF / GDPP)
  4. ungm (UN Global Marketplace Cambodia)
  5. ngo_cambodia (Cambodia NGO & Civil Society Portals)
  6. state_utilities (EDC / PPWSA Public Utilities)
"""

import argparse
import sys

from scraper.pipeline import IngestionPipeline
from scraper.sources.adb import ADBCambodiaSource
from scraper.sources.afd_eu import AFDEUSource
from scraper.sources.jica import JICACambodiaSource
from scraper.sources.mef import MEFSource
from scraper.sources.ngo_cambodia import NGOCambodiaSource
from scraper.sources.state_utilities import StateUtilitiesSource
from scraper.sources.ungm import UNGMCambodiaSource
from scraper.sources.world_bank import WorldBankCambodiaSource


SOURCES = {
    "world_bank_kh": WorldBankCambodiaSource,
    "adb_kh": ADBCambodiaSource,
    "mef_gdipp": MEFSource,
    "ungm": UNGMCambodiaSource,
    "ngo_cambodia": NGOCambodiaSource,
    "state_utilities": StateUtilitiesSource,
    "jica_kh": JICACambodiaSource,
    "afd_eu_kh": AFDEUSource,
}


def run_ingestion(source_choice: str = "all", enable_ai: bool = True):
    """Executes the ingestion pipeline for requested sources."""
    if source_choice == "all":
        sources = [cls() for cls in SOURCES.values()]
    elif source_choice in SOURCES:
        sources = [SOURCES[source_choice]()]
    else:
        valid_keys = "', '".join(SOURCES.keys())
        print(f"Error: Unknown source '{source_choice}'. Valid options: '{valid_keys}', 'all'")
        sys.exit(1)

    print(f"\n[Ingest] Launching BidHubKH Ingestion Engine for {len(sources)} source(s)...")
    pipeline = IngestionPipeline()
    for source in sources:
        pipeline.run_source(source, enable_ai=enable_ai)

    print("\n[Ingest] All requested source ingestion runs completed successfully.")

def main():
    parser = argparse.ArgumentParser(description="BidHubKH Ingestion Engine")
    parser.add_argument(
        "--source",
        type=str,
        default="all",
        help="Source code to run ('world_bank_kh', 'adb_kh', 'mef_gdipp', 'ungm', 'ngo_cambodia', 'state_utilities', 'jica_kh', 'afd_eu_kh', 'all')"
    )
    parser.add_argument(
        "--no-ai",
        action="store_true",
        help="Disable AI extraction enrichment for quick testing"
    )
    args = parser.parse_args()

    run_ingestion(source_choice=args.source, enable_ai=not args.no_ai)

if __name__ == "__main__":
    main()
