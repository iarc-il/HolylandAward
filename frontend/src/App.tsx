// import { Button } from "@/components/ui/button"
import React from "react";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "./components/AppSidebar";
import Dashboard from "./components/Dashboard";
import { BrowserRouter, Routes, Route } from "react-router";
import UploadPage from "./components/UploadPage";
import Map from "./components/Map";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Toaster } from "@/components/ui/sonner";
import WelcomePage from "./components/WelcomePage";

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
          <div className="flex h-screen w-full bg-background">
            <SignedOut>
              <WelcomePage />
            </SignedOut>
            <SignedIn>
              <AppSidebar />
              <main className="flex-1 h-screen overflow-auto">
                <div className="flex flex-1 flex-col gap-6 p-6 md:p-8 h-full">
                  <SidebarTrigger className="lg:hidden mb-2" />
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/upload" element={<UploadPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Routes>
                </div>
              </main>
            </SignedIn>
          </div>
        </SidebarProvider>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
