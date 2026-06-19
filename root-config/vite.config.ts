import { defineConfig } from 'vite';
import vitePluginSingleSpa from 'vite-plugin-single-spa';

const ROOT_CONFIG_ORIGIN = 'http://localhost:5000';
const SHARED_PREFIX = '@shared/';

/**
 * Плагин, обеспечивающий единый URL для @shared/* модулей.
 *
 * root-config и микро-фронтенды импортируют @shared/* модули.
 * Без этого плагина root-config Vite добавляет ?t=... к URL shared модулей,
 * а микро-фронтенды запрашивают их без ?t= через sharedExternalPlugin.
 * В результате один файл загружается с двух разных URL, что ломает
 * ES module cache и создаёт два экземпляра singleton (WorkflowStore и т.д.).
 *
 * Плагин решает проблему двумя способами:
 * 1. resolveId — перехватывает @shared/* импорты и возвращает полный URL
 *    на root-config dev server. Vite помечает такой импорт как external
 *    и не добавляет ?t=. Браузер импортирует модуль по стабильному URL,
 *    единому для всех потребителей.
 * 2. transform (order: 'post') — убирает ?t= из импортов внутри shared
 *    модулей (транзитивные зависимости через относительные пути).
 *    Это нужно, чтобы EventBus, MessageService и другие модули,
 *    импортированные через относительные пути (../../EventBus),
 *    также имели стабильный URL без ?t=.
 */
function stableSharedUrlPlugin() {
  return {
    name: 'stable-shared-url',
    resolveId(source: string) {
      if (source.startsWith(SHARED_PREFIX)) {
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

export default defineConfig({
  server: {
    port: 5000,
  },
  plugins: [
    stableSharedUrlPlugin(),
    vitePluginSingleSpa({
      type: 'root',
      imo: '6.1.0',
      importMaps: {
        dev: ['src/importMap.dev.json', 'src/importMap.shared.json'],
        build: ['src/importMap.json', 'src/importMap.shared.json'],
      },
    }),
  ],
  resolve: {
    alias: {
      // @shared alias отключён — он заставлял Vite добавлять ?t= к URL.
      // Все @shared/* импорты обрабатываются плагином stableSharedUrlPlugin
      // через resolveId, который возвращает полный URL с external: true.
      // '@shared': path.resolve(__dirname, './src/shared'),
    }
  },
});
