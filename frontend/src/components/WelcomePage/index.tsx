import { Button } from "@/components/ui/button";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import awardCert from "@/assets/award_gold_wood.webp";
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
      {/* Sign In / Sign Up / About & Rules - pinned to the top-right corner
          of the window, navbar-style, from md up. About & Rules sits right
          at the corner; Sign In/Sign Up sit to its left, with room to
          breathe. Below md this is hidden in favor of the in-flow, wrapped
          row right below, since absolute positioning has no room to work
          with on a narrow screen and would overlap the title. */}
      <div className="hidden md:flex absolute top-6 right-14 items-center gap-3 z-20">
        <Button
          variant="outline"
          onClick={() => setAuthView("signIn")}
          className="px-6 h-11 py-0 text-base border-0 ring-2 ring-border hover:ring-primary">
          Sign In
        </Button>
        {!hideSignUp && (
          <Button
            variant="outline"
            onClick={() => setAuthView("signUp")}
            className="px-6 h-11 py-0 text-base border-0 ring-2 ring-border hover:ring-primary">
            Sign Up
          </Button>
        )}
        <Button
          onClick={() => navigate('/rules')}
          className="px-4 h-11 py-0 text-base border-2 border-transparent">
          About & Rules
        </Button>
      </div>

      {/* Mobile-only equivalent of the row above: normal document flow
          instead of absolute, wraps and centers instead of assuming wide
          space to the side of a big title. */}
      <div className="flex md:hidden flex-wrap items-center justify-center gap-2 pt-4 px-4">
        <Button
          variant="outline"
          onClick={() => setAuthView("signIn")}
          className="px-5 h-10 py-0 text-sm border-0 ring-2 ring-border hover:ring-primary">
          Sign In
        </Button>
        {!hideSignUp && (
          <Button
            variant="outline"
            onClick={() => setAuthView("signUp")}
            className="px-5 h-10 py-0 text-sm border-0 ring-2 ring-border hover:ring-primary">
            Sign Up
          </Button>
        )}
        <Button
          onClick={() => navigate('/rules')}
          className="px-4 h-10 py-0 text-sm border-2 border-transparent">
          About & Rules
        </Button>
      </div>

      <div className="max-w-4xl w-full mx-auto px-6 text-center flex-shrink-0 pt-2 md:pt-6 relative">
        {/* Logo + Header - from md up, logos are absolutely positioned to
            either side of the title block (symmetric) instead of sitting
            in-flow beside it, so they don't shift the title/subtitle
            off-center - it stays centered to the page (matching the
            image's own centering). Below md there's no room for logos
            beside the title at all, so a single smaller logo stacks above
            it instead. */}
        <img
          src={logo}
          alt="Holyland Award Logo"
          className="md:hidden mx-auto h-14 w-auto mb-1"
        />
        <div className="relative inline-flex items-center justify-center">
          <img
            src={logo}
            alt="Holyland Award Logo"
            className="hidden md:block absolute right-full mr-8 h-24 w-auto flex-shrink-0"
          />
          <img
            src={logo}
            alt=""
            aria-hidden="true"
            className="hidden md:block absolute left-full ml-8 h-24 w-auto flex-shrink-0"
          />
          <div className="text-center">
            <h1 className="text-3xl md:text-6xl font-bold text-gray-900 dark:text-white">
              Holyland Award
            </h1>
            <p className="text-base md:text-xl text-gray-600 dark:text-gray-300">
              Track your amateur radio achievements across the Holy Land
            </p>
          </div>
        </div>
      </div>

      {/* Image + badges stacked in one column. From md up, the column is
          sized to fit the image's own rendered width (w-fit, centered via
          mx-auto) rather than the full page width - so the badges row
          below, using w-full + justify-between, spans exactly from the
          image's left edge to its right edge. The image has an explicit
          height (not flex-grow) so its top edge stays put right below the
          header and growing it pushes the badges down in normal flow,
          rather than trying to exactly fill leftover flex space (which had
          edge-case bugs with invisible letterboxing and overlap at
          different viewport shapes).
          Below md, the column is full-width (image scales by width, not a
          viewport-height value that would overflow a narrow screen) and
          the badges stack in a single column instead of spreading
          edge-to-edge, since there's no room for three side by side. */}
      <div className="w-full md:w-fit mx-auto flex flex-col items-center gap-1 px-6 mt-1">
        {/* Certificate image - mounted on a wood plaque backdrop, rendered
            with a real transparent background (not a flat color + blend
            mode) since the page backdrop is a dimmed photo, not a solid
            color a blend-mode trick could match. Its own wall-mount shadow
            is baked in, so no extra CSS drop-shadow is layered on top. */}
        <img
          src={awardCert}
          alt="Holyland Award Certificate, mounted on a wood plaque"
          className="w-full h-auto max-h-[45vh] object-contain md:h-[80vh] md:w-auto md:max-h-none md:max-w-full flex-shrink-0 animate-float"
        />

        <div className="w-full flex-shrink-0 flex flex-col items-stretch gap-2 px-4 pb-4 md:flex-row md:items-center md:justify-between md:gap-3 md:px-8 md:pb-1">
          <h3 className="font-semibold text-lg md:text-2xl bg-white rounded-lg px-4 py-2 md:py-1 text-center md:w-fit shadow-sm">
            Track Progress
          </h3>
          <h3 className="font-semibold text-lg md:text-2xl bg-white rounded-lg px-4 py-2 md:py-1 text-center md:w-fit shadow-sm">
            Visualize Achievement
          </h3>
          <h3 className="font-semibold text-lg md:text-2xl bg-white rounded-lg px-4 py-2 md:py-1 text-center md:w-fit shadow-sm">
            Claim Certificate
          </h3>
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
