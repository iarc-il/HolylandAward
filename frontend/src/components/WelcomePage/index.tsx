import { Button } from "@/components/ui/button";
import { SignIn } from "@clerk/clerk-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import awardCert from "@/assets/award_comp.png";
import logo from "@/assets/logo.svg";

const WelcomePage = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const navigate = useNavigate();

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
    <div className="flex-1 h-screen flex flex-col items-center justify-center overflow-hidden relative z-10">
      <div className="max-w-4xl w-full mx-auto px-6 text-center flex flex-col h-full justify-center py-8">
        {/* Logo */}
        <div className="flex justify-center mb-4 flex-shrink-0">
          <img src={logo} alt="Holyland Award Logo" className="h-16 w-auto" />
        </div>
        
        {/* Header */}
        <div className="space-y-2 flex-shrink-0">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">
            Holyland Award
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
            Track your amateur radio achievements across the Holy Land
          </p>
        </div>

        {/* Certificate Image */}
        <div className="my-4 flex justify-center flex-1 min-h-0" style={{ perspective: '1000px' }}>
          <img 
            src={awardCert} 
            alt="Holyland Award Certificate" 
            className="w-full h-full object-contain max-w-2xl animate-float"
            style={{ 
              mixBlendMode: 'darken',
              filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.15))'
            }}
          />
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center flex-shrink-0">
          <Button
            size="lg"
            onClick={() => navigate('/rules')}
            className="px-6 md:px-8 py-4 md:py-6 text-base md:text-lg">
            About & Rules
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setShowSignIn(true)}
            className="px-6 md:px-8 py-4 md:py-6 text-base md:text-lg">
            Sign In
          </Button>
        </div>

        {/* Info Section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-left flex-shrink-0">
          <div className="p-4 md:p-6 bg-card border border-border rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <h3 className="font-semibold text-base md:text-lg mb-2">Track Progress</h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              Monitor your QSO contacts across different regions and squares
            </p>
          </div>
          <div className="p-4 md:p-6 bg-card border border-border rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <h3 className="font-semibold text-base md:text-lg mb-2">
              Visualize Achievement
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              See your covered squares on an interactive map
            </p>
          </div>
          <div className="p-4 md:p-6 bg-card border border-border rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <h3 className="font-semibold text-base md:text-lg mb-2">Claim Certificate</h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              Completed your region's requirements? Claim your Holyland Award
              certificate!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
