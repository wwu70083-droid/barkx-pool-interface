import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import compression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig((mode) => ({
  plugins: [
    vue(),
    Components(),
    compression({ algorithm: "brotliCompress" }),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
}));
