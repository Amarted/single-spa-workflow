import { defineConfig } from 'cypress';
import { devServer } from '@cypress/vite-dev-server';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  component: {
    supportFile: 'cypress/support/component.ts',
    specPattern: 'src/**/*.cy.{ts,tsx}',
    devServer(cypressDevServerConfig) {
      return devServer({
        ...cypressDevServerConfig,
        viteConfig: {
          plugins: [react()],
          resolve: {
            alias: {
              '@shared': path.resolve(__dirname, '../root-config/src/shared'),
            },
          },
        },
      });
    },
  },
});