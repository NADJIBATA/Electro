import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// En dev, /api et /uploads sont redirigés vers l'API locale (port 3000)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
      "/uploads": "http://localhost:3000",
    },
  },
});
