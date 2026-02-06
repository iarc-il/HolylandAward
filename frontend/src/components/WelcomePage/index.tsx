import { Button } from "@/components/ui/button";
import { SignIn } from "@clerk/clerk-react";
import { useState } from "react";

const WelcomePage = () => {
  const [showSignIn, setShowSignIn] = useState(false);

  if (showSignIn) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="bg-card p-8 rounded-xl shadow-lg border border-border">
          <SignIn />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white">
            Holyland Award
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Track your amateur radio achievements across the Holy Land
          </p>
        </div>

        {/* Certificate Placeholder */}
        <div className="my-12 p-12 bg-white/50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-gray-400 dark:text-gray-500 space-y-4">
            <div className="text-4xl">📜</div>
            <p className="text-lg font-medium">Award Certificate</p>
            <p className="text-sm">Coming soon with fancy animations!</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => setShowSignIn(true)}
            className="px-8 py-6 text-lg"
          >
            Get Started
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setShowSignIn(true)}
            className="px-8 py-6 text-lg"
          >
            Sign In
          </Button>
        </div>

        {/* Info Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 bg-white/70 dark:bg-gray-800/70 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Track Progress</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monitor your QSO contacts across different regions and areas
            </p>
          </div>
          <div className="p-6 bg-white/70 dark:bg-gray-800/70 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">
              Visualize Achievement
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              See your covered areas on an interactive map
            </p>
          </div>
          <div className="p-6 bg-white/70 dark:bg-gray-800/70 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Earn Awards</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Complete challenges and receive official recognition
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
