import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/training/cross/',
  plugins: [react()],
  server: {
    port: 5174,
  },
});
