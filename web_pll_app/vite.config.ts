import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const productionBasePath = '/puzzle/game/pll_recognize/';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? productionBasePath : '/',
  plugins: [react()],
  server: {
    port: 5173,
  },
}));
