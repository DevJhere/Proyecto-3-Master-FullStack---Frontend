import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Config de tests separada de vite.config.js: no necesita Tailwind y fija el entorno de la API
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    // Mismo origen que la API falsa (http://api.test) para que jsdom no aplique CORS a las peticiones de MSW
    environmentOptions: { jsdom: { url: "http://api.test" } },
    env: { VITE_API_URL: "http://api.test/api" },
    globalSetup: ["./src/test/global-setup.js"],
    setupFiles: ["./src/test/setup.js"],
    include: ["src/**/*.test.{js,jsx}"],
    css: false,
  },
});
