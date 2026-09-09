import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Регистрация SW: autoUpdate — юзеру не нужно закрывать вкладки чтобы получить новую версию
      registerType: "autoUpdate",

      // Плагин сам инжектит <script> регистрации в HTML — ручную регистрацию из main.tsx убираем
      injectRegister: "auto",

      // Используем готовый manifest из public/manifest.json, не генерируем свой
      manifest: false,
      manifestFilename: "manifest.json",

      // Workbox: конфигурация стратегий кеширования
      workbox: {
        // Какие файлы включить в precache (будут доступны офлайн сразу после первой загрузки)
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff,woff2}"],

        // Cleanup outdated caches
        cleanupOutdatedCaches: true,

        // Размер кеша для runtime caching (для API запросов если появятся)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 год
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],

        // Навигация: попробовать сеть, fallback на cached index.html (для SPA routing)
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
      },

      // Dev-режим: включать SW чтобы можно было тестировать PWA локально
      devOptions: {
        enabled: false, // выключено чтобы не мешать разработке, включи если нужно тестить PWA
      },
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3000,
    },
  },
});
