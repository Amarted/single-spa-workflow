import { mount } from '@cypress/vue';

// Регистрируем mount как кастомную команду Cypress
Cypress.Commands.add('mount', mount);

// Подавляем необработанные исключения
Cypress.on('uncaught:exception', () => false);

// Добавляем тип для mount
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}