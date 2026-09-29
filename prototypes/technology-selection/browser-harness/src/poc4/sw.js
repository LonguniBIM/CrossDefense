import {
  cleanupOutdatedCaches,
  precacheAndRoute,
} from 'workbox-precaching';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST, {
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^poc$/],
});
