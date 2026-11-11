import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { rolldownOptions: { output: { manualChunks(id) { if (id.includes('/three/')) return 'three-visual'; if (id.includes('node_modules')) return id.includes('/@mui/') || id.includes('/@emotion/') ? 'ui-vendor' : 'vendor'; } } } },
  server: {
    port: 5173,
    proxy: {
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
