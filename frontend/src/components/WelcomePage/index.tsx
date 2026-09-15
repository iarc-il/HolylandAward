import { Button } from "@/components/ui/button";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import awardCert from "@/assets/award_gold_comp.png";
import logo from "@/assets/logo.svg";
import { useRegistrationStatus } from "@/api/useUserLimit";

const WelcomePage = () => {
  const [authView, setAuthView] = useState<"signIn" | "signUp" | null>(null);
  const navigate = useNavigate();
  const { data: registrationStatus } = useRegistrationStatus();
  const registrationFull = registrationStatus?.limit_reached ?? false;
  const hideSignUp = registrationStatus ? registrationFull : true;
  const authAppearance = {
    variables: {
      fontSize: "1.05rem",
      spacingUnit: "1.15rem",
    },
    elements: {
      formFieldInput: {
        fontSize: "1.2rem",
        padding: "1.1rem 1rem",
      },
      ...(hideSignUp && authView === "signIn"
        ? {
            footerAction: "hidden",
            footerActionLink: "hidden",
            footerActionText: "hidden",
          }
        : {}),
    },
  };

  if (authView) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center relative z-10">
        <div
          className={`bg-card p-8 rounded-xl shadow-lg border border-border ${
            hideSignUp && authView === "signIn" ? "clerk-hide-sign-up" : ""
          }`}
        >
          {registrationFull && (
            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              Registration is currently full. Existing users can still sign in.
            </div>
          )}
          {authView === "signIn" ? (
            <SignIn appearance={authAppearance} />
          ) : (
            <SignUp appearance={authAppearance} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen flex flex-col items-center overflow-y-auto relative z-10">
      <div className="max-w-4xl w-full mx-auto px-6 text-center flex-shrink-0 pt-6">
        {/* Logo + Header - side by side (leveled), not stacked, so this whole block is shorter */}
        <div className="flex items-center justify-center gap-8">
          <img src={logo} alt="Holyland Award Logo" className="h-24 w-auto flex-shrink-0" />
          <div className="text-left">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">
              Holyland Award
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
              Track your amateur radio achievements across the Holy Land
            </p>
          </div>
        </div>
      </div>

      {/* Three-column row: info card in the left gutter, image in the middle (untouched,
          nothing on it), CTA buttons in the right gutter. The image is sized by height
          (h-full w-auto) and doesn't grow/shrink (flex-shrink-0); the info card and button
          column absorb whatever empty space is left on either side instead of that space
          going to waste.
          Height is pinned to calc(100vh - 184px) - the space the header block took up
          BEFORE the logo moved inline - rather than flex-1, so shortening the header just
          moves the image up instead of growing it. */}
      <div
        className="w-full flex items-center justify-center gap-4 md:gap-8 px-6 mt-2 flex-shrink-0"
        style={{ height: 'calc(100vh - 184px)' }}
      >
        {/* Info card - left gutter */}
        <div className="flex-1 flex flex-col gap-2 text-left min-w-0">
          <div>
            <h3 className="font-semibold text-xl md:text-2xl">
              Track Progress
            </h3>
            <p className="text-base md:text-lg text-muted-foreground">
              Monitor your QSO contacts across different regions and squares
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-xl md:text-2xl">
              Visualize Achievement
            </h3>
            <p className="text-base md:text-lg text-muted-foreground">
              See your covered squares on an interactive map
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-xl md:text-2xl">
              Claim Certificate
            </h3>
            <p className="text-base md:text-lg text-muted-foreground">
              Completed your region's requirements? Claim your Holyland
              Award certificate!
            </p>
          </div>
        </div>

        {/* Certificate image - untouched, nothing overlaid on it */}
        <img
          src={awardCert}
          alt="Holyland Award Certificate"
          className="h-full w-auto flex-shrink-0 animate-float"
          style={{
            mixBlendMode: 'darken',
            filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.15))'
          }}
        />

        {/* CTA Buttons - right gutter */}
        <div className="flex-1 flex flex-col gap-4 items-start min-w-0">
          <Button
            onClick={() => navigate('/rules')}
            className="px-6 md:px-8 h-14 py-0 text-base md:text-lg border-2 border-transparent">
            About & Rules
          </Button>
          <Button
            variant="outline"
            onClick={() => setAuthView("signIn")}
            className="px-6 md:px-8 h-14 py-0 text-base md:text-lg border-0 ring-2 ring-border hover:ring-primary">
            Sign In
          </Button>
          {!hideSignUp && (
            <Button
              variant="outline"
              onClick={() => setAuthView("signUp")}
              className="px-6 md:px-8 h-14 py-0 text-base md:text-lg border-0 ring-2 ring-border hover:ring-primary">
              Sign Up
            </Button>
          )}
        </div>
      </div>

      {registrationFull && registrationStatus?.user_limit !== null && (
        <div className="mx-auto mb-4 max-w-md rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
          Registration is full: {registrationStatus?.current_users} of{" "}
          {registrationStatus?.user_limit} non-admin user slots are in use.
          Existing users can still sign in.
        </div>
      )}
    </div>
  );
};

export default WelcomePage;
