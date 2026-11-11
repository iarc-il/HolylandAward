import re
from area_grids import AREAS
from qsos.schema import QSO


def clean_callsign(callsign: str) -> str:
    """
    Reduce a logged callsign to the station's main callsign.

    Portable/mobile markers can follow the callsign (4Z5SL/P, 4Z5SL/M, 4Z5SL/QRP,
    4Z5SL/1) or precede it as a country prefix (OH/4Z5SL, VK9/4Z5SL/P). In every
    such form the main callsign is the longest part between slashes, so that
    is what is kept.
    """
    if not callsign:
        return ""

    parts = [part for part in callsign.strip().upper().split("/") if part]
    if not parts:
        return ""
    return max(parts, key=len)  # max() keeps the first of equal-length parts


class AdifService:
    def __init__(self, qsos, spotter_callsigns: list[str]):
        self.qsos = [self._get_required_fields(self._qso_to_dict(qso)) for qso in qsos]
        self.spotter_callsigns = {
            self._clean_callsign(callsign) for callsign in spotter_callsigns if callsign
        }

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

    # Fields that hold callsigns rather than exchange/location data - never
    # scanned for grid squares, since a callsign should never be credited as
    # an area even if it happens to collide with the square format.
    _CALLSIGN_FIELDS = {"CALL", "STATION_CALLSIGN", "OPERATOR", "OWNER_CALLSIGN"}

    # RST_SENT is, by ADIF definition, the report WE sent - not what we
    # received from the DX station. Contest software that folds the sent
    # exchange into this field (e.g. N1MM sending "F12HS" as the Holyland
    # station's own square to every contact) fills it with a constant value
    # per log, which would otherwise be mis-credited as a "worked" square on
    # every single QSO. This is a general ADIF naming convention (any field
    # describing our own station rather than the contact), not a
    # software-specific quirk, so MY_* fields are excluded the same way.
    _OWN_STATION_FIELDS = {"RST_SENT"}

    def _is_own_station_field(self, field: str) -> bool:
        return field in self._CALLSIGN_FIELDS or field in self._OWN_STATION_FIELDS or field.startswith("MY_")

    def _get_required_fields(self, qso_dict: dict) -> dict:
        # Different logging software (N1MM, DXKeeper, Log4OM, ...) stores the
        # received exchange/grid square under different, non-standard field
        # names. Rather than maintaining a whitelist of known field names per
        # software, keep every field the ADIF record actually contains and
        # let _get_areas scan all of them by content instead of by name.
        core_fields = ["QSO_DATE", "FREQ", "STATION_CALLSIGN", "OPERATOR", "CALL"]
        result = dict(qso_dict)
        for field in core_fields:
            result.setdefault(field, "")
        return result

    def _get_areas(self, qso_dict) -> str:
        """
        Extract the grid square(s) from the QSO dictionary.
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
                    if region_key in AREAS and word in AREAS[region_key]:
                        return word
            return ""

        areas = []
        seen = set()
        for field, raw_value in qso_dict.items():
            if self._is_own_station_field(field) or not raw_value:
                continue
            cleaned_value = re.sub(r"[^A-Z0-9 ]", "", raw_value.upper())
            if not cleaned_value:
                continue
            valid_area = get_valid_area(cleaned_value)
            if valid_area and valid_area not in seen:
                seen.add(valid_area)
                areas.append(valid_area)

        return areas

    def _clean_callsign(self, callsign: str) -> str:
        """
        Clean a callsign: drop /P, /M, /QRP... suffixes and country prefixes.
        """
        return clean_callsign(callsign)

    def _get_spotter(self, qso_dict: dict) -> str:
        """
        Extract the spotter from the QSO dictionary.
        """
        station_callsign = self._clean_callsign(qso_dict.get("STATION_CALLSIGN", ""))
        operator = self._clean_callsign(qso_dict.get("OPERATOR", ""))

        if station_callsign in self.spotter_callsigns:
            return station_callsign
        elif operator in self.spotter_callsigns:
            return operator
        return ""  # No spotter found

    def get_unmatched_callsigns(self, limit: int = 5) -> list[dict]:
        """
        Callsigns found as STATION_CALLSIGN/OPERATOR in QSOs that were skipped
        because they are not the user's own - e.g. an old callsign the user
        held earlier. Only QSOs that actually contain a valid square count, so
        the user is not asked about callsigns that would add nothing.
        Returns [{"callsign": str, "qsos": int}], most QSOs first.
        """
        counts: dict[str, int] = {}
        for qso in self.qsos:
            if self._get_spotter(qso) or not self._get_areas(qso):
                continue
            found = set()
            for field in ("STATION_CALLSIGN", "OPERATOR"):
                callsign = self._clean_callsign(qso.get(field, ""))
                if callsign and self._looks_like_callsign(callsign):
                    found.add(callsign)
            for callsign in found:
                counts[callsign] = counts.get(callsign, 0) + 1

        ranked = sorted(counts.items(), key=lambda item: (-item[1], item[0]))
        return [{"callsign": cs, "qsos": n} for cs, n in ranked[:limit]]

    @staticmethod
    def _looks_like_callsign(value: str) -> bool:
        return (
            re.fullmatch(r"[A-Z0-9]+", value) is not None
            and re.search(r"[A-Z]", value) is not None
            and re.search(r"\d", value) is not None
        )

    def get_valid_entries(self) -> list[QSO]:
        """
        Get all valid entries from the QSO list.
        """
        valid_entries = []
        for qso in self.qsos:
            spotter = self._get_spotter(qso)
            if not spotter:
                continue

            areas = self._get_areas(qso)
            for area in areas:
                entry = {
                    "date": qso.get("QSO_DATE", ""),
                    "freq": qso.get("FREQ", ""),
                    "spotter": spotter,
                    "dx": self._clean_callsign(qso.get("CALL", "")),
                    "area": area,
                }
                valid_entries.append(entry)
        return valid_entries
