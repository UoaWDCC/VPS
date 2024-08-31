import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      styling: path.resolve(__dirname, "src/styling"),
      context: path.resolve(__dirname, "src/context"),
      components: path.resolve(__dirname, "src/components"),
      containers: path.resolve(__dirname, "src/containers"),
      hooks: path.resolve(__dirname, "src/hooks"),
    },
  },
});
