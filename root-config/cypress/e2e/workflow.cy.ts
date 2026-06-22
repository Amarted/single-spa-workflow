/// <reference types="cypress" />

describe('Workflow: сквозной сценарий (таблица + диаграмма)', () => {
  beforeEach(() => {
    /* Перехватываем API до загрузки страницы */ /** @ts-ignore */
    cy.interceptWorkflowApi({
      workflowName: 'Тестовый процесс',
      steps: [
        { initialIndex: 1, name: 'Закупка', x: 0, y: 0, color: 'white', nextSteps: [2] },
        { initialIndex: 2, name: 'Доставка до таможни', x: 200, y: 0, color: 'white', nextSteps: [3] },
        { initialIndex: 3, name: 'Оформление ГТД', x: 400, y: 0, color: 'white', nextSteps: [] },
      ],
    });

    cy.visit('/', { timeout: 30000 });
  });

  /** Найти SVG диаграммы (у него есть viewBox, в отличие от иконок в таблице) */
  function getDiagramSvg() {
    return cy.get('svg[viewBox]', { timeout: 10000 });
  }

  /** Дождаться загрузки данных и появления таблицы */
  function waitForTable() {
    cy.wait('@getWorkflow', { timeout: 15000 });
    // Ждём появления заголовка таблицы
    cy.contains('Структура рабочего процесса', { timeout: 15000 }).should('be.visible');
    // Ждём появления имён шагов в таблице (через .step-name span)
    cy.get('#workflowTableComponentRoot .step-name', { timeout: 10000 }).should('have.length.at.least', 3);
  }

  /** Найти строку таблицы по имени шага */
  function getTableRowByStepName(name: string) {
    return cy.contains('#workflowTableComponentRoot td.name-property .step-name', name).parents('tr');
  }

  it('1. Загружает страницу и отображает таблицу и диаграмму', () => {
    waitForTable();

    // Таблица: строки с шагами
    cy.get('#workflowTableComponentRoot .step-name').should('contain', 'Закупка');
    cy.get('#workflowTableComponentRoot .step-name').should('contain', 'Доставка до таможни');
    cy.get('#workflowTableComponentRoot .step-name').should('contain', 'Оформление ГТД');

    // Диаграмма: SVG с блоками
    getDiagramSvg().should('exist');
    getDiagramSvg().contains('text', 'Закупка').should('exist');
    getDiagramSvg().contains('text', 'Доставка до таможни').should('exist');
    getDiagramSvg().contains('text', 'Оформление ГТД').should('exist');

    // Диаграмма: линии-стрелки (соединения между шагами)
    getDiagramSvg().find('line').should('have.length.at.least', 2);
  });

  it('2. Создание нового шага через таблицу', () => {
    waitForTable();

    // Клик на кнопку "Создать состояние"
    cy.contains('Создать состояние').click();

    // Ждём ответа от сервера (мок)
    cy.wait('@createStep');

    // После создания открывается редактор имени — закрываем его через Escape
    cy.get('input[type="text"]').type('{esc}');

    // Новый шаг появился в таблице
    cy.get('#workflowTableComponentRoot .step-name').should('contain', 'Шаг 4');

    // Новый шаг появился на диаграмме
    getDiagramSvg().contains('text', 'Шаг 4').should('exist');
  });

  it('3. Выделение шага в таблице — шаг выделяется на диаграмме', () => {
    waitForTable();

    // Кликаем на строку "Закупка" в таблице
    getTableRowByStepName('Закупка').click({ force: true });

    // Проверяем, что строка получила класс выделения
    getTableRowByStepName('Закупка').should('have.class', 'selected-step');

    // На диаграмме блок "Закупка" должен быть выделен (появляется .resize-frame)
    getDiagramSvg().find('.resize-frame').should('exist');
  });

  it('4. Удаление шага через таблицу', () => {
    waitForTable();

    // Находим строку "Оформление ГТД" в таблице и кликаем на кнопку удаления
    getTableRowByStepName('Оформление ГТД')
      .find('button')
      .click({ force: true });

    // Подтверждаем удаление в модальном окне
    cy.contains('Подтвердите удаление состояния "Оформление ГТД"').should('be.visible');
    cy.contains('OK').click();

    // Ждём ответа
    cy.wait('@deleteStep');

    // Шаг исчез из таблицы
    cy.get('#workflowTableComponentRoot .step-name').should('not.contain', 'Оформление ГТД');

    // Шаг исчез с диаграммы
    getDiagramSvg().contains('text', 'Оформление ГТД').should('not.exist');
  });

  it('5. Редактирование имени шага', () => {
    waitForTable();

    // Кликаем на имя "Закупка" в таблице, чтобы открыть редактор
    getTableRowByStepName('Закупка').click({ force: true });
    cy.get('.edit-name-wrapper').first().click({ force: true });

    // Появляется форма редактирования (поле ввода)
    cy.get('input[type="text"]').should('be.visible');

    // Меняем имя (force: true, т.к. может быть перекрыто тостом)
    cy.get('input[type="text"]').clear({ force: true }).type('Закупка товаров{enter}', { force: true });

    // Ждём ответа
    cy.wait('@changeStepName');

    // Новое имя отображается в таблице
    cy.get('#workflowTableComponentRoot .step-name').should('contain', 'Закупка товаров');

    // Новое имя отображается на диаграмме
    getDiagramSvg().contains('text', 'Закупка товаров').should('exist');
  });

  it('6. Выделение шага на диаграмме (клик по SVG-блоку)', () => {
    waitForTable();

    // Кликаем по SVG-блоку "Закупка" на диаграмме
    getDiagramSvg().contains('text', 'Закупка').click({ force: true });

    // В таблице строка "Закупка" должна быть выделена
    getTableRowByStepName('Закупка').should('have.class', 'selected-step');
  });

  it('7. Удаление шага клавишей Delete', () => {
    waitForTable();

    // Выделяем шаг "Доставка до таможни" в таблице
    getTableRowByStepName('Доставка до таможни').click({ force: true });

    // Нажимаем Delete
    cy.get('body').type('{del}');

    // Подтверждаем удаление
    cy.contains('Подтвердите удаление состояния "Доставка до таможни"').should('be.visible');
    cy.contains('OK').click();

    cy.wait('@deleteStep');

    // Шаг исчез
    cy.get('#workflowTableComponentRoot .step-name').should('not.contain', 'Доставка до таможни');
  });
});