import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import UserDetailsDialog from "./UserDetailsDialog";

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const handleUserDetailsSubmit = async (data: {
    callsign: string;
    region: string;
  }) => {
    try {
      // TODO: Submit user details to backend
      console.log("Submitting user details:", data);

      // For now, just close the dialog
      handleDialogClose();

      // TODO: Add API call to update user profile
      // await updateUserProfile(data);
    } catch (error) {
      console.error("Error updating user profile:", error);
      // TODO: Show error message to user
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome to the HolyLand Award management system.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold">Total QSOs</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold">Areas Worked</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold">Awards Earned</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>

      {/* User Details Dialog */}
      <UserDetailsDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleUserDetailsSubmit}
      />
    </div>
  );
};

export default Dashboard;
