import re
from region_grids import SQUARES


class AdifService:
    def __init__(self, qsos):
        self.qsos = [self.get_required_fields(self.qso_to_dict(qso)) for qso in qsos]

    def qso_to_dict(self, qso) -> dict:
        """
        Convert a QSO object to a dictionary.
        """

        qso_dict = {}
        pattern = re.compile(r"<([^:>]+):(\d+)>([^<]*)")
        for match in pattern.finditer(str(qso)):
            field, length, value = match.groups()
            qso_dict[field.strip().upper()] = value.strip()
        return qso_dict

    def get_required_fields(self, qso_dict: dict) -> dict:
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

    def get_squares_from_qso(self, qso_dict: dict) -> str:
        """
        Extract the grid square from the QSO dictionary.
        """

        def get_valid_square(value: str) -> str:
            """
            Check if any word in the value is a valid grid square.
            Returns the first valid square found, or empty string if none.
            More efficient: first check if last 2 chars match a region key,
            then only check values for that specific region.
            """
            for word in value.split():
                if len(word) == 5:
                    region_key = word[-2:]  # Last 2 characters
                    if region_key in SQUARES and word in SQUARES[region_key]:
                        return word
            return ""

        possible_squares = {
            "STX_STRING": re.sub(r"[^A-Z0-9 ]", "", qso_dict.get("STX_STRING", "")),
            "SRX_STRING": re.sub(r"[^A-Z0-9 ]", "", qso_dict.get("SRX_STRING", "")),
            "COMMENT": re.sub(r"[^A-Z0-9 ]", "", qso_dict.get("COMMENT", "")),
        }

        for key, value in possible_squares.items():
            possible_squares[key] = get_valid_square(value)

        return possible_squares

    def get_spotter(self, qso_dict: dict) -> str:
        """
        Extract the spotter from the QSO dictionary.
        """
        pass
