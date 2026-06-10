import { useState } from "react";
import { SignIn, SignOutButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";

interface MaintenancePageProps {
  showAdminSignIn?: boolean;
}

const MaintenancePage = ({ showAdminSignIn }: MaintenancePageProps) => {
  const [showSignIn, setShowSignIn] = useState(false);

  if (showSignIn) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center relative z-10">
        <div className="bg-card p-8 rounded-xl shadow-lg border border-border">
          <SignIn />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen flex items-center justify-center relative z-10">
      <div className="max-w-md w-full mx-auto px-6 text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-muted p-4">
            <Wrench className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Site Under Maintenance
        </h1>
        <p className="text-muted-foreground mb-8">
          We're currently performing scheduled maintenance. Please check back
          later.
        </p>
        {showAdminSignIn ? (
          <Button variant="outline" size="lg" onClick={() => setShowSignIn(true)}>
            Admin Sign In
          </Button>
        ) : (
          <SignOutButton>
            <Button variant="outline" size="lg">
              Sign Out
            </Button>
          </SignOutButton>
        )}
      </div>
    </div>
  );
};

export default MaintenancePage;