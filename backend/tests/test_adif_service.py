from adif_service import AdifService


def test_qso_to_dict_parses_adif_fields():
    service = AdifService([], spotter_callsign="4Z1ABC")

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

    entries = AdifService([record], spotter_callsign="4Z1ABC").get_valid_entries()

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

    entries = AdifService([record], spotter_callsign="4Z1ABC").get_valid_entries()

    assert [entry["area"] for entry in entries] == ["H08HF", "J05HF"]


def test_get_valid_entries_ignores_unknown_area_codes():
    record = (
        "<QSO_DATE:8>20240101"
        "<FREQ:6>14.250"
        "<STATION_CALLSIGN:6>4Z1ABC"
        "<CALL:5>W1ABC"
        "<COMMENT:5>H99HF"
    )

    assert AdifService([record], spotter_callsign="4Z1ABC").get_valid_entries() == []
