import type { WorkflowStep } from './WorkflowStep';

/**
 * Рабочий процесс с описанием и списком шагов из которых он состоит
 */
export interface Workflow {
  /** Название рабочего процесса */
  name: string;
  /** Список шагов рабочего процесса */
  steps: WorkflowStep[];
}