import type { DiagramWorflowStep } from '../interfaces/DiagramWorflowStep';

export interface StepConnectionLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  sourceStep: DiagramWorflowStep;
  targetStep: DiagramWorflowStep;
}

/**
 * Рассчитывает координаты линий соединения между шагами.
 * @param steps - массив шагов
 * @returns массив линий соединения
 */
export function createStepConnections(steps: DiagramWorflowStep[]): StepConnectionLine[] {
  return steps.flatMap((step) => {
    return step.nextSteps.map((nextStepIndex) => {
      const nextStep = steps.find((s) => s.initialIndex === nextStepIndex);

      // Если целевого шага нет (битая ссылка), пропускаем
      if (!nextStep) return null;

      // Центры блоков
      const x1 = step.x + step.width / 2;
      const y1 = step.y + step.height / 2;
      const x2 = nextStep.x + nextStep.width / 2;
      const y2 = nextStep.y + nextStep.height / 2;

      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);

      if (len === 0) return null;

      const halfWidth = nextStep.width / 2;
      const halfHeight = nextStep.height / 2;
      const threshold = 0.1; // Погрешность для определения "почти прямой" линии

      let x2Final = x2;
      let y2Final = y2;

      const isHorizontal = Math.abs(dy) < threshold * len;
      const isVertical = Math.abs(dx) < threshold * len;

      if (isHorizontal) {
        // Горизонталь: линия останавливается у края прямоугольника по X
        x2Final = x2 - Math.sign(dx) * halfWidth;
      } else if (isVertical) {
        // Вертикаль: линия останавливается у края по Y
        y2Final = y2 - Math.sign(dy) * halfHeight;
      } else {
        // Диагональ: находим точку пересечения линии с границей прямоугольника
        const ux = dx / len;
        const uy = dy / len;

        // Расстояние до пересечения с вертикальной и горизонтальной границами
        const tX = halfWidth / Math.abs(ux);
        const tY = halfHeight / Math.abs(uy);

        // Берем минимальное расстояние (ближайшая граница)
        const t = Math.min(tX, tY);

        x2Final = x2 - ux * t;
        y2Final = y2 - uy * t;
      }

      return {
        x1,
        y1,
        x2: x2Final,
        y2: y2Final,
        sourceStep: step,
        targetStep: nextStep,
      };
    });
  }).filter((line): line is StepConnectionLine => line !== null);
}
