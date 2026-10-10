import { resolve } from 'path';
import { defineConfig, type Plugin } from 'vite';

/**
 * Web practice apps are retired. Any hit to /training/pll or /training/cross
 * redirects back to the store-landing portal.
 */
function redirectRetiredWebApps(): Plugin {
  const retired = ['/training/pll', '/training/cross'];

  return {
    name: 'redirect-retired-web-apps',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url || '').split('?')[0] || '';
        const hit = retired.some(
          (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
        );
        if (!hit) return next();

        res.statusCode = 302;
        res.setHeader('Location', '/training/');
        res.end();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url || '').split('?')[0] || '';
        const hit = retired.some(
          (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
        );
        if (!hit) return next();

        res.statusCode = 302;
        res.setHeader('Location', '/training/');
        res.end();
      });
    },
  };
}

export default defineConfig({
  base: '/training/',
  plugins: [redirectRetiredWebApps()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        privacy: resolve(__dirname, 'privacy.html'),
      },
    },
  },
  server: {
    port: 3000,
  },
});
