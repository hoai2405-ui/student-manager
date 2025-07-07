import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: "./", // 👈 Đây là quan trọng nhất!
  build: {
    outDir: "dist", // mặc định, giữ nguyên nếu bạn chưa sửa
  },
  plugins: [react()],
  // server: { proxy: { "/api": "http://localhost:3001" } },
});
