from types import SimpleNamespace

import pytest

from users import service as user_service


@pytest.mark.parametrize(
    ("raw_callsign", "normalized_callsign"),
    [
        (" 4z1abc ", "4Z1ABC"),
        ("n0call", "N0CALL"),
    ],
)
def test_normalize_callsign_trims_and_uppercases(raw_callsign, normalized_callsign):
    assert user_service.normalize_callsign(raw_callsign) == normalized_callsign


@pytest.mark.parametrize(
    ("callsign", "message"),
    [
        ("", "Callsign is required"),
        ("ABC", "Callsign must contain both letters and numbers"),
        ("123", "Callsign must contain both letters and numbers"),
        ("4Z-ABC", "Callsign must contain only letters and numbers"),
    ],
)
def test_normalize_callsign_rejects_invalid_values(callsign, message):
    with pytest.raises(ValueError, match=message):
        user_service.normalize_callsign(callsign)


def test_update_user_profile_rejects_invalid_region(monkeypatch):
    monkeypatch.setattr(user_service, "get_user_by_callsign", lambda db, callsign: None)

    with pytest.raises(ValueError, match="Region must be 0"):
        user_service.update_user_profile(None, "user_1", "4Z1ABC", 4)


def test_update_user_profile_rejects_callsign_owned_by_another_user(monkeypatch):
    monkeypatch.setattr(
        user_service,
        "get_user_by_callsign",
        lambda db, callsign: SimpleNamespace(clerk_user_id="user_2"),
    )

    with pytest.raises(ValueError, match="Callsign 4Z1ABC is already taken"):
        user_service.update_user_profile(None, "user_1", "4z1abc", 1)


def test_update_user_profile_saves_normalized_callsign(monkeypatch):
    saved_profile = SimpleNamespace(clerk_user_id="user_1", callsign="4Z1ABC", region=0)
    calls = {}

    def fake_update_user_profile(db, clerk_user_id, callsign, region):
        calls.update(
            {
                "db": db,
                "clerk_user_id": clerk_user_id,
                "callsign": callsign,
                "region": region,
            }
        )
        return saved_profile

    db = object()
    monkeypatch.setattr(user_service, "get_user_by_callsign", lambda db, callsign: None)
    monkeypatch.setattr(
        user_service, "repo_update_user_profile", fake_update_user_profile
    )

    result = user_service.update_user_profile(db, "user_1", " 4z1abc ", 0)

    assert result is saved_profile
    assert calls == {
        "db": db,
        "clerk_user_id": "user_1",
        "callsign": "4Z1ABC",
        "region": 0,
    }
