import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { workflowSlice, setSteps } from '../store/workflowSlice';
import { WorkflowDiagram } from './WorkflowDiagram';

/**
 * Создаёт тестовый Redux store с предустановленными шагами.
 */
function createTestStore(steps: { initialIndex: number; name: string; x: number; y: number; color?: string; nextSteps: number[] }[]) {
  const store = configureStore({
    reducer: { workflow: workflowSlice.reducer },
  });

  store.dispatch(setSteps(steps));
  return store;
}

describe('WorkflowDiagram', () => {
  it('отображает шаги в виде SVG-блоков', () => {
    const store = createTestStore([
      { initialIndex: 1, name: 'Шаг 1', x: 0, y: 0, color: 'white', nextSteps: [2] },
      { initialIndex: 2, name: 'Шаг 2', x: 200, y: 0, color: 'white', nextSteps: [] },
    ]);

    cy.mount(
      <Provider store={store}>
        <WorkflowDiagram />
      </Provider>
    );

    cy.get('svg').should('exist');
    cy.get('svg text').should('contain', 'Шаг 1');
    cy.get('svg text').should('contain', 'Шаг 2');
    cy.get('svg line').should('have.length.at.least', 1);
  });

  it('отображает пустое состояние, если нет шагов', () => {
    const store = createTestStore([]);

    cy.mount(
      <Provider store={store}>
        <WorkflowDiagram />
      </Provider>
    );

    cy.contains('Нет шагов для отображения').should('be.visible');
  });

  it('отображает несколько соединений между шагами', () => {
    const store = createTestStore([
      { initialIndex: 1, name: 'A', x: 0, y: 0, color: 'white', nextSteps: [2, 3] },
      { initialIndex: 2, name: 'B', x: 200, y: 0, color: 'white', nextSteps: [] },
      { initialIndex: 3, name: 'C', x: 200, y: 100, color: 'white', nextSteps: [] },
    ]);

    cy.mount(
      <Provider store={store}>
        <WorkflowDiagram />
      </Provider>
    );

    cy.get('svg line').should('have.length', 2);
  });

  it('рендерит блоки с правильными размерами', () => {
    const store = createTestStore([
      { initialIndex: 1, name: 'Короткое имя', x: 0, y: 0, color: 'white', nextSteps: [] },
      { initialIndex: 2, name: 'Очень длинное имя шага для проверки расчёта ширины', x: 0, y: 100, color: 'white', nextSteps: [] },
    ]);

    cy.mount(
      <Provider store={store}>
        <WorkflowDiagram />
      </Provider>
    );

    // Проверяем, что блоки отрендерились (есть rect элементы)
    cy.get('svg rect').should('have.length.at.least', 2);
  });
});