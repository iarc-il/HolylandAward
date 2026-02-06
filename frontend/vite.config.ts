import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@ui": path.resolve(__dirname, "./src/components/ui"),
    },
  },
  server: {
    host: true, // Listen on all addresses
    port: 5173,
    watch: {
      usePolling: true, // Required for Docker on Windows/WSL
    },
  },
})