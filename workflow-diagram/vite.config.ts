import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vitePluginSingleSpa from 'vite-plugin-single-spa';

export default defineConfig({
  server: {
    port: 5002,
    hmr: false, // Выключен из-за проблемы загрузки в single-spa (preambule)
  },
  plugins: [
    react(),
    vitePluginSingleSpa({
      type: 'mife',
      serverPort: 5002,
      spaEntryPoints: 'src/spa.tsx',
    }),
  ],
});
