import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main/index.ts',
        onstart({ startup }) {
          startup()
        },
        vite: {
          build: {
            sourcemap: true,
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: ['better-sqlite3', 'electron-store']
            }
          }
        }
      },
      {
        entry: 'electron/preload/index.ts',
        vite: {
          build: {
            sourcemap: true,
            outDir: 'dist-electron/preload'
          }
        }
      }
    ]),
    renderer()
  ],
  server: {
    port: 5173
  }
})