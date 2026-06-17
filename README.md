# Микрофронтенд приложение для настройки рабочих процессов

Приложение, позволяющее настраивать рабочий процесс (последовательность шагов \ состояний) и переходов между ними на примере поставки товаров: закупка \ доставка до таможенного терминала \ оформление ГТД \ доставка до пункта перегрузки \ перегрузка \ доставка до склада \ приёмка и прочее.

## Установка и запуск

Проект состоит из трех частей, которые нужно запускать параллельно:
1. `root-config`: Точка входа, общий UI (стили, шрифты, модальные окна, тосты), регистрация и маршрутизация микрофронтендов. Агностичен к фреймворкам.
2. `workflow-table`: Таблица шагов, основной источник данных (Master of Data).
3. `workflow-diagram`: Диаграмма, потребитель данных (Slave/Viewer).

### Порядок действий

1. Установите зависимости в корне:
   ```bash
   cd root-config && yarn install &&
   cd ../workflow-table && yarn install &&
   cd ../workflow-diagram && yarn install
   ```

2. Запустите проект

```bash
# 1. workflow-table
cd workflow-table
yarn dev

# 2. workflow-diagram
cd workflow-diagram
yarn dev

# 3. root-config
cd root-config
yarn dev
```
3. Откройте в браузере http://localhost:5000.

### Конфигурация
В файле `root-config/src/config.ts` можно настроить URL для серверного API процессов, и другие настройки.

## Технологии
**Шаги рабочего процесса:** TypeScript, Vue3, Pinia\
**Диаграмма рабочего процесса:** TypeScript, React19, Redux\
**Top-level роутер приложения:** Single-Spa (монтирование микрофреймворков, общий UI)\
**Стили:** SCSS (модульный), CSS переменные\
**Тестирование:** Cypress (интеграционное), Vitest (юнит)

## Архитектура

### Микрофронтенды
- Шаги рабочего процесса, в виде интерактивной таблицы
- Диаграмма рабочего процесса, визуализирующая шаги и их связи

### Взаимодействие
Взаимодействие между микрофронтендами осуществляется через **события (Pub/Sub + Custom Events)**, что обеспечивает слабую связность (Decoupling) и лучшую масштабируемость: можем добавить третий микрофронт, ему не нужно будет импортировать API первых двух, и не нужно менять сами микрофронты.

### Управление состоянием UI и Backend

**Store = Source of Truth:** Логика валидации, запросов к бэкенду для синхронизации и обновления состояния инкапсулирована внутри стора (методы/actions). Компоненты остаются "глупыми" (dumb components), реагируя только на изменения стейта.

**Синхронизация:** Изменения передаются в виде событий CustomEvents, которые обробатываются в соответсвующем хранилище. Хранилище обновляет state (включая backend). Обновление state вызывает обновление "глупых" компонентов, которые подписаны на него (pub/sub), где это нужно.

### Структура

- root-config: Single-spa, агностичен к фреймворкам. Отвечает за регистрации микро-фронтендов, а также за styleguide: общие стили, цвета, шрифты, общий UI и сервисы (модальные окна, уведомления/тосты).
- workflow-table: Отображает шаги процесса и связи между ними, и предоставляет инструменты для работы с ними.
- workflow-diagram: Визуализирует диаграму рабочего процесса: шаги в виде блоков и их связи стрелками.

### Общие стили и UI
**CSS Variables:** Базовые цвета и шрифты объявлены в :root в root-config. Все приложения используют эти переменные, гарантируя единый визуальный стиль.

**Шрифты:** Подключены исключительно в root-config/index.html через @font-face для предотвращения FOUT и дублирования.

**Shared UI Components:** Модальные окна и уведомления реализованы как общий сервис MessageService в root-config, что исключает дублирование логики и зависимость от фреймворков.

### Shared модули (@shared) и Singleton Store

Общие модули (store, сервисы, интерфейсы) находятся в `root-config/src/shared/` и доступны микро-фронтендам через алиас `@shared/*`.

**Проблема:** В single-spa каждый микро-фронтенд — это отдельный Vite проект со своим dev сервером. Если микро-фронтенд импортирует `@shared/workflow/store/WorkflowStore`, его Vite сервер обслуживает файл под своим URL (через `@fs`). В результате браузер загружает один и тот же файл с двух разных URL, и ES module cache создаёт два отдельных экземпляра модуля, и два `new WorkflowStore()`.

**Решение — три механизма, работающих вместе:**

1. **`sharedExternalPlugin` в микро-фронтендах** (`workflow-table/vite.config.ts`, `workflow-diagram/vite.config.ts`):
   - Перехватывает импорты `@shared/*` в хуке `resolveId`
   - Возвращает полный URL на root-config dev server: `http://localhost:5000/src/shared/...`
   - Vite помечает импорт как `external` и не добавляет `?t=` для HMR
   - Браузер загружает модуль с root-config — один URL, один экземпляр

2. **`stableSharedUrlPlugin` в root-config** (`root-config/vite.config.ts`):
   - **`resolveId`**: Перехватывает импорты `@shared/*` и возвращает полный URL на себя (`http://localhost:5000/src/shared/...`) с `external: true`. Это гарантирует, что root-config использует тот же URL для shared модулей, что и микро-фронтенды.
   - **`transform`**: Убирает `?t=<timestamp>` из импортов внутри shared модулей (транзитивные зависимости через относительные пути, например `../../EventBus`). Это нужно, чтобы все shared модули имели стабильный URL без HMR cache-busting.
   - **`resolve.alias` отключён**: Алиас `@shared` закомментирован, потому что он заставлял Vite добавлять `?t=` к URL shared модулей. Все `@shared/*` импорты обрабатываются плагином через `resolveId`.

3. **Build режим** — `build.rollupOptions.external: [/^@shared\/.*/]`:
   - Rollup не бандлит `@shared/*` модули, оставляя bare specifier в коде
   - В рантайме specifier разрешается через import map (`importMap.shared.json`)
   - Import map указывает на собранные артефакты shared модулей

**Почему `?t=` ломает singleton:**
Vite добавляет `?t=<timestamp>` к URL модулей для HMR cache-busting. Если root-config импортирует `@shared/workflow/store/WorkflowStore` через алиас, Vite резолвит его в `/src/shared/workflow/store/WorkflowStore.ts?t=12345`. Микро-фронтенды через `sharedExternalPlugin` запрашивают `http://localhost:5000/src/shared/workflow/store/WorkflowStore.ts` (без `?t=`). Браузер видит два разных URL, два модуля и получаем два singleton.

**Конфигурация:**
- [`root-config/src/importMap.shared.json`](root-config/src/importMap.shared.json) — import map для shared модулей (используется в build)
- [`root-config/vite.config.ts`](root-config/vite.config.ts) — `stableSharedUrlPlugin` + отключённый `@shared` alias + shared import map
- [`workflow-table/vite.config.ts`](workflow-table/vite.config.ts) — `sharedExternalPlugin` + `build.rollupOptions.external`
- [`workflow-diagram/vite.config.ts`](workflow-diagram/vite.config.ts) — то же самое (на будущее)
- TypeScript resolution для `@shared/*` настроена в `tsconfig.app.json` каждого микро-фронтенда через `paths`
