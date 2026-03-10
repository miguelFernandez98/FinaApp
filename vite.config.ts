import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [react()],
  server: {
    // Dev-only proxy: forward requests starting with /binance-proxy to Binance P2P
    proxy: {
      '/binance-proxy': {
        target: 'https://p2p.binance.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/binance-proxy/, ''),
      },
    },
  },
}))
