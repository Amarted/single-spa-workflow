/**
 * Перехватывает API-запросы к workflow backend и возвращает мок-данные.
 * Используется в E2E-тестах, чтобы не зависеть от реального сервера.
 */
Cypress.Commands.add('interceptWorkflowApi', (mockData: {
  workflowName?: string;
  steps?: Array<{
    initialIndex: number;
    name: string;
    x: number;
    y: number;
    color?: string;
    nextSteps: number[];
  }>;
}) => {
  const defaultSteps = [
    { initialIndex: 1, name: 'Закупка', x: 0, y: 0, color: 'white', nextSteps: [2] },
    { initialIndex: 2, name: 'Доставка до таможни', x: 200, y: 0, color: 'white', nextSteps: [3] },
    { initialIndex: 3, name: 'Оформление ГТД', x: 400, y: 0, color: 'white', nextSteps: [] },
  ];

  const steps = mockData?.steps ?? defaultSteps;
  const wfName = mockData?.workflowName ?? 'Тестовый процесс';

  // Перехватываем GET /workflow/get
  cy.intercept('GET', '**/workflow/get*', {
    statusCode: 200,
    body: {
      name: wfName,
      steps,
    },
  }).as('getWorkflow');

  // Перехватываем POST /workflow/createStep
  cy.intercept('POST', '**/workflow/createStep', (req) => {
    const body = req.body as { stepName: string; x: number; y: number; color?: string; nextSteps: number[] };
    const newIndex = steps.length + 1;
    const newStep = {
      initialIndex: newIndex,
      name: body.stepName,
      x: body.x,
      y: body.y,
      color: body.color ?? 'white',
      nextSteps: body.nextSteps ?? [],
    };
    steps.push(newStep);
    req.reply({
      statusCode: 200,
      body: newStep,
    });
  }).as('createStep');

  // Перехватываем POST /workflow/changeStepName
  cy.intercept('POST', '**/workflow/changeStepName', (req) => {
    const body = req.body as { stepInitialIndex: number; stepName: string };
    const step = steps.find(s => s.initialIndex === body.stepInitialIndex);
    if (step) {
      step.name = body.stepName;
    }
    req.reply({
      statusCode: 200,
      body: { name: wfName, steps: [...steps] },
    });
  }).as('changeStepName');

  // Перехватываем POST /workflow/deleteStep
  cy.intercept('POST', '**/workflow/deleteStep', (req) => {
    const body = req.body as { stepInitialIndex: number };
    const idx = steps.findIndex(s => s.initialIndex === body.stepInitialIndex);
    if (idx !== -1) {
      steps.splice(idx, 1);
    }
    req.reply({
      statusCode: 200,
      body: { name: wfName, steps: [...steps] },
    });
  }).as('deleteStep');
});

// Добавляем тип для кастомной команды
declare global {
  namespace Cypress {
    interface Chainable {
      interceptWorkflowApi(mockData?: {
        workflowName?: string;
        steps?: Array<{
          initialIndex: number;
          name: string;
          x: number;
          y: number;
          color?: string;
          nextSteps: number[];
        }>;
      }): Chainable<void>;
    }
  }
}