/// <reference lib="webworker" />
import { PrecacheController, PrecacheRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { APP_BUILD_ID, MAX_CACHE_ENTRY_BYTES, type CacheStatus, type OfflineRequest } from './infrastructure/offline/protocol';

declare let self: ServiceWorkerGlobalScope;

const scope = new URL(self.registration.scope);
const cachePrefix = `crossdefense-app-${encodeURIComponent(scope.pathname)}-`;
const integrityHeader = 'X-CrossDefense-Integrity';
const controller = new PrecacheController({
  // Retain previous build caches. No application or Player Data garbage collection occurs here.
  cacheName: `${cachePrefix}${APP_BUILD_ID}`,
  plugins: [{
    async cacheWillUpdate({ request, response }) {
      const key = controller.getCacheKeyForURL(request.url) ?? request.url;
      const expected = controller.getIntegrityForCacheKey(key);
      if (!await hasIntegrity(response.clone(), expected)) return null;
      const headers = new Headers(response.headers);
      headers.set(integrityHeader, expected!);
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    },
    async cachedResponseWillBeUsed({ request, cachedResponse }) {
      if (!cachedResponse) return undefined;
      const expected = controller.getIntegrityForCacheKey(request.url);
      return await hasIntegrity(cachedResponse.clone(), expected) ? cachedResponse : undefined;
    },
  }],
});
controller.addToCacheList(self.__WB_MANIFEST);
registerRoute(new PrecacheRoute(controller, { cleanURLs: false }));
// A newly opened old-build page can race safe activation. Its version-addressed
// chunks remain readable; navigation and unknown/source paths never use this route.
registerRoute(({ url }) => url.origin === scope.origin
  && url.pathname.startsWith(new URL('assets/', scope).pathname)
  && /-[A-Za-z0-9_-]{8,}\.(?:js|css)$/.test(url.pathname), async ({ request }) => {
  for (const name of await caches.keys()) {
    if (!name.startsWith(cachePrefix) || name === controller.strategy.cacheName) continue;
    const cache = await caches.open(name);
    for (const key of await cache.keys()) {
      const url = new URL(key.url);
      url.searchParams.delete('__WB_REVISION__');
      if (url.href !== request.url) continue;
      const response = await cache.match(key);
      if (response && await hasIntegrity(response.clone(), response.headers.get(integrityHeader) ?? undefined)) return response;
    }
  }
  return fetch(request);
});
self.addEventListener('install', event => { void controller.install(event); });
self.addEventListener('activate', event => { void controller.activate(event); });

async function readBoundedBody(response: Response): Promise<Uint8Array<ArrayBuffer>> {
  const declared = response.headers.get('content-length');
  if (declared !== null && Number(declared) > MAX_CACHE_ENTRY_BYTES) throw new Error('Offline asset exceeds the size limit.');
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array(0);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > MAX_CACHE_ENTRY_BYTES) {
        void reader.cancel().catch(() => undefined);
        throw new Error('Offline asset exceeds the size limit.');
      }
      chunks.push(next.value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return body;
}

async function hasIntegrity(response: Response, expected: string | undefined): Promise<boolean> {
  if (response.status !== 200 || !expected || !/^sha256-[A-Za-z0-9+/]{43}=$/.test(expected)) return false;
  try {
    const body = await readBoundedBody(response);
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', body));
    return `sha256-${btoa(String.fromCharCode(...digest))}` === expected;
  } catch { return false; }
}

let checking: Promise<CacheStatus> | undefined;
function checkCache(): Promise<CacheStatus> {
  if (checking) return checking;
  checking = verifyCache().finally(() => { checking = undefined; });
  return checking;
}

async function verifyCache(): Promise<CacheStatus> {
  const missing: string[] = [];
  for (const [url, key] of controller.getURLsToCacheKeys()) {
    try {
      const response = await controller.matchPrecache(url);
      const expected = controller.getIntegrityForCacheKey(key);
      if (!response || !await hasIntegrity(response, expected)) throw new Error('Offline asset is missing or corrupt.');
    } catch { missing.push(new URL(url).pathname); }
  }
  return { buildId: APP_BUILD_ID, ready: missing.length === 0 && controller.getURLsToCacheKeys().size > 0, missing };
}

let repairing: Promise<CacheStatus> | undefined;
function repairCache(event: ExtendableEvent): Promise<CacheStatus> {
  if (repairing) return repairing;
  repairing = repairManifest(event).finally(() => { repairing = undefined; });
  return repairing;
}

async function repairManifest(event: ExtendableEvent): Promise<CacheStatus> {
  const current = await checkCache();
  if (current.ready) return current;
  const missing = new Set(current.missing);
  const requestAbort = new AbortController();
  const timer = setTimeout(() => requestAbort.abort(), 12_000);
  try {
    for (const [url, key] of controller.getURLsToCacheKeys()) {
      const address = new URL(url);
      if (!missing.has(address.pathname)) continue;
      if (requestAbort.signal.aborted) break;
      const integrity = controller.getIntegrityForCacheKey(key);
      if (address.origin !== scope.origin || !address.pathname.startsWith(scope.pathname) || !integrity) continue;
      try {
        // Only this immutable manifest supplies URLs, keys and integrity. The caller cannot choose a resource.
        const [response, done] = controller.strategy.handleAll({
          event,
          request: new Request(url, { cache: 'reload', credentials: 'same-origin', redirect: 'error', signal: requestAbort.signal }),
          params: { cacheKey: key, integrity },
        });
        await Promise.all([response.then(result => readBoundedBody(result)), done]);
      } catch { /* A failed repair leaves the current build and Player Data untouched. */ }
    }
  } finally { clearTimeout(timer); }
  return verifyCache();
}

function withinScope(client: Client): boolean {
  try {
    const url = new URL(client.url);
    return url.origin === scope.origin && url.pathname.startsWith(scope.pathname);
  } catch { return false; }
}

function validRequest(value: unknown): value is OfflineRequest {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  if (Object.keys(candidate).some(key => key !== 'type' && key !== 'buildId')) return false;
  const identity = candidate.buildId;
  if (identity !== undefined && (typeof identity !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/.test(identity))) return false;
  return candidate.type === 'CHECK_CACHE' || ((candidate.type === 'ACTIVATE_UPDATE' || candidate.type === 'CLAIM_CURRENT' || candidate.type === 'REPAIR_CACHE') && typeof identity === 'string');
}

async function isOnlyWindow(sender: Client): Promise<boolean> {
  const windows = (await self.clients.matchAll({ type: 'window', includeUncontrolled: true })).filter(withinScope);
  return windows.length === 1 && windows[0]?.id === sender.id;
}

let changingControl = false;
self.addEventListener('message', event => {
  const port = event.ports[0];
  if (!port) return;
  event.waitUntil((async () => {
    const reply = (value: unknown) => port.postMessage(value);
    const source = event.source;
    if (event.origin !== scope.origin || !source || !('id' in source) || !validRequest(event.data)) {
      reply({ activated: false, claimed: false, reason: 'Invalid offline request.' }); return;
    }
    const sender = await self.clients.get(source.id);
    if (!sender || sender.type !== 'window' || !withinScope(sender)) {
      reply({ activated: false, claimed: false, reason: 'The requesting window is outside this application.' }); return;
    }
    const request: OfflineRequest = event.data;
    if (request.type === 'CHECK_CACHE') { reply(await checkCache()); return; }
    if (request.type === 'REPAIR_CACHE') {
      if (request.buildId !== APP_BUILD_ID) { reply({ buildId: APP_BUILD_ID, ready: false, missing: [] }); return; }
      reply(changingControl ? await checkCache() : await repairCache(event)); return;
    }
    const response = (accepted: boolean, reason?: string) => reply({
      ...(request.type === 'ACTIVATE_UPDATE' ? { activated: accepted } : { claimed: accepted }),
      ...(reason ? { reason } : {}),
    });
    if (request.buildId !== APP_BUILD_ID) { response(false, 'The requested App build has changed. Check again.'); return; }
    if (changingControl) { response(false, 'An App transition is already in progress.'); return; }
    changingControl = true;
    try {
      if (!(await checkCache()).ready) { response(false, 'Offline preparation is incomplete. Retry while online.'); return; }
      if (!await isOnlyWindow(sender)) { response(false, 'Close other CrossDefense windows before applying this App build.'); return; }
      if (request.type === 'CLAIM_CURRENT') {
        const controlled = await self.clients.matchAll({ type: 'window' });
        if (controlled.some(client => client.id === sender.id)) { response(false, 'This window already has a controlling App build.'); return; }
        await self.clients.claim();
      } else {
        await self.skipWaiting();
      }
      response(true);
    } catch { response(false, 'The App transition could not complete. Retry from a safe entry or Build point.'); }
    finally { changingControl = false; }
  })().catch(() => {
    port.postMessage({ activated: false, claimed: false, reason: 'Offline storage could not be checked. Retry without replacing Player Data.' });
  }).finally(() => port.close()));
});
