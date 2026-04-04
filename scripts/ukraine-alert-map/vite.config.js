import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/forecast': {
        target: 'http://13.63.184.88',
        changeOrigin: true,
        rewrite: () => '/latest', // ваш ендпоінт на бекенді
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            const apiKey = process.env.VITE_API_KEY;
            if (apiKey) {
              proxyReq.setHeader('x-api-key', apiKey);
            }
          });
        }
      }
    }
  }
});