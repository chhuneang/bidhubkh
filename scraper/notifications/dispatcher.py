"""
BidHubKH — Notification Dispatcher Engine
Matches newly ingested tenders against active user alert rules and broadcasts via Telegram / Email.
"""

import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

# Ensure environment variables are loaded
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)

from supabase import Client, create_client

from scraper.notifications.telegram_bot import TelegramAlertBot

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

class NotificationDispatcher:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = (
            os.getenv("SUPABASE_SERVICE_ROLE_KEY") or
            os.getenv("SUPABASE_ANON_KEY") or
            os.getenv("SUPABASE_KEY")
        )
        self.client: Client = create_client(self.supabase_url, self.supabase_key) if self.supabase_url and self.supabase_key else None
        self.telegram_bot = TelegramAlertBot()

    def get_active_alert_rules(self) -> List[Dict[str, Any]]:
        """Fetches all active alert rules configured by suppliers in Supabase."""
        if not self.client:
            logger.warning("Supabase client not initialized.")
            return []

        try:
            resp = self.client.table("alerts").select("*").eq("active", True).execute()
            return resp.data or []
        except Exception as e:
            logger.error(f"Error querying alert rules: {e}")
            return []

    def matches_rule(self, tender: Dict[str, Any], rule: Dict[str, Any]) -> bool:
        """Evaluates whether a tender matches a given alert rule."""
        title = (tender.get("title") or "").lower()
        summary = (tender.get("summary") or "").lower()
        description = (tender.get("description") or "").lower()
        products = tender.get("products_services") or []
        if isinstance(products, list):
            products_str = " ".join(products).lower()
        else:
            products_str = str(products).lower()

        full_text = f"{title} {summary} {description} {products_str}"

        # 1. Keyword check
        keywords = rule.get("keywords") or []
        if keywords:
            matched_kw = False
            for kw in keywords:
                if kw.strip().lower() in full_text:
                    matched_kw = True
                    break
            if not matched_kw:
                return False

        # 2. Budget criteria check
        min_val = rule.get("minimum_value")
        max_val = rule.get("maximum_value")
        tender_val = tender.get("estimated_value")

        if tender_val is not None:
            if min_val is not None and tender_val < float(min_val):
                return False
            if max_val is not None and tender_val > float(max_val):
                return False

        return True

    def dispatch_tender_alerts(self, tenders: List[Dict[str, Any]]) -> int:
        """Matches a batch of incoming tenders against active alert rules and dispatches alerts."""
        if not tenders:
            logger.info("No tenders to dispatch.")
            return 0

        rules = self.get_active_alert_rules()
        logger.info(f"Loaded {len(rules)} active supplier alert rules from Supabase.")

        dispatched_count = 0

        for tender in tenders:
            for rule in rules:
                if self.matches_rule(tender, rule):
                    title = tender.get("title") or "Untitled tender"
                    logger.info(f"⚡ Match found! Tender '{title[:40]}...' matches Rule '{rule.get('name')}'")

                    # Dispatch Telegram notification if configured
                    telegram_chat_id = rule.get("telegram_chat_id")
                    if telegram_chat_id and rule.get("telegram_notifications", True):
                        if self.telegram_bot.is_configured:
                            self.telegram_bot.send_tender_alert(chat_id=telegram_chat_id, tender=tender)
                        else:
                            logger.info(f"[SIMULATED TELEGRAM] Alert sent to chat {telegram_chat_id}: {tender.get('title')}")

                    dispatched_count += 1

        logger.info(f"✅ Notification dispatch complete. {dispatched_count} alert notifications processed.")
        return dispatched_count

def run_test_dispatch(test_chat_id: Optional[str] = None):
    """Test function for verifying alert dispatch."""
    dispatcher = NotificationDispatcher()
    sample_tender = {
        "title": "Supply & Installation of 450 High-Performance Workstation Laptops for Ministry Labs",
        "slug": "wb-kh-450-high-performance-laptops",
        "organization_name": "Ministry of Economy and Finance (MEF)",
        "source_code": "mef_gdipp",
        "estimated_value": 450000.0,
        "currency": "USD",
        "deadline": "2026-09-30",
        "summary": "Turnkey procurement of 450 enterprise-grade laptops and peripheral equipment with 3-year on-site manufacturer warranty.",
        "products_services": ["Laptops", "Docking Stations", "Workstations"]
    }

    if test_chat_id:
        logger.info(f"🚀 Sending direct test tender alert to Telegram Chat ID: {test_chat_id}")
        if dispatcher.telegram_bot.is_configured:
            success = dispatcher.telegram_bot.send_tender_alert(chat_id=test_chat_id, tender=sample_tender)
            if success:
                logger.info("🎉 SUCCESS! Check your Telegram app for the tender card.")
            else:
                logger.error("❌ Failed to send message. Make sure you clicked START on your bot in Telegram first!")
        else:
            logger.warning("Telegram Bot Token is not configured in scraper/.env")
    else:
        logger.info("Running database alert rules dispatch...")
        dispatcher.dispatch_tender_alerts([sample_tender])

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="BidHubKH Telegram Alert Dispatcher")
    parser.add_argument("--chat-id", type=str, help="Send a direct test alert to this Telegram Chat ID")
    args = parser.parse_args()

    run_test_dispatch(test_chat_id=args.chat_id)
