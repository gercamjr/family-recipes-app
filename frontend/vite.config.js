import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Family Recipes',
        short_name: 'Recipes',
        description: 'A secure, invite-only web app for family recipes with bilingual support',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
  server: {
    host: '0.0.0.0', // Listen on all addresses (required for Docker)
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true, // Enable polling for file changes in Docker
    },
    hmr: {
      host: 'localhost',
      port: 5173,
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
    // Copy service worker to build output
    copyPublicDir: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
})
