import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Exercice Guitare",
        short_name: "Guitare",
        description: "Pratique des notes et accords sur le manche",
        theme_color: "#1a1816",
        background_color: "#1a1816",
        display: "standalone",
        orientation: "portrait",
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  base: "/guitar-practice/",
  test: {
    include: ["src/**/*.test.ts"],
    environment: "jsdom",
  },
});
