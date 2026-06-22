import type { WorkflowStep } from '@shared/workflow/interfaces/WorkflowStep';

/**
 * Шаг на диаграмме
 */
export interface DiagramWorflowStep extends WorkflowStep {
  /** Ширина блока шага */
  width: number;
  /** Высота блока шага */
  height: number;
}
