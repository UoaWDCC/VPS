// vite.config.js
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default ({ mode }) => {
  const target = loadEnv(mode, process.cwd()).VITE_BACKEND_URL;

  return defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        styles: path.resolve(__dirname, "src/styles"),
        context: path.resolve(__dirname, "src/context"),
        components: path.resolve(__dirname, "src/components"),
        containers: path.resolve(__dirname, "src/containers"),
        features: path.resolve(__dirname, "src/features"),
        hooks: path.resolve(__dirname, "src/hooks"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
  });
};
