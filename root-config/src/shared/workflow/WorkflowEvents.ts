/**
 * Описание событий приложения для взаимодействия между компонентами
 */
import type { WorkflowStep } from './interfaces/WorkflowStep';

/** Событие удаления шага */
export type WorkflowStepDeletedEvent = CustomEvent<{ id: string }>;
/** Событие добавления шага */
export type WorkflowStepAddedEvent = CustomEvent<{ step: WorkflowStep }>;
/** Событие обновления шага */
export type WorkflowStepUpdatedEvent = CustomEvent<{ step: WorkflowStep }>;
/** Событие выбора шага */
export type WorkflowStepSelectedEvent = CustomEvent<{ id: string }>;

// Расширяем глобальный мап событий браузера, для описания и автокомплита для возможных событий
declare global {
  interface WindowEventMap {
    'wf-step-deleted': WorkflowStepDeletedEvent;
    'wf-step-added': WorkflowStepAddedEvent;
    'wf-step-updated': WorkflowStepUpdatedEvent;
    'wf-select-step': WorkflowStepSelectedEvent;
  }
}