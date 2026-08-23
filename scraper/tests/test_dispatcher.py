"""Tests for scraper/notifications/dispatcher.py — pure rule-matching logic.

NotificationDispatcher is instantiated with Supabase/Telegram env vars stripped, so
``client`` is None and the bot is unconfigured: no network access happens. Rule
sources for dispatch tests are injected by overriding ``get_active_alert_rules``
on the instance.
"""

import pytest

from scraper.notifications.dispatcher import NotificationDispatcher

ENV_VARS_TO_STRIP = (
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_ANON_KEY",
    "SUPABASE_KEY",
    "TELEGRAM_BOT_TOKEN",
)


@pytest.fixture
def dispatcher(monkeypatch):
    for var in ENV_VARS_TO_STRIP:
        monkeypatch.delenv(var, raising=False)
    return NotificationDispatcher()


def tender(**overrides):
    base = {
        "title": "Supply of 450 High-Performance Laptops for Ministry Labs",
        "summary": "Turnkey procurement of enterprise laptops with 3-year warranty.",
        "description": "Delivery to Phnom Penh including installation and training.",
        "products_services": ["Laptops", "Docking Stations"],
        "estimated_value": 450000.0,
        "currency": "USD",
    }
    base.update(overrides)
    return base


def rule(**overrides):
    base = {
        "name": "laptops-under-500k",
        "keywords": ["laptop"],
        "minimum_value": None,
        "maximum_value": None,
    }
    base.update(overrides)
    return base


class TestKeywordMatching:
    def test_keyword_hit(self, dispatcher):
        assert dispatcher.matches_rule(tender(), rule(keywords=["laptop"])) is True

    def test_keyword_miss(self, dispatcher):
        assert dispatcher.matches_rule(tender(), rule(keywords=["excavator"])) is False

    def test_case_insensitive(self, dispatcher):
        # Tender title uses "Laptops", rule stores "LAPTOP".
        assert dispatcher.matches_rule(tender(), rule(keywords=["LAPTOP"])) is True
        assert dispatcher.matches_rule(tender(title="SOLAR PANELS"), rule(keywords=["solar"])) is True

    def test_any_of_multiple_keywords_matches(self, dispatcher):
        # OR semantics: a single hit among several keywords is enough.
        r = rule(keywords=["excavator", "laptop", "generator"])
        assert dispatcher.matches_rule(tender(), r) is True

    def test_all_keywords_missing_fails(self, dispatcher):
        r = rule(keywords=["excavator", "generator"])
        assert dispatcher.matches_rule(tender(), r) is False

    def test_keywords_searched_across_all_text_fields(self, dispatcher):
        assert dispatcher.matches_rule(tender(), rule(keywords=["warranty"])) is True  # summary
        assert dispatcher.matches_rule(tender(), rule(keywords=["phnom penh"])) is True  # description
        assert dispatcher.matches_rule(tender(), rule(keywords=["docking"])) is True  # products

    def test_keyword_whitespace_is_stripped(self, dispatcher):
        assert dispatcher.matches_rule(tender(), rule(keywords=["  laptop  "])) is True


class TestBudgetBoundaries:
    def test_exact_minimum_is_inclusive(self, dispatcher):
        r = rule(minimum_value=450000.0)
        assert dispatcher.matches_rule(tender(estimated_value=450000.0), r) is True

    def test_just_below_minimum_fails(self, dispatcher):
        r = rule(minimum_value=450000.01)
        assert dispatcher.matches_rule(tender(estimated_value=450000.0), r) is False

    def test_exact_maximum_is_inclusive(self, dispatcher):
        r = rule(maximum_value=450000.0)
        assert dispatcher.matches_rule(tender(estimated_value=450000.0), r) is True

    def test_just_above_maximum_fails(self, dispatcher):
        r = rule(maximum_value=449999.99)
        assert dispatcher.matches_rule(tender(estimated_value=450000.0), r) is False

    def test_value_within_window_passes(self, dispatcher):
        r = rule(minimum_value=100000.0, maximum_value=500000.0)
        assert dispatcher.matches_rule(tender(estimated_value=250000.0), r) is True

    def test_string_rule_bounds_are_coerced_to_float(self, dispatcher):
        r = rule(minimum_value="100000", maximum_value="500000")
        assert dispatcher.matches_rule(tender(estimated_value=250000.0), r) is True
        assert dispatcher.matches_rule(tender(estimated_value=50.0), r) is False

    def test_missing_estimated_value_bypasses_budget_bounds(self, dispatcher):
        # Documented behaviour: a tender without estimated_value can never fail the
        # budget check, even against rules that would exclude every real amount.
        too_cheap_rule = rule(minimum_value=1000000.0)
        too_expensive_rule = rule(maximum_value=1.0)
        window_rule = rule(minimum_value=1000000.0, maximum_value=2000000.0)
        assert dispatcher.matches_rule(tender(estimated_value=None), too_cheap_rule) is True
        assert dispatcher.matches_rule(tender(estimated_value=None), too_expensive_rule) is True
        assert dispatcher.matches_rule(tender(estimated_value=None), window_rule) is True

    def test_zero_estimated_value_is_still_checked_against_bounds(self, dispatcher):
        r = rule(minimum_value=1.0)
        assert dispatcher.matches_rule(tender(estimated_value=0.0), r) is False


class TestCombinedCriteria:
    def test_keyword_and_budget_both_must_pass(self, dispatcher):
        matching_kw_out_of_budget = rule(keywords=["laptop"], maximum_value=100.0)
        assert dispatcher.matches_rule(tender(), matching_kw_out_of_budget) is False

        in_budget_wrong_kw = rule(keywords=["bulldozer"], maximum_value=999999.0)
        assert dispatcher.matches_rule(tender(), in_budget_wrong_kw) is False

        both_match = rule(keywords=["laptop"], minimum_value=100000.0)
        assert dispatcher.matches_rule(tender(), both_match) is True

    def test_empty_or_missing_keywords_skip_keyword_gate(self, dispatcher):
        assert dispatcher.matches_rule(tender(), rule(keywords=[])) is True
        assert dispatcher.matches_rule(tender(), rule(keywords=None)) is True

    def test_products_services_as_plain_string_still_searched(self, dispatcher):
        t = tender(products_services="Solar PV Mini-Grid Kits")
        assert dispatcher.matches_rule(t, rule(keywords=["mini-grid"])) is True

    def test_products_services_as_non_list_non_string_is_stringified(self, dispatcher):
        t = tender(products_services=12345)
        assert dispatcher.matches_rule(t, rule(keywords=["12345"])) is True

    def test_missing_optional_fields_do_not_crash(self, dispatcher):
        bare = {"title": None, "summary": None, "description": None}
        assert dispatcher.matches_rule(bare, rule()) is False  # keyword miss, no crash
        assert dispatcher.matches_rule(bare, rule(keywords=[])) is True


class TestDispatchTenderAlerts:
    def test_counts_one_dispatch_per_matching_tender_rule_pair(self, dispatcher):
        t_laptops = tender()
        t_solar = tender(
            title="Solar mini-grid systems for health centres",
            summary="Photovoltaic systems.",
            description="Rural energy.",
            products_services=["Solar Panels"],
            estimated_value=300000.0,
        )
        rules = [
            rule(name="laptop-rule"),
            rule(name="everything-tech", keywords=["tech"]),
            rule(name="solar-rule", keywords=["solar"], maximum_value=350000.0),
            rule(name="never-matches", keywords=["submarine"]),
        ]
        dispatcher.get_active_alert_rules = lambda: rules

        count = dispatcher.dispatch_tender_alerts([t_laptops, t_solar])
        # laptops: rule1 hits, solar: rule3 hits -> 2 pairings.
        assert count == 2

    def test_rule_order_does_not_change_total_dispatch_count(self, dispatcher):
        tenders = [tender()]
        forward = [
            rule(name="a", keywords=["laptop"]),
            rule(name="b", keywords=["laptops"]),
        ]
        reversed_rules = list(reversed(forward))

        dispatcher.get_active_alert_rules = lambda: forward
        assert dispatcher.dispatch_tender_alerts(tenders) == 2
        dispatcher.get_active_alert_rules = lambda: reversed_rules
        assert dispatcher.dispatch_tender_alerts(tenders) == 2

    def test_no_rules_means_no_dispatches(self, dispatcher):
        dispatcher.get_active_alert_rules = lambda: []
        assert dispatcher.dispatch_tender_alerts([tender()]) == 0

    def test_empty_tender_batch_short_circuits_before_loading_rules(self, dispatcher):
        def boom():
            raise AssertionError("rules must not be loaded for an empty batch")

        dispatcher.get_active_alert_rules = boom
        assert dispatcher.dispatch_tender_alerts([]) == 0

    def test_unconfigured_telegram_does_not_send_but_still_counts(self, dispatcher):
        # With no TELEGRAM_BOT_TOKEN the bot performs no HTTP request, and the
        # matching pairing is still counted.
        dispatcher.get_active_alert_rules = lambda: [rule(name="r1")]
        assert dispatcher.dispatch_tender_alerts([tender()]) == 1
        assert dispatcher.telegram_bot.is_configured is False


class TestSupabaseClientGuard:
    def test_get_active_alert_rules_without_client_returns_empty(self, dispatcher):
        assert dispatcher.client is None
        assert dispatcher.get_active_alert_rules() == []
