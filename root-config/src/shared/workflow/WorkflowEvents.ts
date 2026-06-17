/**
 * Описание событий приложения для взаимодействия между компонентами
 */
import type { WorkflowStep } from './interfaces/WorkflowStep';

/** Событие удаления шага */
export type WorkflowStepDeletedEvent = CustomEvent<{ index: number }>;
/** Событие добавления шага */
export type WorkflowStepCreatedEvent = CustomEvent<{ step: WorkflowStep }>;
/** Событие обновления шага */
export type WorkflowStepNameChangedEvent = CustomEvent<{ index: number, name: string }>;
/** Событие выбора шага */
export type WorkflowStepSelectedEvent = CustomEvent<{ index: number }>;

export type AppEventMap = {
  'wf-step-deleted': CustomEvent<{ index: number }>;
  'wf-step-created': CustomEvent<{ step: WorkflowStep }>;
  'wf-step-name-changed': CustomEvent<{ index: number; name: string }>;
  'wf-step-selected': CustomEvent<{ index: number }>;
};