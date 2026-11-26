import { defineConfig } from '@playwright/test';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';

process.env.CROSSDEFENSE_T12_CONTROL_TOKEN ??= randomBytes(24).toString('hex');

const port = Number(process.env.CROSSDEFENSE_T12_PORT ?? '4188');
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid owned Ticket12 port.');
const label = process.env.CROSSDEFENSE_T12_RUN ?? 'focused';
if (!/^[a-z0-9-]+$/i.test(label)) throw new Error('Ticket12 evidence label must contain only letters, digits and hyphens.');
const evidence = join(process.env.CROSSDEFENSE_T12_EVIDENCE ?? join(process.env.LOCALAPPDATA ?? tmpdir(),
  'CrossDefenseTaskEvidence', 'Ticket12-20261126'), label);

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /ticket-12-[a-z-]+\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  repeatEach: 1,
  timeout: 60_000,
  outputDir: join(evidence, 'traces'),
  reporter: [['list'], ['json', { outputFile: join(evidence, 'browser-results.json') }]],
  use: {
    baseURL: 'http://127.0.0.1:' + port,
    viewport: { width: 1366, height: 768 },
    serviceWorkers: 'allow',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/testing/ticket12-production-server.mjs',
    url: 'http://127.0.0.1:' + port + '/__ticket12_health',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
