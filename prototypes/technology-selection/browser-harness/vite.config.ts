import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/poc4',
      filename: 'sw.js',
      injectRegister: 'auto',
      manifest: false,
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,json,wav}'],
      },
    }),
  ],
  server: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
});
