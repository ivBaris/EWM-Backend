importScripts("/precache-manifest.007690c4eb9770c5b3e44ee7801f2e7d.js", "https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js");

/* eslint-disable no-undef */
if (workbox) {
  console.log(`Workbox is loaded 🎉`);
} else {
  console.log(`Workbox didn't load `);
}
// eslint-disable-next-line
workbox.precaching.precacheAndRoute(self.__precacheManifest);
// eslint-disable-next-line
self.addEventListener("install", (event) =>
  event.waitUntil(self.skipWaiting())
);
// eslint-disable-next-line
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim())
);
// app-shell
workbox.routing.registerRoute("/", new workbox.strategies.NetworkFirst());

