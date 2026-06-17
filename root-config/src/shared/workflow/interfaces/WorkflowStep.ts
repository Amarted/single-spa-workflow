/**
 * Шаг рабочего процесса
 */
export interface WorkflowStep {
  /** Порядковый номер, уникальный идентификатор шага в рамках процесса */
  initialIndex: number;
  /** Название шага */
  name: string;
  /** Цвет шага */
  color?: string;
  /** Координата х шага на диаграмме */
  x: number;
  /** Координата y шага на диаграмме */
  y: number;
  /** Связи между шагами (список initialIndex) */
  nextSteps: number[];
}