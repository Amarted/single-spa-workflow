import { defineConfig } from 'vite';
import path from 'path';
import vitePluginSingleSpa from 'vite-plugin-single-spa';

export default defineConfig({
  server: {
    port: 5000,
  },
  plugins: [
    vitePluginSingleSpa({
      type: 'root',
      imo: '6.1.0',
      // Плагин сам загружает src/importMap.json and src/importmap.dev.json по умолчанию
      // так что нет необходимости в конфигурации importMaps.     
    }),
  ],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './src/shared'),
      // 'workflow-table': 'http://localhost:5001/src/spa.ts',
      // 'workflow-diagram': 'http://localhost:5002/src/spa.tsx',
    }
  }
});
