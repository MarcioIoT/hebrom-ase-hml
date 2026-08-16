// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        // We ship our own hand-authored manifest at public/manifest.webmanifest
        // and register the SW from a guarded wrapper — never let the plugin inject.
        strategies: "generateSW",
        registerType: "autoUpdate",
        injectRegister: null,
        manifest: false,
        filename: "sw.js",
        // TanStack Start's nitro build serves static files from dist/client
        // (publicDir). Emit the SW + precache manifest there, and glob the
        // precache list from the same directory (not the dist/ root, which
        // also contains server bundles).
        outDir: "dist/client",
        // Never emit / register a service worker during dev or Lovable preview.
        devOptions: { enabled: false },
        workbox: {
          globPatterns: ["**/*.{js,css,ico,png,svg,webp,woff,woff2}"],
          globIgnores: ["**/sw.js", "**/workbox-*.js"],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigationPreload: false,
          // No navigateFallback: this is an SSR app; we want live HTML when
          // online and cached HTML (NetworkFirst) when offline.
          runtimeCaching: [
            {
              // App shell / page navigations — serve fresh when online, fall
              // back to the last cached HTML when the network is unavailable.
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: {
                cacheName: "ase-pages",
                networkTimeoutSeconds: 3,
                expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // Hashed JS/CSS build assets — immutable, safe to cache-first.
              urlPattern: ({ request }) =>
                request.destination === "script" ||
                request.destination === "style" ||
                request.destination === "worker",
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "ase-assets",
                expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              urlPattern: ({ request }) =>
                request.destination === "image" ||
                request.destination === "font",
              handler: "CacheFirst",
              options: {
                cacheName: "ase-media",
                expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 60 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // Google Fonts — cache the stylesheet + font files.
              urlPattern: ({ url }) =>
                url.origin === "https://fonts.googleapis.com" ||
                url.origin === "https://fonts.gstatic.com",
              handler: "CacheFirst",
              options: {
                cacheName: "ase-google-fonts",
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
  },
});
