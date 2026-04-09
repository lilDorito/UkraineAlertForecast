import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/forecast': {
        target: process.env.EC2_HOST,
        changeOrigin: true,
        rewrite: () => '/latest',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            const apiKey = process.env.API_KEY;
            if (apiKey) {
              proxyReq.setHeader('x-api-key', apiKey);
            }
          });
        }
      }
    }
  }
});