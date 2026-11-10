from adif_service import AdifService


def test_qso_to_dict_parses_adif_fields():
    service = AdifService([], spotter_callsigns=["4Z1ABC"])

    assert service._qso_to_dict("<CALL:5>W1ABC<FREQ:6>14.250") == {
        "CALL": "W1ABC",
        "FREQ": "14.250",
    }


def test_get_valid_entries_extracts_area_and_cleans_callsigns():
    record = (
        "<QSO_DATE:8>20240101"
        "<FREQ:6>14.250"
        "<STATION_CALLSIGN:8>4Z1ABC/P"
        "<OPERATOR:0>"
        "<CALL:7>W1XYZ/P"
        "<STX_STRING:0>"
        "<SRX_STRING:0>"
        "<COMMENT:19>worked from H08HF."
    )

    entries = AdifService([record], spotter_callsigns=["4Z1ABC"]).get_valid_entries()

    assert entries == [
        {
            "date": "20240101",
            "freq": "14.250",
            "spotter": "4Z1ABC",
            "dx": "W1XYZ",
            "area": "H08HF",
        }
    ]


def test_get_valid_entries_extracts_multiple_valid_area_fields():
    record = (
        "<QSO_DATE:8>20240101"
        "<FREQ:5>7.100"
        "<STATION_CALLSIGN:6>4Z1ABC"
        "<CALL:5>W1ABC"
        "<STX_STRING:5>H08HF"
        "<SRX_STRING:5>J05HF"
        "<COMMENT:0>"
    )

    entries = AdifService([record], spotter_callsigns=["4Z1ABC"]).get_valid_entries()

    assert [entry["area"] for entry in entries] == ["H08HF", "J05HF"]


def test_get_valid_entries_ignores_unknown_area_codes():
    record = (
        "<QSO_DATE:8>20240101"
        "<FREQ:6>14.250"
        "<STATION_CALLSIGN:6>4Z1ABC"
        "<CALL:5>W1ABC"
        "<COMMENT:5>H99HF"
    )

    assert AdifService([record], spotter_callsigns=["4Z1ABC"]).get_valid_entries() == []


def test_get_valid_entries_preserves_matched_linked_callsign():
    record = (
        "<QSO_DATE:8>20240101"
        "<FREQ:6>14.250"
        "<STATION_CALLSIGN:6>4Z1ABC"
        "<OPERATOR:6>N0CALL"
        "<CALL:5>W1ABC"
        "<COMMENT:5>H08HF"
    )

    entries = AdifService(
        [record], spotter_callsigns=["N0CALL", "4Z1ABC"]
    ).get_valid_entries()

    assert entries[0]["spotter"] == "4Z1ABC"


def test_get_valid_entries_uses_operator_when_station_is_not_owned():
    record = (
        "<QSO_DATE:8>20240101"
        "<FREQ:6>14.250"
        "<STATION_CALLSIGN:5>K1BAD"
        "<OPERATOR:6>N0CALL"
        "<CALL:5>W1ABC"
        "<COMMENT:5>H08HF"
    )

    entries = AdifService([record], spotter_callsigns=["N0CALL"]).get_valid_entries()

    assert entries[0]["spotter"] == "N0CALL"


def test_get_valid_entries_skips_qsos_without_owned_station_or_operator():
    record = (
        "<QSO_DATE:8>20240101"
        "<FREQ:6>14.250"
        "<STATION_CALLSIGN:5>K1BAD"
        "<OPERATOR:5>W1BAD"
        "<CALL:5>W1ABC"
        "<COMMENT:5>H08HF"
    )

    assert AdifService([record], spotter_callsigns=["N0CALL"]).get_valid_entries() == []


def test_get_valid_entries_finds_area_in_non_standard_software_specific_field():
    # Contest-log exports (e.g. N1MM via ADIFMaster) carry the received
    # exchange in software-specific APP_* fields rather than
    # STX_STRING/SRX_STRING/COMMENT. Any field's content should be scanned,
    # regardless of its name.
    record = (
        "<QSO_DATE:8>20240101"
        "<FREQ:6>14.250"
        "<STATION_CALLSIGN:6>4Z1ABC"
        "<CALL:5>W1ABC"
        "<APP_N1MM_EXCHANGE1:5>H08HF"
    )

    entries = AdifService([record], spotter_callsigns=["4Z1ABC"]).get_valid_entries()

    assert [entry["area"] for entry in entries] == ["H08HF"]


def test_get_valid_entries_ignores_rst_sent_as_own_station_square():
    # RST_SENT is the report WE sent, not what we received - contest
    # software that folds the station's own square into this field (a
    # constant value across every QSO in the log) must not have it credited
    # as a "worked" area.
    record = (
        "<QSO_DATE:8>20240101"
        "<FREQ:6>14.250"
        "<STATION_CALLSIGN:6>4Z1ABC"
        "<CALL:5>W1ABC"
        "<RST_SENT:5>H08HF"
    )

    assert AdifService([record], spotter_callsigns=["4Z1ABC"]).get_valid_entries() == []


def test_get_valid_entries_dedupes_same_area_repeated_across_fields():
    # Some software duplicates the received exchange into a second field
    # (e.g. N1MM's SECT mirrors APP_N1MM_EXCHANGE1) - the same square must
    # only be credited once per QSO.
    record = (
        "<QSO_DATE:8>20240101"
        "<FREQ:6>14.250"
        "<STATION_CALLSIGN:6>4Z1ABC"
        "<CALL:5>W1ABC"
        "<APP_N1MM_EXCHANGE1:5>H08HF"
        "<SECT:5>H08HF"
    )

    entries = AdifService([record], spotter_callsigns=["4Z1ABC"]).get_valid_entries()

    assert [entry["area"] for entry in entries] == ["H08HF"]


def test_parse_freq_tolerates_missing_or_empty_frequency():
    from main import _parse_freq

    assert _parse_freq("14.250") == 14.25
    assert _parse_freq("") == 0.0
    assert _parse_freq(None) == 0.0


def test_parse_freq_rejects_non_finite_values():
    from main import _parse_freq

    for bad in ("nan", "inf", "-inf", "1e9999"):
        assert _parse_freq(bad) == 0.0


def test_parse_adif_turns_unreadable_files_into_a_400():
    import pytest
    from fastapi import HTTPException
    from main import _parse_adif

    for bad in (b"", b"this is not adif", b"\x00\x01\xff<CALL:5>W1ABC<EOR>"):
        with pytest.raises(HTTPException) as exc:
            _parse_adif(bad)
        assert exc.value.status_code == 400

    assert len(_parse_adif(b"<CALL:5>W1ABC<EOR>")) == 1


def test_get_unmatched_callsigns_lists_foreign_callsigns_with_squares():
    def record(station, area="H08HF"):
        return (
            "<QSO_DATE:8>20240101<FREQ:6>14.250"
            f"<STATION_CALLSIGN:{len(station)}>{station}"
            f"<CALL:5>W1ABC<COMMENT:{len(area)}>{area}"
        )

    service = AdifService(
        [
            record("4X1OLD/P"),
            record("4X1OLD", "J05HF"),
            record("4X1OTH"),
            record("4Z1ABC"),  # the user's own - not unmatched
            record("4X1NOSQ", "NOSQR"),  # no valid square - not worth asking about
        ],
        spotter_callsigns=["4Z1ABC"],
    )

    assert service.get_unmatched_callsigns() == [
        {"callsign": "4X1OLD", "qsos": 2},
        {"callsign": "4X1OTH", "qsos": 1},
    ]


def test_clean_callsign_handles_suffixes_and_country_prefixes():
    from adif_service import clean_callsign

    cases = {
        "4Z5SL": "4Z5SL",
        "4z5sl/m": "4Z5SL",
        "4Z5SL/P": "4Z5SL",
        "4Z5SL/MM": "4Z5SL",
        "4Z5SL/QRP": "4Z5SL",
        "4Z5SL/1": "4Z5SL",
        "OH/4Z5SL": "4Z5SL",
        "VK9/4Z5SL/P": "4Z5SL",
        " 4x/4z5sl ": "4Z5SL",
        "": "",
        "/": "",
    }
    for raw, expected in cases.items():
        assert clean_callsign(raw) == expected, raw


def test_get_valid_entries_matches_prefix_style_portable_callsign():
    record = (
        "<QSO_DATE:8>20240101<FREQ:6>14.250"
        "<STATION_CALLSIGN:9>OH/4Z5SL/P<CALL:5>W1ABC<COMMENT:5>H08HF"
    )

    entries = AdifService([record], spotter_callsigns=["4Z5SL"]).get_valid_entries()

    assert [entry["spotter"] for entry in entries] == ["4Z5SL"]
