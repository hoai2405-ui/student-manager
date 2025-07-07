import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "./", // <-- thêm dòng này để tránh lỗi sai đường dẫn khi deploy
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
