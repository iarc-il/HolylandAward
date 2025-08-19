import { Button } from "@/components/ui/button"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import AppSidebar from "./components/AppSidebar"
import React from "react"
import { BrowserRouter, Routes, Route } from "react-router"

// Page components
const Dashboard = () => (
  <div className="flex flex-col space-y-4">
    <h1 className="text-3xl font-bold">Dashboard</h1>
    <p className="text-muted-foreground">Welcome to the HolyLand Award management system.</p>
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
)

const UploadPage = () => (
  <div className="flex flex-col space-y-4">
    <h1 className="text-3xl font-bold">Upload ADIF File</h1>
    <p className="text-muted-foreground">Upload your ADIF log files to track your progress.</p>
    <Button>Upload File</Button>
  </div>
)

const LogsPage = () => (
  <div className="flex flex-col space-y-4">
    <h1 className="text-3xl font-bold">QSO Logs</h1>
    <p className="text-muted-foreground">View and manage your QSO records.</p>
  </div>
)

const AwardsPage = () => (
  <div className="flex flex-col space-y-4">
    <h1 className="text-3xl font-bold">Awards</h1>
    <p className="text-muted-foreground">Track your award progress and achievements.</p>
  </div>
)

const SettingsPage = () => (
  <div className="flex flex-col space-y-4">
    <h1 className="text-3xl font-bold">Settings</h1>
    <p className="text-muted-foreground">Configure your application settings.</p>
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="text-lg font-semibold">HolyLand Award Manager</div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-6">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/upload" element={<UploadPage />} />
                  <Route path="/logs" element={<LogsPage />} />
                  <Route path="/awards" element={<AwardsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </BrowserRouter>
  )
}

export default App