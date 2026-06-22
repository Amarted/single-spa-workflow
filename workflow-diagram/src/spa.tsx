/**
 * Конфигурация для single-spa
 */

import '@vitejs/plugin-react/preamble'; // Решает проблему "preamble detection" при использовании HMR в single-spa
import React from 'react';
import ReactDOMClient from 'react-dom/client';
import singleSpaReact from 'single-spa-react';
import App from './App.tsx';
import { workflowStore } from '@shared/workflow/store/WorkflowStore';
import { store } from './store/store.ts';
import { setName, setSelectedStep, setSteps } from './store/workflowSlice';

const mountRoot = document.getElementById('workflow-diagram-root');

if (!mountRoot) {
  throw new Error('Не удалось найти элемент для монтирования диаграммы рабочего процесса');
}

interface Subscription { unsubscribe: () => void }

let isSubscribed = false;
let subscriptions: Subscription[] = [];

export const startWorkflowStoreSync = async (): Promise<void> => {
  if (isSubscribed) {
    return Promise.resolve();
  }

  try {
    const stepsSubscription = workflowStore.steps.subscribe(steps => store.dispatch(setSteps(steps)));
    const nameSubscriptin = workflowStore.name.subscribe(name => store.dispatch(setName(name)));
    const selectedSubscription = workflowStore.selectedStep.subscribe(selectedStep =>
      store.dispatch(setSelectedStep(selectedStep))
    );
    subscriptions = [stepsSubscription, nameSubscriptin, selectedSubscription];
    isSubscribed = true;

    return Promise.resolve();
  } catch (error) {

    return Promise.reject(error);
  }

};

export const stopWorkflowStoreSync = async (): Promise<void> => {
  try {

    subscriptions.forEach((sub: Subscription) => { sub.unsubscribe(); });
    isSubscribed = false;

    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

const lifecycles = singleSpaReact({
  React,
  ReactDOMClient,
  rootComponent: App,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  errorBoundary(err, _info, _props) {
    console.error('React error:', err);
    return <div>Error: {err.message}</div>;
  },
  domElementGetter: () => mountRoot,
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const { bootstrap } = lifecycles;
export const mount = [startWorkflowStoreSync, lifecycles.mount];
export const unmount = [stopWorkflowStoreSync, lifecycles.unmount];
//   return new Promise((resolve, reject) => {
//     // Always reject with an Error.
//     reject(new Error('hi'));
//   });
//   lifecycles.mount(props);
//   startWorkflowSync();
// };
// export const unmount = (props?) => {
//   lifecycles.unmount(props);
//   stopWorkflowSync();
// };
