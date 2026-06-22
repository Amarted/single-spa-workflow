// support/component.ts — настройки для Component-тестов React
import { mount } from '@cypress/react';

// Регистрируем mount как кастомную команду Cypress
Cypress.Commands.add('mount', mount);

// Подавляем необработанные исключения
Cypress.on('uncaught:exception', () => false);

// Добавляем тип для mount
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Mount a React component for component testing.
       */
      mount: typeof mount;
    }
  }
}