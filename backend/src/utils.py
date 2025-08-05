import re


def qso_to_dict(qso) -> dict:
    """
    Convert a QSO object to a dictionary.
    """

    qso_dict = {}
    pattern = re.compile(r"<([^:>]+):(\d+)>([^<]*)")
    for match in pattern.finditer(str(qso)):
        field, length, value = match.groups()
        qso_dict[field.strip().upper()] = value.strip()
    return qso_dict


def get_required_fields(qso_dict: dict) -> dict:
    required_fields = [
        "QSO_DATE",
        "FREQ",
        "STATION_CALLSIGN",
        "OPERATOR",
        "CALL",
        "STX_STRING",
        "SRX_STRING",
        "COMMENT",
    ]
    return {field: qso_dict.get(field, "") for field in required_fields}
