/**
 * Конфигурация для single-spa
 */
import { createApp, h, type App } from 'vue';
import singleSpaVue from "single-spa-vue";
import AppComponent from './App.vue';
import { createPinia } from 'pinia';
import { useWorkflowStore } from './store/useWorkflowStore.ts';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faFile, faTrashCan, faEdit } from '@fortawesome/free-regular-svg-icons';
/** Добавляем только нужные иконки */
library.add(faFile, faTrashCan, faEdit);

const mountRoot = document.getElementById('workflow-table-root');

if (!mountRoot) {
  throw new Error('Не удалось найти элемент для монтирования таблицы шагов рабочего процесса');
}


const vueLifecycles = singleSpaVue({
  createApp,
  appOptions: {
    el: mountRoot,
    render() {
      return h(AppComponent, {});
    },
  },
  handleInstance: (vueApplication: App) => {
    const pinia = createPinia();
    vueApplication.use(pinia);
  },
});

const unmountStore = () => {
  const { destroy } = useWorkflowStore();
  destroy();
};

// eslint-disable-next-line @typescript-eslint/unbound-method
export const bootstrap = vueLifecycles.bootstrap;
// eslint-disable-next-line @typescript-eslint/unbound-method
export const mount = vueLifecycles.mount;
// eslint-disable-next-line @typescript-eslint/unbound-method
export const unmount = [vueLifecycles.unmount, unmountStore];
