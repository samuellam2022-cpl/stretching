import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // GitHub Pages serves the site from https://<user>.github.io/stretching/
  base: '/stretching/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Post-workout Stretch 運動後拉筋',
        short_name: '拉筋',
        description: 'Post-workout stretches by muscle – body map, illustrated demos, hold timer. 中／EN',
        start_url: '/stretching/',
        scope: '/stretching/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f4f6f5',
        theme_color: '#1f8a65',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
});
