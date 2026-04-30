import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',

  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 🔥 fix your error
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
          },
          {
            urlPattern: ({ request }) => request.destination === 'script',
            handler: 'StaleWhileRevalidate',
          },
          {
            urlPattern: ({ request }) => request.destination === 'style',
            handler: 'StaleWhileRevalidate',
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 50,
              },
            },
          },
        ],
      },

      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],

      manifest: {
        name: 'LMS App',
        short_name: 'LMS',
        description: 'Learning Management System',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './src/shared'),
      '@admin': path.resolve(__dirname, './src/apps/admin'),
      '@student': path.resolve(__dirname, './src/apps/student'),
      '@superadmin': path.resolve(__dirname, './src/apps/superadmin'),
    },
  },

  server: {
    port: 5173,
  },

  preview: {
    port: 5173,
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,

    chunkSizeWarningLimit: 1000, // increase warning threshold

    rollupOptions: {
      output: {
        manualChunks: {
          // 🔥 separate vendor libs
          vendor: ['react', 'react-dom'],

          // 🔥 split by modules
          student: [
            './src/apps/student/pages/StudentHome.jsx',
            './src/apps/student/pages/StudentChat.jsx',
          ],
          admin: [
            './src/apps/admin/pages/AdminDashboard.jsx',
          ],
        },
      },
    },
  },
});