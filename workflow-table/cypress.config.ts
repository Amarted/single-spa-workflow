import { defineConfig } from 'cypress';
import { devServer } from '@cypress/vite-dev-server';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  component: {
    supportFile: 'cypress/support/component.ts',
    specPattern: 'src/**/*.cy.{ts,js}',
    devServer(cypressDevServerConfig) {
      return devServer({
        ...cypressDevServerConfig,
        viteConfig: {
          // Используем плагин Vue (как и в основном vite.config.ts)
          plugins: [vue()],
          // Настраиваем алиас для @shared вручную, т.к. sharedExternalPlugin
          // работает только в dev-режиме single-spa, а в тестах он не нужен
          resolve: {
            alias: {
              '@shared': path.resolve(__dirname, '../root-config/src/shared'),
            },
          },
          // Отключаем плагин single-spa для тестов
          // (он не нужен и может вызвать ошибки)
        },
      });
    },
  },
});