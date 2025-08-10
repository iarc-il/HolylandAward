import re
from backend.src.area_grids import SQUARES


class AdifService:
    def __init__(self, qsos, spotter_callsign):
        self.qsos = [self._get_required_fields(self._qso_to_dict(qso)) for qso in qsos]
        self.spotter_callsign = spotter_callsign

    def _qso_to_dict(self, qso) -> dict:
        """
        Convert a QSO object to a dictionary.
        """

        qso_dict = {}
        pattern = re.compile(r"<([^:>]+):(\d+)>([^<]*)")
        for match in pattern.finditer(str(qso)):
            field, length, value = match.groups()
            qso_dict[field.strip().upper()] = value.strip()
        return qso_dict

    def _get_required_fields(self, qso_dict: dict) -> dict:
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

    def _get_areas(self, qso_dict) -> str:
        """
        Extract the grid square from the QSO dictionary.
        """

        def get_valid_area(value: str) -> str:
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

        areas = []
        possible_areas = {
            "STX_STRING": re.sub(r"[^A-Z0-9 ]", "", qso_dict.get("STX_STRING", "")),
            "SRX_STRING": re.sub(r"[^A-Z0-9 ]", "", qso_dict.get("SRX_STRING", "")),
            "COMMENT": re.sub(r"[^A-Z0-9 ]", "", qso_dict.get("COMMENT", "")),
        }

        for possible_area in possible_areas.values():
            if not possible_area:
                continue
            valid_area = get_valid_area(possible_area)
            if valid_area:
                areas.append(valid_area)

        return areas

    def _get_spotter(self, qso_dict: dict) -> str:
        """
        Extract the spotter from the QSO dictionary.
        """
        if qso_dict.get("STATION_CALLSIGN", "") == self.spotter_callsign:
            return self.spotter_callsign
        elif qso_dict.get("OPERATOR", "") == self.spotter_callsign:
            return self.spotter_callsign
        return ""  # No spotter found

    def get_valid_entries(self) -> list:
        """
        Get all valid entries from the QSO list.
        """
        valid_entries = []
        for qso in self.qsos:
            areas = self._get_areas(qso)
            for area in areas:
                entry = {
                    "date": qso.get("QSO_DATE", ""),
                    "freq": qso.get("FREQ", ""),
                    "spotter": self._get_spotter(qso),
                    "dx": qso.get("CALL", ""),
                    "area": area,
                }
                valid_entries.append(entry)
        return valid_entries
