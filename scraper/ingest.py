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
from scraper.sources.world_bank import WorldBankCambodiaSource
from scraper.sources.adb import ADBCambodiaSource
from scraper.sources.mef import MEFSource
from scraper.sources.ungm import UNGMCambodiaSource
from scraper.sources.ngo_cambodia import NGOCambodiaSource
from scraper.sources.state_utilities import StateUtilitiesSource
from scraper.pipeline import IngestionPipeline

def run_ingestion(source_choice: str = "all", enable_ai: bool = True):
    """Executes the ingestion pipeline for requested sources."""
    pipeline = IngestionPipeline()
    sources = []

    if source_choice in ["world_bank_kh", "all"]:
        sources.append(WorldBankCambodiaSource())

    if source_choice in ["adb_kh", "all"]:
        sources.append(ADBCambodiaSource())

    if source_choice in ["mef_gdipp", "all"]:
        sources.append(MEFSource())

    if source_choice in ["ungm", "all"]:
        sources.append(UNGMCambodiaSource())

    if source_choice in ["ngo_cambodia", "all"]:
        sources.append(NGOCambodiaSource())

    if source_choice in ["state_utilities", "all"]:
        sources.append(StateUtilitiesSource())

    if not sources:
        print(f"Error: Unknown source '{source_choice}'. Valid options: 'world_bank_kh', 'adb_kh', 'mef_gdipp', 'ungm', 'ngo_cambodia', 'state_utilities', 'all'")
        sys.exit(1)

    print(f"\n[Ingest] Launching BidHubKH Ingestion Engine for {len(sources)} source(s)...")
    for source in sources:
        pipeline.run_source(source, enable_ai=enable_ai)

    print("\n[Ingest] All requested source ingestion runs completed successfully.")

def main():
    parser = argparse.ArgumentParser(description="BidHubKH Ingestion Engine")
    parser.add_argument(
        "--source",
        type=str,
        default="all",
        help="Source code to run ('world_bank_kh', 'adb_kh', 'mef_gdipp', 'ungm', 'ngo_cambodia', 'state_utilities', 'all')"
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
