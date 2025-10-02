def get_regions_from_areas(areas: list[str]) -> list[str]:
    """
    Extract unique regions from a list of areas.
    The region is the last 2 characters of each area.
    """
    regions = set()
    for area in areas:
        if len(area) >= 2:
            region = area[-2:]  # Last 2 characters
            regions.add(region)

    return list(regions)
