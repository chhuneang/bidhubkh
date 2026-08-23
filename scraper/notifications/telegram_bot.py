"""
BidHubKH — Telegram Alert Bot Dispatcher
Sends rich markdown tender notifications directly to Telegram users, groups, or channels.
"""

import logging
import os
from typing import Any, Dict, Optional

import requests

logger = logging.getLogger(__name__)

class TelegramAlertBot:
    def __init__(self, bot_token: Optional[str] = None):
        self.bot_token = bot_token or os.getenv("TELEGRAM_BOT_TOKEN")
        self.base_url = f"https://api.telegram.org/bot{self.bot_token}" if self.bot_token else None

    @property
    def is_configured(self) -> bool:
        return bool(self.bot_token and len(self.bot_token) > 10)

    def send_message(self, chat_id: str, text: str, parse_mode: str = "Markdown") -> bool:
        """Sends a text message to a specific Telegram chat ID."""
        if not self.is_configured:
            logger.warning("Telegram bot token not configured. Skipping live Telegram message.")
            return False

        url = f"{self.base_url}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode,
            "disable_web_page_preview": False
        }

        try:
            resp = requests.post(url, json=payload, timeout=10)
            if resp.status_code == 200:
                logger.info(f"Successfully sent Telegram alert to chat {chat_id}")
                return True
            else:
                logger.error(f"Failed to send Telegram alert ({resp.status_code}): {resp.text}")
                return False
        except Exception as e:
            logger.error(f"Error calling Telegram API: {e}")
            return False

    def send_tender_alert(self, chat_id: str, tender: Dict[str, Any], web_base_url: str = "http://localhost:3000") -> bool:
        """Formats and sends a structured tender alert."""
        title = tender.get("title", "Untitled Tender")
        agency = tender.get("organization_name") or tender.get("source_code", "Cambodia Public Agency")
        budget = tender.get("estimated_value")
        currency = tender.get("currency", "USD")
        deadline = tender.get("deadline", "N/A")
        summary = tender.get("summary") or tender.get("description", "")
        slug = tender.get("slug", "")

        # Truncate summary if long
        if len(summary) > 280:
            summary = summary[:277] + "..."

        budget_str = f"${budget:,.2f} {currency}" if budget else "Contact Procuring Entity / SBD"
        tender_url = f"{web_base_url}/tenders/{slug}"

        message = (
            f"🔔 *NEW TENDER ALERT — BIDHUBKH* 🇰🇭\n\n"
            f"📋 *Opportunity*: {title}\n"
            f"🏛️ *Procuring Agency*: {agency}\n"
            f"💰 *Budget Estimate*: `{budget_str}`\n"
            f"⏳ *Submission Deadline*: `{deadline}`\n\n"
            f"🤖 *AI Scope Summary*:\n"
            f"_{summary}_\n\n"
            f"👉 [Open Tender & Check AI Match Score]({tender_url})"
        )

        return self.send_message(chat_id=chat_id, text=message)
