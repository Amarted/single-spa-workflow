import type { WorkflowStep } from '@shared/workflow/interfaces/WorkflowStep';
import { useMemo, } from 'react';
import { useWorkflowStore } from '../store/useWorkflowStore';

interface DiagramWorflowStep extends WorkflowStep {
  width: number;
  height: number;
}

const fontSize = 20;
const resizeMarkerSize = 8; // Размер маркера ресайза (квадрат)
const selectedBorderGap = 6; // Отступ рамки выделения от самого блока

export function WorkflowDiagram() {
  const { steps, selectedStep, selectStep } = useWorkflowStore();

  // Превратим шаги, в шаги для диаграммы. Рассичтаем ширину по длинне текста и установим высоту
  const diagramSteps = useMemo<DiagramWorflowStep[]>(() => {
    const averageCharWidth = fontSize * 0.5;
    const padding = fontSize * 1.5;
    const minWidth = averageCharWidth * 6; // Минимальная длинна в 6 символов, чтобы не было сильно узких блоков

    return steps.map(step => ({
      ...step,
      width: Math.max(minWidth, step.name.length * averageCharWidth + padding * 2),
      height: 55
    }));
  }, [steps]);
  /** @todo Вынести рассчёты в отдельную функцию */
  const connections = useMemo(() => diagramSteps.flatMap(step => {
    return step.nextSteps.map(nextStepIndex => {
      const nextStep = diagramSteps.find(existingStep => existingStep.initialIndex === nextStepIndex);
      if (!nextStep) {
        return null;
      }

      // Сначала рассчитываем координаты для линии из центра в центр
      const x1 = step.x + step.width / 2; // Источник
      const y1 = step.y + step.height / 2;
      const x2 = nextStep.x + nextStep.width / 2; // Назначение
      const y2 = nextStep.y + nextStep.height / 2;

      const dx = x2 - x1; // Направление по x, оно же первый катет
      const dy = y2 - y1; // Направление по y, оно же второй катет
      const len = Math.sqrt(dx * dx + dy * dy); // Длина отрезка (гипотенуза по теореме Пифагора)

      if (len === 0) {
        return null;
      }

      const halfWidth = nextStep.width / 2;
      const halfHeight = nextStep.height / 2;

      // Определяем идёт ли линия строго (с небольшой погрешностью) по вертикали или горизонтали
      const threshold = 0.1;
      const isHorizontal = Math.abs(dy) < threshold * len;
      const isVertical = Math.abs(dx) < threshold * len;

      if (isHorizontal) {
        // Горизонталь: останавливаемся на пол длинны от центра по оси x (чтобы стрелка касалась края прямоугольника)
        return {
          x1, y1,
          x2: x2 - Math.sign(dx) * halfWidth, y2,
          step, nextStep,
        };
      }

      if (isVertical) {
        // Вертикаль: останавливаемся на половину высоты от центра по оси y (аналогично, чтобы стрелка касалась края)
        return { x1, y1, x2, y2: y2 - Math.sign(dy) * halfHeight, step, nextStep };
      }

      // Диагональ: проекция на оси
      const ux = dx / len;
      const uy = dy / len;
      // Найдём, где линия пересечёт границы прямоугольника
      // Пересечение с вертикальной границей (x = halfWidth)
      const tX = halfWidth / Math.abs(ux);
      // Пересечение с горизонтальной границей (y = halfHeight)
      const tY = halfHeight / Math.abs(uy);
      // Выбираем наименьший t (ближайшая граница)
      const t = Math.min(tX, tY); // Пройденное растояние по проекции

      // Коректируем обе координаты, чтобы стрелка касалась края
      const x2Adjusted = x2 - ux * t;
      const y2Adjusted = y2 - uy * t;

      return {
        x1, y1,
        x2: x2Adjusted, y2: y2Adjusted,
        step, nextStep,
      };
    })
      .filter(Boolean);
  }), [diagramSteps]);



  // Добавим отступы, чтобы не перекрывать рамку выделения, когда блок у края. Используем viewbox для этого
  const viewBox = useMemo(() => {
    const diagramPadding = 20;
    const minX = Math.min(...diagramSteps.map(step => step.x));
    const minY = Math.min(...diagramSteps.map(step => step.y));
    const maxX = Math.max(...diagramSteps.map(step => step.x + step.width));
    const maxY = Math.max(...diagramSteps.map(step => step.y + step.height));

    return `${(minX - diagramPadding).toString()} ${(minY - diagramPadding).toString()} ${(maxX - minX + diagramPadding * 2).toString()} ${(maxY - minY + diagramPadding * 2).toString()}`;
  }, [diagramSteps]);


  if (steps.length === 0) {
    return <div>Загрузка...</div>;
    // или <div>Нет шагов для отображения</div>;
  }

  /** Обработчик клика по блоку шага (делаем выбор шага) */
  const handleStepClick = (step: WorkflowStep) => {
    selectStep(step.initialIndex);
  };

  /** 
   * Вспомогательная функция, чтобы не дублировать логику center - halfSize 
   * @param centerX - X-координата центра маркера
   * @param centerY - Y-координата центра маркера
   */
  const getMarkerRectCoords = (centerX: number, centerY: number) => ({
    x: centerX - resizeMarkerSize / 2,
    y: centerY - resizeMarkerSize / 2,
  });


  return (
    <div>
      {/* SVG-контейнер под диаграмму */}
      <svg
        width="100%"
        height={Math.max(...diagramSteps.map(step => step.y + step.width), 300)}
        viewBox={viewBox}
        style={{ display: 'block' }}
      >
        <defs>
          {/* Маркер для стрелки */}
          <marker
            id="arrowhead"
            markerWidth="13"
            markerHeight="13"
            refX="13"
            refY="6.5"
            orient="auto"
          >
            <polygon points="0 0, 13 6.5, 0 13" fill="black" />
          </marker>
        </defs>

        {/* Линии переходов (соединение шага со следующими шагами) */}
        {connections.map((connection, idx) => {
          if (!connection) {
            return null;
          }

          return (
            <line
              key={idx}
              x1={connection.x1}
              y1={connection.y1}
              x2={connection.x2}
              y2={connection.y2}
              stroke="black"
              strokeWidth={1}
              markerEnd="url(#arrowhead)"
            />
          );
        })}

        {/* Рисуем шаги */}
        {diagramSteps.map(step => {
          /** @todo Вынести шаг в отдельный компонент */
          const isSelected = selectedStep === step.initialIndex;

          const resizeMarkers = [
            // Углы (по углам рамки выделения)
            { name: 'top-left', ...getMarkerRectCoords(-selectedBorderGap, -selectedBorderGap) },
            { name: 'top-right', ...getMarkerRectCoords(step.width + selectedBorderGap, -selectedBorderGap) },
            { name: 'bottom-right', ...getMarkerRectCoords(step.width + selectedBorderGap, step.height + selectedBorderGap) },
            { name: 'bottom-left', ...getMarkerRectCoords(-selectedBorderGap, step.height + selectedBorderGap) },

            // Стороны (по центру сторон рамки выделения)
            { name: 'top', ...getMarkerRectCoords(step.width / 2, -selectedBorderGap) },
            { name: 'right', ...getMarkerRectCoords(step.width + selectedBorderGap, step.height / 2) },
            { name: 'bottom', ...getMarkerRectCoords(step.width / 2, step.height + selectedBorderGap) },
            { name: 'left', ...getMarkerRectCoords(-selectedBorderGap, step.height / 2) },
          ];

          return (
            <g
              key={step.initialIndex}
              onClick={() => { handleStepClick(step); }}
              style={{ cursor: 'pointer' }}
              transform={`translate(${step.x.toString()}, ${step.y.toString()})`}
            >
              {/* Прямоугольник шага*/}
              <rect
                width={step.width}
                height={step.height}
                fill={isSelected ? '#a02c2c' : step.color === 'white' ? '#f5f5f5' : 'white'} // Для белого цвета сделаем фон чуть темнее, тчобы читался
                stroke={isSelected ? '#a02c2c' : step.color}
                strokeWidth={2}
                rx="var(--radius)" // скругление углов
              />

              {/* Текст названия */}
              <text
                x={step.width / 2}
                y={step.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontSize}
                fontWeight="500"
                fill={isSelected ? 'white' : step.color}
                pointerEvents="none" // чтобы клики проходили сквозь текст к прямоугольнику
              >
                {step.name}
              </text>

              {isSelected && (
                <g className="resize-frame">
                  <rect
                    x={-selectedBorderGap}
                    y={-selectedBorderGap}
                    width={step.width + selectedBorderGap * 2}
                    height={step.height + selectedBorderGap * 2}
                    fill="none"
                    stroke="#4d4d4d"
                    strokeWidth={1}
                  />
                  {resizeMarkers.map((m) => (
                    <rect
                      key={m.name}
                      x={m.x}
                      y={m.y}
                      fill="#4d4d4d"
                      width={8}
                      height={8}
                      className="resize-marker"
                      style={{ cursor: 'pointer' }} // Задать иконку ресайза нужного направления в парметрах каждого маркера (ew-resize, e-resize, и т.д.)
                    />
                  ))}
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}