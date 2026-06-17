import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vitePluginSingleSpa from 'vite-plugin-single-spa';

const ROOT_CONFIG_ORIGIN = 'http://localhost:5000';
const SHARED_PREFIX = '@shared/';

/**
 * Плагин, перенаправляющий импорты @shared/* на root-config dev server.
 *
 * В single-spa каждый микро-фронтенд - отдельный Vite проект со своим dev сервером.
 * Без этого плагина один и тот же файл загружается с двух разных URL,
 * что ломает singleton-объекты (WorkflowStore, EventBus и т.д.).
 *
 * Dev режим: перехватывает @shared/* импорты и возвращает полный URL на root-config.
 * root-config Vite не добавляет ?t= к shared модулям (плагин stableSharedUrlPlugin),
 * поэтому URL стабильный и единственный для всех потребителей.
 *
 * Build режим: не вмешивается (используется rollupOptions.external + import map).
 */
function sharedExternalPlugin(isBuild: boolean) {
  return {
    name: 'shared-external',
    resolveId(source: string) {
      if (!isBuild && source.startsWith(SHARED_PREFIX)) {
        const [modulePath] = source.slice(SHARED_PREFIX.length).split('?');
        const url = ROOT_CONFIG_ORIGIN + '/src/shared/' + modulePath + '.ts';
        return { id: url, external: true };
      }
      return null;
    },
    transform(code: string, id: string) {
      // Обрабатываем только shared модули (не node_modules)
      if (id.includes('node_modules') || !id.includes('/src/shared/')) {
        return null;
      }
      // Убираем ?t= из импортов /src/shared/... модулей
      // Vite добавляет ?t=<timestamp> для HMR cache-busting.
      // Мы удаляем его, чтобы URL был стабильным и единым для всех потребителей.
      const regex = /(\/src\/shared\/[^'"\s?]+)\?t=\d+/g;
      if (regex.test(code)) {
        regex.lastIndex = 0;
        return {
          code: code.replace(regex, '$1'),
          map: null,
        };
      }
      return null;
    },
  };
}

export default defineConfig(({ command }) => {
  const isBuild = command === 'build';

  return {
    server: {
      port: 5002,
    },
    plugins: [
      react(),
      sharedExternalPlugin(isBuild),
      vitePluginSingleSpa({
        type: 'mife',
        serverPort: 5002,
        spaEntryPoints: 'src/spa.tsx',
      }),
    ],
    build: {
      rollupOptions: {
        external: [
          /^@shared\/.*/,
        ],
      },
    },
  };
});
