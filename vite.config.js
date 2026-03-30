import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = (env.VITE_AZURE_API_BASE_URL || 'https://plant-analyzer-api.jollyocean-54e948a5.southeastasia.azurecontainerapps.io').replace(/\/+$/, '');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      open: true,
      proxy: {
        '/azure-api': {
          target,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/azure-api/, '')
        }
      }
    }
  };
});
