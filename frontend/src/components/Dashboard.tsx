import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import UserDetailsDialog from "./UserDetailsDialog";
import AreasRegionsDialog from "./AreasRegionsDialog";
import { useUserAreasAndRegions } from "../api/useUserAreasAndRegions";

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [areasDialogOpen, setAreasDialogOpen] = useState(false);
  const [regionsDialogOpen, setRegionsDialogOpen] = useState(false);
  const {
    data: userAreasData,
    isLoading: areasLoading,
    error: areasError,
  } = useUserAreasAndRegions();

  // Check if dialog should be open based on URL params
  useEffect(() => {
    const showSetup = searchParams.get("setup");
    if (showSetup === "true") {
      setIsDialogOpen(true);
    }
  }, [searchParams]);

  const handleDialogClose = () => {
    setIsDialogOpen(false);
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
  };

  return (
    <div className="flex flex-col space-y-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome to the HolyLand Award management system.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="p-6 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() =>
            !areasLoading && !areasError && setAreasDialogOpen(true)
          }
        >
          <h3 className="font-semibold">Total Areas</h3>
          <p className="text-2xl font-bold">
            {areasLoading
              ? "..."
              : areasError
              ? "N/A"
              : userAreasData?.total_areas ?? 0}
          </p>
          {!areasLoading && !areasError && (
            <p className="text-xs text-muted-foreground mt-2">
              Click to view areas
            </p>
          )}
        </div>
        <div
          className="p-6 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() =>
            !areasLoading && !areasError && setRegionsDialogOpen(true)
          }
        >
          <h3 className="font-semibold">Total Regions</h3>
          <p className="text-2xl font-bold">
            {areasLoading
              ? "..."
              : areasError
              ? "N/A"
              : userAreasData?.total_regions ?? 0}
          </p>
          {!areasLoading && !areasError && (
            <p className="text-xs text-muted-foreground mt-2">
              Click to view regions
            </p>
          )}
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold">Callsign</h3>
          <p className="text-2xl font-bold">
            {areasLoading
              ? "..."
              : areasError
              ? "N/A"
              : userAreasData?.callsign ?? "Not Set"}
          </p>
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
