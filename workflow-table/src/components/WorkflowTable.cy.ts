import { createPinia } from 'pinia';
import { mount } from '@cypress/vue';
import WorkflowTable from './WorkflowTable.vue';
import { workflowStore } from '@shared/workflow/store/WorkflowStore';
import { workflowApiService } from '@shared/workflow/api/WorkflowApiService';

describe('WorkflowTable.vue', () => {
  beforeEach(() => {
    // Мокаем API сервис перед каждым тестом
    cy.stub(workflowApiService, 'getWorkflow').resolves({
      ok: true,
      value: {
        name: 'Тестовый процесс',
        steps: [
          { initialIndex: 1, name: 'Закупка', x: 0, y: 0, color: 'white', nextSteps: [2] },
          { initialIndex: 2, name: 'Доставка до таможни', x: 200, y: 0, color: 'white', nextSteps: [3] },
          { initialIndex: 3, name: 'Оформление ГТД', x: 400, y: 0, color: 'white', nextSteps: [] },
        ],
      },
    });

    cy.stub(workflowApiService, 'createStep').callsFake(() => {
      return Promise.resolve({
        ok: true,
        value: { initialIndex: 4, name: 'Новый шаг', x: 0, y: 0, color: 'white', nextSteps: [] },
      });
    });

    cy.stub(workflowApiService, 'deleteStep').resolves({
      ok: true,
      value: {
        name: 'Тестовый процесс',
        steps: [
          { initialIndex: 2, name: 'Доставка до таможни', x: 200, y: 0, color: 'white', nextSteps: [3] },
          { initialIndex: 3, name: 'Оформление ГТД', x: 400, y: 0, color: 'white', nextSteps: [] },
        ],
      },
    });

    cy.stub(workflowApiService, 'changeStepName').resolves({
      ok: true,
      value: {
        name: 'Тестовый процесс',
        steps: [
          { initialIndex: 1, name: 'Закупка товаров', x: 0, y: 0, color: 'white', nextSteps: [2] },
          { initialIndex: 2, name: 'Доставка до таможни', x: 200, y: 0, color: 'white', nextSteps: [3] },
          { initialIndex: 3, name: 'Оформление ГТД', x: 400, y: 0, color: 'white', nextSteps: [] },
        ],
      },
    });

    // Загружаем тестовые данные в WorkflowStore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    workflowStore.setWorkflow({
      name: 'Тестовый процесс',
      steps: [
        { initialIndex: 1, name: 'Закупка', x: 0, y: 0, color: 'white', nextSteps: [2] },
        { initialIndex: 2, name: 'Доставка до таможни', x: 200, y: 0, color: 'white', nextSteps: [3] },
        { initialIndex: 3, name: 'Оформление ГТД', x: 400, y: 0, color: 'white', nextSteps: [] },
      ],
    });
  });

  it('отображает заголовок с именем процесса', () => {
    mount(WorkflowTable, {
      global: {
        plugins: [createPinia()],
      },
    });

    cy.contains('Структура рабочего процесса "Тестовый процесс"').should('be.visible');
  });

  it('отображает все шаги в таблице', () => {
    mount(WorkflowTable, {
      global: {
        plugins: [createPinia()],
      },
    });

    cy.contains('Закупка').should('be.visible');
    cy.contains('Доставка до таможни').should('be.visible');
    cy.contains('Оформление ГТД').should('be.visible');
  });

  it('выделяет шаг при клике на строку', () => {
    mount(WorkflowTable, {
      global: {
        plugins: [createPinia()],
      },
    });

    cy.contains('Закупка').parents('tr').find('td.name-property').click({ force: true });
    cy.contains('Закупка').parents('tr').should('have.class', 'selected-step');
  });

  it('создаёт новый шаг при клике на кнопку "Создать состояние"', () => {
    mount(WorkflowTable, {
      global: {
        plugins: [createPinia()],
      },
    });

    // Проверяем, что сейчас 3 строки
    cy.get('table tbody tr').should('have.length', 3);

    // Кликаем на кнопку создания
    cy.contains('Создать состояние').click();

    // После создания в таблице должно стать 4 строки
    cy.get('table tbody tr', { timeout: 8000 }).should('have.length', 4);
  });

  it('удаляет шаг при клике на кнопку удаления и подтверждении', () => {
    mount(WorkflowTable, {
      global: {
        plugins: [createPinia()],
      },
    });

    // Находим строку "Закупка" и кликаем на кнопку удаления
    cy.contains('Закупка')
      .parents('tr')
      .find('button')
      .click({ force: true });

    // Подтверждаем удаление
    cy.contains('Подтвердите удаление состояния "Закупка"').should('be.visible');
    cy.contains('OK').click();

    // Шаг исчез
    cy.contains('Закупка').should('not.exist');
  });

  it('отображает пустое состояние, если нет шагов', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    workflowStore.setWorkflow({
      name: 'Пустой процесс',
      steps: [],
    });

    mount(WorkflowTable, {
      global: {
        plugins: [createPinia()],
      },
    });

    cy.contains('Список состояний пуст').should('be.visible');
  });
});