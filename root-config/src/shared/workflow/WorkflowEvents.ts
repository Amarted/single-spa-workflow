/**
 * Описание событий приложения для взаимодействия между компонентами
 */
import type { WorkflowStep } from './interfaces/WorkflowStep';

/** Событие удаления шага */
export type WorkflowStepDeletedEvent = CustomEvent<{ wokflowName: string; index: number }>;
/** Событие добавления шага */
export type WorkflowStepCreatedEvent = CustomEvent<{ wokflowName: string; step: WorkflowStep }>;
/** Событие обновления шага */
export type WorkflowStepNameChangedEvent = CustomEvent<{ index: number, name: string }>;
/** Событие выбора шага */
export type WorkflowStepSelectedEvent = CustomEvent<{ index: number }>;

export type AppEventMap = {
  'wf-step-deleted': WorkflowStepDeletedEvent;
  'wf-step-created': WorkflowStepCreatedEvent;
  'wf-step-name-changed': WorkflowStepNameChangedEvent;
  'wf-step-selected': WorkflowStepSelectedEvent;
};