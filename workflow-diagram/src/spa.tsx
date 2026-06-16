/**
 * Конфигурация для single-spa
 */
import React from 'react';
import ReactDOMClient from 'react-dom/client';
import singleSpaReact from 'single-spa-react';
import App from './App.tsx';

const mountRoot = document.getElementById('workflow-diagram-root');

if (!mountRoot) {
  throw new Error('Не удалось найти элемент для монтирования диаграммы рабочего процесса');
}

const lifecycles = singleSpaReact({
  React,
  ReactDOMClient,
  rootComponent: App,
  errorBoundary(err, _info, _props) {
    console.error('React error:', err);
    return <div>Error: {err.message}</div>;
  },
  domElementGetter: () => mountRoot,
});

export const { bootstrap, mount, unmount } = lifecycles;
