// Required squares/regions to complete the award, per the user's own region.
// Region 0 = Israel; 1-3 are the other award regions.
export const getRequiredAmounts = (region?: number | null) => {
  switch (region) {
    case 0: // Israel
      return { areas: 150, regions: 18 };
    case 1: // Region 1
      return { areas: 100, regions: 13 };
    case 2: // Region 2
      return { areas: 50, regions: 13 };
    case 3: // Region 3
      return { areas: 50, regions: 13 };
    default:
      return { areas: 0, regions: 0 };
  }
};
