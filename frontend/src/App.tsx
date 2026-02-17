// import { Button } from "@/components/ui/button"
import React from "react";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "./components/AppSidebar";
import Dashboard from "./components/Dashboard";
import bgImage from "@/assets/_2024_06_01_at_07_08_50_3ffe314f.jpg";
import { BrowserRouter, Routes, Route } from "react-router";
import UploadPage from "./components/UploadPage";
import Map from "./components/Map";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Toaster } from "@/components/ui/sonner";
import WelcomePage from "./components/WelcomePage";
import RulesPage from "./components/RulesPage";

// Page components

const LogsPage = () => (
  <div className="flex flex-col space-y-4">
    <h1 className="text-3xl font-bold">QSO Logs</h1>
    <p className="text-muted-foreground">View and manage your QSO records.</p>
  </div>
);

const AwardsPage = () => (
  <div className="flex flex-col space-y-4">
    <h1 className="text-3xl font-bold">Awards</h1>
    <p className="text-muted-foreground">
      Track your award progress and achievements.
    </p>
  </div>
);

const SettingsPage = () => (
  <div className="flex flex-col space-y-4">
    <h1 className="text-3xl font-bold">Settings</h1>
    <p className="text-muted-foreground">
      Configure your application settings.
    </p>
  </div>
);

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SidebarProvider>
          <div className="flex h-screen w-full relative overflow-hidden">
            {/* Subtle background image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
              style={{
                backgroundImage: `url(${bgImage})`,
                filter: 'blur(6px) brightness(1.1)',
                opacity: 0.6,
              }}
            />
            {/* White overlay for readability */}
            <div className="absolute inset-0 bg-background/80 pointer-events-none" />
            
            <SignedOut>
              <Routes>
                <Route path="/rules" element={
                  <div className="flex-1 h-screen flex flex-col items-center overflow-auto relative z-10">
                    <div className="max-w-4xl w-full mx-auto px-6 py-8">
                      <RulesPage />
                    </div>
                  </div>
                } />
                <Route path="*" element={<WelcomePage />} />
              </Routes>
            </SignedOut>
            <SignedIn>
              <div className="flex h-screen w-full relative z-10">
                <AppSidebar />
                <main className="flex-1 h-screen overflow-auto">
                  <div className="flex flex-1 flex-col gap-6 p-6 md:p-8 h-full">
                    <SidebarTrigger className="lg:hidden mb-2" />
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/upload" element={<UploadPage />} />
                      <Route path="/rules" element={<RulesPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                    </Routes>
                  </div>
                </main>
              </div>
            </SignedIn>
          </div>
        </SidebarProvider>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
