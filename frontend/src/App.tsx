import { Button } from "@/components/ui/button"
import React from "react"
import { BrowserRouter, Routes, Route } from "react-router";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="flex min-h-svh flex-col items-center justify-center">
          <Button>Click me</Button>
        </div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App