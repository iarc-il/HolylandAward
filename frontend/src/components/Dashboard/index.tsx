import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import UserDetailsDialog from "../UserDetailsDialog";
import AreasRegionsDialog from "../AreasRegionsDialog";
import Map from "../Map";
import StatsCard from "./components/StatsCard";
import { useUserAreasAndRegions } from "../../api/useUserAreasAndRegions";
import { useProfile } from "../../api/useProfile";

// Get required areas and regions based on user's region
const getRequiredAmounts = (region?: number) => {
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

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [areasDialogOpen, setAreasDialogOpen] = useState(false);
  const [regionsDialogOpen, setRegionsDialogOpen] = useState(false);
  const [allowClose, setAllowClose] = useState(false);

  const { profile, isProfileComplete, isLoading } = useProfile();
  const {
    data: userAreasData,
    isLoading: areasLoading,
    error: areasError,
  } = useUserAreasAndRegions();

  const requiredAmounts = getRequiredAmounts(profile?.region);

  // Check if dialog should be open based on URL params
  useEffect(() => {
    const showSetup = searchParams.get("setup");
    if (showSetup === "true") {
      setIsDialogOpen(true);
    }
  }, [searchParams]);

  // Automatically prompt user to complete profile if incomplete
  useEffect(() => {
    // Wait for profile to load, then check if it's complete
    if (!isLoading && !isProfileComplete) {
      setIsDialogOpen(true);
    }
  }, [isLoading, isProfileComplete]);

  const handleDialogClose = () => {
    // Only allow closing if profile is complete or explicitly allowed
    if (!isProfileComplete && !allowClose) {
      toast.warning("Profile Required", {
        description: "Please complete your profile to continue.",
        duration: 3000,
      });
      return;
    }

    setIsDialogOpen(false);
    setAllowClose(false); // Reset the flag
    // Remove profile-related params from URL when closing
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("setup");
    setSearchParams(newParams);
  };

  const handleUserDetailsSuccess = () => {
    toast.success("Profile updated successfully!", {
      description: "Your callsign and region have been saved.",
      duration: 4000,
    });
    setIsDialogOpen(false); // Close the dialog directly
    setAllowClose(false); // Reset the flag
    // Remove profile-related params from URL
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("setup");
    setSearchParams(newParams);
  };

  return (
    <div className="flex flex-col space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the HolyLand Award management system.
        </p>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side - Statistics Cards */}
        <div className="flex-shrink-0 lg:w-80">
          <div className="space-y-4">
            <StatsCard
              title="Areas"
              current={userAreasData?.total_areas ?? 0}
              total={requiredAmounts.areas}
              isLoading={areasLoading}
              isError={!!areasError}
              onClick={() => setAreasDialogOpen(true)}
            />

            <StatsCard
              title="Regions"
              current={userAreasData?.total_regions ?? 0}
              total={requiredAmounts.regions}
              isLoading={areasLoading}
              isError={!!areasError}
              onClick={() => setRegionsDialogOpen(true)}
            />

            <div className="p-6 border rounded-lg">
              <h3 className="font-semibold mb-2">Callsign</h3>
              <p className="text-2xl font-bold">
                {areasLoading
                  ? "..."
                  : areasError
                    ? "N/A"
                    : (userAreasData?.callsign ?? "Not Set")}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Map Section */}
        <div className="flex-1">
          <div className="border rounded-lg overflow-hidden h-[800px]">
            <Map />
          </div>
        </div>
      </div>

      {/* User Details Dialog */}
      <UserDetailsDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleUserDetailsSuccess}
      />

      {/* Areas Dialog */}
      <AreasRegionsDialog
        isOpen={areasDialogOpen}
        onClose={() => setAreasDialogOpen(false)}
        title="Areas"
        items={userAreasData?.areas ?? []}
        isLoading={areasLoading}
      />

      {/* Regions Dialog */}
      <AreasRegionsDialog
        isOpen={regionsDialogOpen}
        onClose={() => setRegionsDialogOpen(false)}
        title="Regions"
        items={userAreasData?.regions ?? []}
        isLoading={areasLoading}
      />
    </div>
  );
};

export default Dashboard;
