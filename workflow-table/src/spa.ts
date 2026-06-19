/**
 * Конфигурация для single-spa
 */
import { createApp, h, type App } from 'vue';
import singleSpaVue from "single-spa-vue";
import AppComponent from './App.vue';
import './style.scss';
import { createPinia } from 'pinia';
import { useWorkflowStore } from './shared/useWorkflowStore.ts';

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
    console.log('init vue pnia');
  },
});

const unmountStore = () => {
  const { destroy } = useWorkflowStore();
  destroy();
};

export const bootstrap = vueLifecycles.bootstrap;
export const mount = vueLifecycles.mount;
export const unmount = [vueLifecycles.unmount, unmountStore];
