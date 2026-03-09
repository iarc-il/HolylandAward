import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import UserDetailsDialog from "../UserDetailsDialog";
import AreasRegionsDialog from "../AreasRegionsDialog";
import Map from "../Map";
import StatsCard from "./components/StatsCard";
import { useUserAreasAndRegions } from "../../api/useUserAreasAndRegions";
import { useProfile } from "../../api/useProfile";
import { Trophy, Mail, Sparkles } from "lucide-react";

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

  // Check if all requirements are met
  const areasComplete =
    (userAreasData?.total_areas ?? 0) >= requiredAmounts.areas &&
    requiredAmounts.areas > 0;
  const regionsComplete =
    (userAreasData?.total_regions ?? 0) >= requiredAmounts.regions &&
    requiredAmounts.regions > 0;
  const allRequirementsMet = areasComplete && regionsComplete;

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
    <div className="flex flex-col space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-base">
          Welcome to the HolyLand Award management system.
        </p>
      </div>

      {/* Achievement Banner - Show when all requirements met */}
      {allRequirementsMet && !areasLoading && (
        <div className="relative overflow-hidden rounded-xl border-2 border-green-500 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 p-6 shadow-lg animate-in fade-in slide-in-from-top duration-700">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-200/30 rounded-full blur-3xl" />
          <div className="relative flex items-start gap-4">
            <div className="flex-shrink-0">
              <Trophy className="h-12 w-12 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-green-800 flex items-center gap-2">
                Congratulations! 🎉
                <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
              </h2>
              <p className="text-green-700 mt-1">
                You've completed all requirements for the HolyLand Award!
              </p>
              <p className="text-sm text-green-600 mt-2">
                {userAreasData?.total_areas} squares and{" "}
                {userAreasData?.total_regions} regions confirmed.
              </p>
              <div className="mt-4 flex items-center gap-2 text-green-800">
                <Mail className="h-4 w-4" />
                <p className="text-sm">
                  To claim your certificate, send an email to{" "}
                  <a
                    href="mailto:phazeman@gmail.com"
                    className="font-semibold underline hover:text-green-600"
                  >
                    phazeman@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side - Statistics Cards */}
        <div className="flex-shrink-0 lg:w-80">
          <div className="space-y-4">
            <StatsCard
              title="Squares"
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

            <div className="p-6 bg-card border border-border rounded-xl shadow-md">
              <h3 className="font-semibold mb-3 text-lg">Callsign</h3>
              <p className="text-2xl font-bold text-primary">
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
          <div className="border border-border rounded-xl overflow-hidden shadow-md h-[600px] lg:h-[800px]">
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
        title="Squares"
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
