import { defineConfig } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { basename, join } from 'node:path';
import { tmpdir } from 'node:os';
import base from './playwright.config';

const production = process.env.CROSSDEFENSE_T12_REGRESSION_PRODUCTION === '1';
const port = production ? 4242 : 4241;
const label = process.env.CROSSDEFENSE_T12_RUN ?? (production ? 'regression-production' : 'regression-development');
if (!/^[a-z0-9-]+$/i.test(label)) throw new Error('Invalid Ticket12 regression evidence label.');
const evidence = join(process.env.CROSSDEFENSE_T12_EVIDENCE ?? join(process.env.LOCALAPPDATA ?? tmpdir(),
  'CrossDefenseTaskEvidence', 'Ticket12-20261126'), label);
const tracked = execFileSync('git', ['ls-files', '--', 'tests/e2e/*.spec.ts'], { encoding: 'utf8' })
  .trim().split(/\r?\n/).map(file => basename(file)).filter(file => /^ticket-(0[1-9]|1[01])/.test(file));
const productionSelection = ['ticket-02-ship-pack.spec.ts', 'ticket-03-ui.spec.ts', 'ticket-04-ui.spec.ts',
  'ticket-05-ui.spec.ts', 'ticket-06-ui.spec.ts', 'ticket-07-ui.spec.ts', 'ticket-08-ui.spec.ts',
  'ticket-08-footer.spec.ts', 'ticket-09-ui.spec.ts', 'ticket-10-ui.spec.ts', 'ticket-11-ui.spec.ts',
  'ticket-11-persistence.spec.ts', 'ticket-11-keyboard.spec.ts'];

export default defineConfig({
  ...base,
  testDir: './tests/e2e',
  testMatch: production ? productionSelection : tracked,
  workers: 1, retries: 0, repeatEach: 1,
  outputDir: join(evidence, 'traces'),
  reporter: [['list'], ['json', { outputFile: join(evidence, 'browser-results.json') }]],
  use: {
    ...base.use, headless: false, baseURL: 'http://127.0.0.1:' + port,
    viewport: { width: 1366, height: 768 }, trace: 'retain-on-failure', screenshot: 'only-on-failure',
    // Existing response-fault fixtures require their original network seam. The separate Ticket12 suite proves real workers.
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js ' + (production ? 'preview ' : '') + '--host 127.0.0.1 --port ' + port + ' --strictPort',
    url: 'http://127.0.0.1:' + port, reuseExistingServer: false, timeout: 30_000,
  },
});
