import type { WorkflowStep } from '@shared/workflow/interfaces/WorkflowStep';
import type { DiagramWorflowStep } from '../interfaces/DiagramWorflowStep';

/**
 * Рассчёт размеров блока, на основе его содержимого, добавляет параметры к шагу
 * @param step Исходный шаг
 * @param fontSize Размер шрифта на диаграмме
 * @returns шаг с расширенными данными для диаграммы (длинна, высота)
 */
export const createStepForDiagram = (step: WorkflowStep, fontSize: number): DiagramWorflowStep => {
  // Рассичтаем ширину по длинне текста и установим высоту
  const averageCharWidth = fontSize * 0.55;
  const padding = fontSize * 1.5;
  const minWidth = averageCharWidth * 6;
  const calculatedWidth = step.name.length * averageCharWidth + padding * 2;

  return {
    ...step,
    width: Math.max(minWidth, calculatedWidth),
    height: 55,
  };
};