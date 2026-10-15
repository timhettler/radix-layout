import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { NodePackageImporter } from "sass-embedded";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // pkg: URLs, the way a project configures its own scale (CustomScale story).
  css: {
    preprocessorOptions: {
      scss: { importers: [new NodePackageImporter(import.meta.dirname)] },
    },
  },
});
