import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vitePluginSingleSpa from 'vite-plugin-single-spa';

export default defineConfig({
  server: {
    port: 4101
  },
  plugins: [
    vue(),
    vitePluginSingleSpa({
      type: 'mife',
      serverPort: 5001,
      spaEntryPoints: "src/spa.ts",
    }),
  ],
});
