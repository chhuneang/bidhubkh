#!/usr/bin/env python3
"""
BidHubKH Data Ingestion CLI Runner
Usage:
  python -m scraper.ingest --source world_bank_kh
  python -m scraper.ingest --source adb_kh
  python -m scraper.ingest --source all
"""

import argparse
import sys
from scraper.sources.world_bank import WorldBankCambodiaSource
from scraper.sources.adb import ADBCambodiaSource
from scraper.pipeline import IngestionPipeline

def main():
    parser = argparse.ArgumentParser(description="BidHubKH Ingestion Engine")
    parser.add_argument(
        "--source",
        type=str,
        default="all",
        help="Source code to run ('world_bank_kh', 'adb_kh', 'all')"
    )
    args = parser.parse_args()

    pipeline = IngestionPipeline()
    sources = []

    if args.source in ["world_bank_kh", "all"]:
        sources.append(WorldBankCambodiaSource())

    if args.source in ["adb_kh", "all"]:
        sources.append(ADBCambodiaSource())

    if not sources:
        print(f"Error: Unknown source '{args.source}'. Valid options: 'world_bank_kh', 'adb_kh', 'all'")
        sys.exit(1)

    print(f"\n[Ingest] Launching BidHubKH Ingestion Engine for {len(sources)} source(s)...")
    for source in sources:
        pipeline.run_source(source)

    print("\n[Ingest] All requested source ingestion runs completed successfully.")

if __name__ == "__main__":
    main()
