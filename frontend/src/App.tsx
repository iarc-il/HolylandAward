// import { Button } from "@/components/ui/button"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "./components/AppSidebar";
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import UploadPage from "./components/UploadPage";
import Map from "./components/Map";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
// Page components
const Dashboard = () => (
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
  </div>
);

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SidebarProvider>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <main className="flex-1 h-screen">
              <div className="flex flex-1 flex-col gap-4 p-4 pt-0 h-screen">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/upload" element={<UploadPage />} />
                  <Route path="/map" element={<Map />} />
                  <Route path="/logs" element={<LogsPage />} />
                  <Route path="/awards" element={<AwardsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </div>
            </main>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
