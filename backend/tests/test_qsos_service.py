from qsos.service import get_regions_from_areas


def test_get_regions_from_areas_returns_unique_region_suffixes():
    regions = get_regions_from_areas(["H08HF", "J05HF", "A22BS"])

    assert set(regions) == {"HF", "BS"}


def test_get_regions_from_areas_ignores_short_values():
    regions = get_regions_from_areas(["", "A", "H08HF"])

    assert regions == ["HF"]
