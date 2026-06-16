
/**
 * Cвязь между шагами рабочего процесса
 */
export interface WorkflowStepTransition {
  source: WorkflowStep;
  destination: WorkflowStep;
}

/**
 * Шаг/состояние рабочего процесса
 */
export interface WorkflowStep {
  id: string;
  /** Название шага/состояния */
  name: string;
  /** Цвет шага */
  color: string;
  /** Координата х шага на диаграмме */
  x: number;
  /** Координата y шага на диаграмме */
  y: number;
  /** Связи между шагами */
  transitions: WorkflowStepTransition[];
}