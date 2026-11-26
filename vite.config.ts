import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import type { ManifestTransform } from 'workbox-build';

const requestedBuildId = process.env.CROSSDEFENSE_BUILD_ID;
if (requestedBuildId !== undefined && !/^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/.test(requestedBuildId)) {
  throw new Error('CROSSDEFENSE_BUILD_ID must contain 1-96 ASCII letters, digits, dots, underscores or hyphens.');
}
const buildId = requestedBuildId ?? `0.1.0-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;
let outputDirectory = resolve('dist');
const requiredPacks = [
  'development', 'development-build-ship-v1', 'development-attempt-ship-v1',
  'development-combat-ship-v1', 'development-rendered-combat-ship-v1', 'development-review-ship-v1',
];
const addIntegrity: ManifestTransform = async entries => {
  for (const version of requiredPacks) {
    const url = `content/packs/${version}/manifest.json`;
    if (!entries.some(entry => entry.url === url)) throw new Error(`Required offline content is absent from precache: ${url}`);
  }
  const manifest = await Promise.all(entries.map(async entry => {
    const bytes = await readFile(resolve(outputDirectory, entry.url));
    return { ...entry, integrity: `sha256-${createHash('sha256').update(bytes).digest('base64')}` };
  }));
  return { manifest, warnings: [] };
};

export default defineConfig({
  define: { __APP_BUILD_ID__: JSON.stringify(buildId) },
  plugins: [
    {
      name: 'crossdefense-build-context',
      configResolved(config) { outputDirectory = resolve(config.root, config.build.outDir); },
    },
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectRegister: false,
      registerType: 'prompt',
      manifest: false,
      injectManifest: {
        globPatterns: ['**/*.{html,js,css,json,svg,png,jpg,jpeg,webp,woff,woff2,wav,mp3,ogg}'],
        globIgnores: ['**/*.map', '**/sw.js', '**/sw.mjs'],
        maximumFileSizeToCacheInBytes: 16 * 1024 * 1024,
        manifestTransforms: [addIntegrity],
      },
    }),
  ],
  server: {
    host: '127.0.0.1',
    port: 4175,
    strictPort: true,
    // Generated verification artifacts are not application inputs to hot reload.
    watch: { ignored: ['**/.scratch/**'] },
  },
});
