import { useState, useEffect } from "react";
import { SignOutButton } from "@clerk/clerk-react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import UserDetailsDialog from "../UserDetailsDialog";
import AreasRegionsDialog from "../AreasRegionsDialog";
import RareSquaresDialog from "../RareSquaresDialog";
import Map from "../Map";
import StatsCard from "./components/StatsCard";
import { useUserAreasAndRegions } from "../../api/useUserAreasAndRegions";
import { useProfile } from "../../api/useProfile";
import { useUnworkedAreas } from "../../api/useUnworkedAreas";
import { getRequiredAmounts } from "@/lib/regionRequirements";
import { Trophy, Mail, Sparkles } from "lucide-react";

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [areasDialogOpen, setAreasDialogOpen] = useState(false);
  const [regionsDialogOpen, setRegionsDialogOpen] = useState(false);
  const [rareDialogOpen, setRareDialogOpen] = useState(false);
  // Rare squares button: paints the squares nobody has worked yet in red on
  // the map (instead of the user's own green squares).
  const [showRareOnMap, setShowRareOnMap] = useState(false);
  const [allowClose, setAllowClose] = useState(false);

  const {
    profile,
    isProfileComplete,
    isLoading,
    isError: isProfileError,
    error: profileError,
  } = useProfile();
  // Same cached request the map uses to paint the red squares.
  const { data: unworkedData } = useUnworkedAreas();
  const {
    data: userAreasData,
    isLoading: areasLoading,
    error: areasError,
  } = useUserAreasAndRegions();

  const requiredAmounts = getRequiredAmounts(profile?.region);
  const countedCallsigns = userAreasData?.callsigns ?? [];
  const shouldRequireProfile =
    !isLoading && !isProfileError && !isProfileComplete;
  const profileErrorMessage =
    profileError instanceof Error ? profileError.message : "";
  const profileLimitReached = profileErrorMessage.includes("User limit");

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
    if (shouldRequireProfile) {
      setIsDialogOpen(true);
    }
  }, [shouldRequireProfile]);

  const handleDialogClose = () => {
    if (shouldRequireProfile && !allowClose) {
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

  if (!profile && isProfileError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-md">
          <h1 className="text-2xl font-bold text-foreground">
            {profileLimitReached
              ? "Registration Closed"
              : "Profile Unavailable"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {profileLimitReached
              ? "The user limit has been reached, so new accounts cannot be created right now. Existing users can still sign in."
              : "We could not load your profile. Please try again later."}
          </p>
          <SignOutButton>
            <Button className="mt-5" variant="outline">
              Sign Out
            </Button>
          </SignOutButton>
        </div>
      </div>
    );
  }

  // Each of the three regions below (title, stat cards, map) is positioned
  // independently via its own top/left/right/bottom values on this relative
  // container, rather than through flexbox/gap flow - so moving or resizing
  // one never shifts the others. Adjust each block's own inset values to
  // reposition just that block.
  return (
    <div className="relative w-full h-full flex-1 min-h-0">
      {/* 1. Dashboard title - independent position */}
      <div className="absolute top-0 left-0">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-base">
          HolyLand Award management system
        </p>
      </div>

      {/* Achievement Banner - independent position, only visible when shown */}
      {allRequirementsMet && !areasLoading && (
        <div className="absolute top-20 left-0 right-0 overflow-hidden rounded-xl border-2 border-green-500 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 p-6 shadow-lg animate-in fade-in slide-in-from-top duration-700">
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
                    href="mailto:holyland.award@gmail.com"
                    className="font-semibold underline hover:text-green-600"
                  >
                    holyland.award@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Statistics Cards (Squares / Regions / Callsign) - independent position */}
      <div className="absolute top-20 left-0 w-80 space-y-3">
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

        <div className="px-6 py-4 bg-card border border-border rounded-xl shadow-md">
          <h3 className="font-semibold mb-1 text-lg">Callsign</h3>
          <p className="text-2xl font-bold text-primary">
            {areasLoading
              ? "..."
              : areasError
                ? "N/A"
                : (userAreasData?.callsign ?? "Not Set")}
          </p>
          {countedCallsigns.length > 1 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground">
                Counting QSOs from
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {countedCallsigns.map((callsign) => (
                  <span
                    key={callsign}
                    className="rounded-full border border-border bg-muted px-2 py-1 text-xs font-semibold text-foreground"
                  >
                    {callsign}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Rare squares - switches the map to show, in red, the squares no
            registered user has worked yet. "View list" opens the same squares
            as a list. */}
        <div
          className={`rounded-xl border bg-card px-4 py-3 shadow-md ${
            showRareOnMap ? "border-red-400 bg-red-50/60" : "border-border"
          }`}
        >
          {/* "View list" is placed over the right end of the LAST line of the
              text (absolute, so the text layout is unchanged). */}
          <div className="relative">
            <Button
              variant="ghost"
              className="h-auto w-full flex-col items-start gap-0 whitespace-normal rounded-md p-0 text-left shadow-none hover:bg-transparent hover:shadow-none active:shadow-none"
              aria-pressed={showRareOnMap}
              onClick={() => setShowRareOnMap((value) => !value)}
            >
              {/* Badges at the right end of the row, so the green one lines up
                  with the right edge of "View list" below */}
              <span className="flex w-full items-center justify-between gap-3 whitespace-nowrap text-lg font-semibold">
                Rare squares
                {unworkedData && (
                  <span className="flex items-center gap-2">
                    <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-sm font-bold text-white">
                      {unworkedData.total_unworked}
                    </span>
                    <span className="rounded-full bg-green-600 px-2.5 py-0.5 text-sm font-bold text-white">
                      {unworkedData.worked_areas.length}
                    </span>
                  </span>
                )}
              </span>
              {/* text-justify: the lines reach the right edge, so "View list"
                  (right-aligned on the last line) lines up with the row above */}
              <span className="block w-full text-justify text-sm font-normal leading-snug text-muted-foreground">
                {showRareOnMap ? (
                  <>
                    <span className="block">
                      <span className="font-bold text-red-600">Red</span> =
                      nobody worked it yet.
                    </span>
                    <span className="block">
                      <span className="font-bold text-green-600">Green</span> =
                      worked by someone.
                    </span>
                    <span className="block">
                      <b>Click</b> to go back.
                    </span>
                  </>
                ) : (
                  <>
                    <b>Click</b> to show on the map squares that none of the{" "}
                    {typeof unworkedData?.registered_users === "number" && (
                      <b>{unworkedData.registered_users} </b>
                    )}
                    registered users have worked
                  </>
                )}
              </span>
            </Button>
            <Button
              variant="default"
              size="sm"
              // A real (filled) button. Absolute, and pushed a little below the
              // last text line so it does not touch the line above it.
              className="absolute -bottom-1.5 right-0 h-[26px] px-4 py-0 text-sm font-semibold"
              onClick={() => setRareDialogOpen(true)}
            >
              View list
            </Button>
          </div>
          {/* How many users have uploaded a log - numbers only, never who. */}
          {unworkedData && (
            <p className="mt-2 text-sm text-muted-foreground">
              (
              <span className="font-bold text-green-600">
                {unworkedData.users_with_logs}
              </span>{" "}
              of {unworkedData.registered_users} users have uploaded a log)
            </p>
          )}
        </div>
      </div>

      {/* 3. Map - independent position */}
      <div className="absolute top-0 left-[344px] right-0 bottom-0">
        <div className="border border-border rounded-xl overflow-hidden shadow-md w-full h-full">
          <Map showUnworked={showRareOnMap} />
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

      {/* Rare Squares Dialog */}
      <RareSquaresDialog
        isOpen={rareDialogOpen}
        onClose={() => setRareDialogOpen(false)}
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
