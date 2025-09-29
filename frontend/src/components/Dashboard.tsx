import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
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
        onSuccess={handleUserDetailsSuccess}
      />
    </div>
  );
};

export default Dashboard;
