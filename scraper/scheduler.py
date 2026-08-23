"""
BidHubKH — Autonomous Background Ingestion Scheduler
Executes automated, scheduled sweeps across all 6 Cambodian procurement sources,
orchestrating AI intelligence summarization and instant Telegram alert dispatch.
"""

import time
import argparse
import logging
from datetime import datetime
from scraper.ingest import run_ingestion

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("BidHubKH-Scheduler")

def start_scheduler(interval_minutes: int = 360, run_once: bool = False):
    """
    Runs periodic crawler sweeps across all 6 procurement sources.
    Default interval: 360 minutes (every 6 hours).
    """
    logger.info(f"🚀 Starting BidHubKH Ingestion Scheduler (Interval: {interval_minutes} mins)")

    iteration = 1
    while True:
        start_time = datetime.now()
        logger.info(f"\n=======================================================")
        logger.info(f"🔄 Starting Scheduled Ingestion Sweep #{iteration} at {start_time.isoformat()}")
        logger.info(f"=======================================================")

        try:
            # Run multi-source pipeline for all 6 sources
            run_ingestion(source_choice="all", enable_ai=True)
            logger.info(f"✅ Scheduled sweep #{iteration} completed successfully.")
        except Exception as e:
            logger.error(f"❌ Scheduled sweep #{iteration} encountered an error: {e}")

        if run_once:
            logger.info("Scheduler execution finished (--once mode).")
            break

        logger.info(f"⏳ Sleeping for {interval_minutes} minutes until next scheduled sweep...")
        time.sleep(interval_minutes * 60)
        iteration += 1

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="BidHubKH Autonomous Ingestion Scheduler")
    parser.add_argument("--interval", type=int, default=360, help="Sweep interval in minutes (default: 360)")
    parser.add_argument("--once", action="store_true", help="Run a single sweep and exit")
    args = parser.parse_args()

    start_scheduler(interval_minutes=args.interval, run_once=args.once)
