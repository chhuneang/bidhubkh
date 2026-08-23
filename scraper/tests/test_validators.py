"""Table-driven tests for scraper/validators/rules.py (Milestone 15a)."""

from datetime import datetime, timedelta

import pytest

from scraper.validators.rules import (
    WARNING,
    normalize_title,
    validate_tender,
)

PUBLISHED = datetime(2026, 8, 1, 9, 0, 0)
DEADLINE = datetime(2026, 9, 1, 17, 0, 0)


def valid_kwargs(**overrides):
    kwargs = {
        "title": "Supply of 450 laptops for secondary school computer labs",
        "organization_name": "World Bank Cambodia",
        "published_at": PUBLISHED,
        "deadline": DEADLINE,
        "estimated_value": 285000.0,
        "currency": "USD",
        "original_url": "https://projects.worldbank.org/notices/WB-1234",
    }
    kwargs.update(overrides)
    return kwargs


class TestCleanTender:
    def test_passes_with_no_issues_and_full_confidence(self):
        result = validate_tender(**valid_kwargs())
        assert result.passed_critical
        assert result.issues == []
        assert result.confidence_score == 100
        assert result.errors_as_list() == []

    def test_missing_deadline_is_warning_not_critical(self):
        result = validate_tender(**valid_kwargs(deadline=None))
        assert result.passed_critical
        assert [i.rule for i in result.issues] == ["deadline_present"]
        assert result.confidence_score == 95


class TestCriticalRules:
    @pytest.mark.parametrize("title", ["", "   ", None])
    def test_empty_title_quarantines(self, title):
        result = validate_tender(**valid_kwargs(title=title))
        assert not result.passed_critical
        assert any(i.rule == "title_not_empty" for i in result.critical_issues)

    @pytest.mark.parametrize(
        "deadline", [PUBLISHED, PUBLISHED - timedelta(days=1)]
    )
    def test_deadline_must_be_after_published(self, deadline):
        result = validate_tender(**valid_kwargs(deadline=deadline))
        assert not result.passed_critical
        assert any(i.rule == "deadline_after_published" for i in result.critical_issues)

    @pytest.mark.parametrize("value", [-1.0, -250000.99])
    def test_negative_estimated_value_quarantines(self, value):
        result = validate_tender(**valid_kwargs(estimated_value=value))
        assert not result.passed_critical
        assert any(i.rule == "estimated_value_non_negative" for i in result.critical_issues)

    def test_zero_estimated_value_warns_only(self):
        result = validate_tender(**valid_kwargs(estimated_value=0))
        assert result.passed_critical
        assert any(i.rule == "estimated_value_zero" for i in result.issues)

    @pytest.mark.parametrize("currency", ["EUR", "", None, "THB"])
    def test_non_usd_khr_currency_quarantines(self, currency):
        result = validate_tender(**valid_kwargs(currency=currency))
        assert not result.passed_critical
        assert any(i.rule == "currency_allowed" for i in result.critical_issues)

    def test_lowercase_currency_is_accepted(self):
        result = validate_tender(**valid_kwargs(currency="khr"))
        assert result.passed_critical

    @pytest.mark.parametrize(
        "url",
        [
            "",
            None,
            "not-a-url",
            "ftp://files.example.com/doc.pdf",
            "javascript:alert(1)",
            "https://",
        ],
    )
    def test_malformed_original_url_quarantines(self, url):
        result = validate_tender(**valid_kwargs(original_url=url))
        assert not result.passed_critical
        assert any(i.rule == "original_url_well_formed" for i in result.critical_issues)

    @pytest.mark.parametrize("org", ["", "   ", None])
    def test_missing_organization_quarantines(self, org):
        result = validate_tender(**valid_kwargs(organization_name=org))
        assert not result.passed_critical
        assert any(i.rule == "organization_not_empty" for i in result.critical_issues)

    def test_short_title_warns_but_does_not_quarantine(self):
        result = validate_tender(**valid_kwargs(title="Laptops"))
        assert result.passed_critical
        assert any(i.severity == WARNING for i in result.issues)


class TestConfidenceScoring:
    def test_each_critical_deducts_15(self):
        one = validate_tender(**valid_kwargs(currency="EUR"))
        two = validate_tender(**valid_kwargs(currency="EUR", estimated_value=-5))
        assert one.confidence_score == 85
        assert two.confidence_score == 70

    def test_score_never_goes_below_zero(self):
        result = validate_tender(
            **valid_kwargs(
                title="",
                organization_name=None,
                currency="EUR",
                estimated_value=-5,
                original_url="bad",
            )
        )
        assert result.confidence_score >= 0


class TestNormalizeTitle:
    @pytest.mark.parametrize(
        ("raw", "expected"),
        [
            ("Procurement of Laptops!!", "procurement of laptops"),
            ("Min. of Economy  &  Finance", "ministry of economy finance"),
            ("MINISTRY   of Health", "ministry of health"),
            ("  Multiple    Spaces   Here  ", "multiple spaces here"),
            ("EDC Power Distribution", "electricite du cambodge power distribution"),
        ],
    )
    def test_normalization(self, raw, expected):
        assert normalize_title(raw) == expected

    def test_same_meaning_titles_collapse_to_one_fingerprint_input(self):
        a = normalize_title("Supply of Medical Equipment — Min. of Health")
        b = normalize_title("supply of medical equipment min of health")
        assert a == b
