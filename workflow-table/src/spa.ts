/**
 * Конфигурация для single-spa
 */
import { createApp, h } from 'vue';
import singleSpaVue from "single-spa-vue";
import AppComponent from './App.vue';
import './style.scss';

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
});

export const bootstrap = vueLifecycles.bootstrap;
export const mount = vueLifecycles.mount;
export const unmount = vueLifecycles.unmount;
