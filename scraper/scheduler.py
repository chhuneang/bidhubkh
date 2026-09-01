"""
BidHubKH — Autonomous Ingestion Scheduler
Executes automated, recurring sweeps across all 6 official Cambodian procurement sources,
extracts real opportunities, generates AI intelligence summaries, validates URLs, and dispatches real-time alerts.

Usage:
  python -m scraper.scheduler --hours 4       # Sweep every 4 hours (default)
  python -m scraper.scheduler --hours 6       # Sweep every 6 hours
  python -m scraper.scheduler --once          # Run a single sweep immediately and exit
"""

import argparse
import logging
import os
import signal
import sys
import time
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

from scraper.ingest import run_ingestion

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("Scheduler")

_shutdown_requested = False


def _signal_handler(sig, frame):
    global _shutdown_requested
    logger.info("🛑 Graceful shutdown signal received. Finishing active operations...")
    _shutdown_requested = True
    sys.exit(0)


def start_scheduler(interval_hours: float = 4.0, run_once: bool = False):
    """
    Runs periodic crawler sweeps across all 6 official Cambodian procurement sources.
    Default interval: 4 hours (240 minutes).
    """
    global _shutdown_requested
    signal.signal(signal.SIGINT, _signal_handler)
    try:
        signal.signal(signal.SIGTERM, _signal_handler)
    except Exception:
        pass

    interval_minutes = int(interval_hours * 60)
    interval_seconds = interval_minutes * 60

    logger.info("================================================================")
    logger.info("🇰🇭 BIDHUBKH AUTONOMOUS PROCUREMENT INGESTION ENGINE")
    logger.info(f"⏰ Recurring Interval : Every {interval_hours:g} hours ({interval_minutes} minutes)")
    logger.info(f"🌐 Sources Included   : World Bank, ADB, MEF/GDPP, UNGM, NGOs, EDC/PPWSA")
    logger.info("================================================================")

    iteration = 1
    while not _shutdown_requested:
        sweep_start = datetime.now(timezone.utc)
        logger.info(f"\n🚀 [Sweep #{iteration}] Starting automated crawler at {sweep_start.strftime('%Y-%m-%d %H:%M:%S UTC')}")

        try:
            # Execute full multi-source ingestion pipeline
            run_ingestion(source_choice="all", enable_ai=True)
            sweep_duration = (datetime.now(timezone.utc) - sweep_start).total_seconds()
            logger.info(f"✅ [Sweep #{iteration}] Completed successfully in {sweep_duration:.1f}s.")
        except Exception as err:
            logger.error(f"❌ [Sweep #{iteration}] Error during ingestion sweep: {err}", exc_info=True)

        if run_once or _shutdown_requested:
            logger.info("Scheduler execution finished (--once mode).")
            break

        next_run = datetime.now(timezone.utc) + timedelta(seconds=interval_seconds)
        logger.info(f"⏳ Sleeping for {interval_hours:g} hours. Next automated sweep at: {next_run.strftime('%Y-%m-%d %H:%M:%S UTC')} (in {interval_minutes}m)")
        
        try:
            time.sleep(interval_seconds)
        except (KeyboardInterrupt, SystemExit):
            break

        iteration += 1


def main():
    default_hours = float(os.getenv("SCHEDULE_INTERVAL_HOURS", "4.0"))

    parser = argparse.ArgumentParser(description="BidHubKH Autonomous Ingestion Scheduler")
    parser.add_argument(
        "--hours",
        "-H",
        type=float,
        default=default_hours,
        help=f"Recurring sweep interval in hours (default: {default_hours:g}h, configurable via SCHEDULE_INTERVAL_HOURS)"
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Run a single full sweep immediately and exit"
    )
    args = parser.parse_args()

    start_scheduler(interval_hours=args.hours, run_once=args.once)


if __name__ == "__main__":
    main()
