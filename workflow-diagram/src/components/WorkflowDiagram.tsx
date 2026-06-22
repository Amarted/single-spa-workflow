
import { useDispatch, useSelector } from 'react-redux';
import type { WorkflowStep } from '@shared/workflow/interfaces/WorkflowStep';
import { selectName, selectSelectedStep, selectSteps, setSelectedStep } from '../store/workflowSlice';

interface DiagramWorflowStep extends WorkflowStep {
  width: number;
  height: number;
}
function randomSize(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function WorkflowDiagram() {

  // const steps = useSelector(selectSteps);
  const steps: DiagramWorflowStep[] = [
    {
      initialIndex: 0,
      name: 'Step 0',
      nextSteps: [1],
      x: 0,
      y: 0,
      color: 'red',
      height: randomSize(50, 100),
      width: randomSize(100, 200),
    },
    {
      initialIndex: 1,
      name: 'Step 1',
      nextSteps: [2],
      x: 300,
      y: 0,
      color: 'red',
      height: randomSize(50, 100),
      width: randomSize(100, 200),
    },
    {
      initialIndex: 2,
      name: 'Step 2',
      nextSteps: [3],
      x: 1600,
      y: 200,
      color: 'red',
      height: randomSize(50, 100),
      width: randomSize(100, 200),
    },
    {
      initialIndex: 3,
      name: 'Step 12',
      nextSteps: [4],
      x: 300,
      y: 400,
      color: 'red',
      height: randomSize(50, 100),
      width: randomSize(100, 200),
    },
    {
      initialIndex: 4,
      name: 'Step 1',
      nextSteps: [5, 6],
      x: 110,
      y: 400,
      color: 'red',
      height: randomSize(50, 100),
      width: randomSize(100, 200),
    },
    {
      initialIndex: 5,
      name: 'Step 1',
      nextSteps: [],
      x: 110,
      y: 600,
      color: 'red',
      height: randomSize(50, 100),
      width: randomSize(100, 200),
    },
    {
      initialIndex: 6,
      name: 'Step 1',
      nextSteps: [],
      x: 110,
      y: 200,
      color: 'red',
      height: randomSize(50, 100),
      width: randomSize(100, 200),
    },

  ];
  const name = useSelector(selectName);
  const selectedStep = useSelector(selectSelectedStep);
  const dispatch = useDispatch();

  const handleStepClick = (step: WorkflowStep) => {
    dispatch(setSelectedStep(step.initialIndex));
  };

  const connections = steps.flatMap(step => {
    return step.nextSteps.map(nextStepIndex => {
      const nextStep = steps.find(s => s.initialIndex === nextStepIndex);
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
      const len = Math.sqrt(dx * dx + dy * dy); // Длина отрезка, (гипотенуза по теореме Пифагора)

      if (len === 0) {
        return null;
      }

      const halfWidth = nextStep.width / 2;
      const halfHeight = nextStep.height / 2;

      // Определяем идёт ли линия чисто (с небольшой погрещностью) по вертикали или горизонтали
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
  });

  return (
    <div>
      <h1>Workflow Diagram: {name}</h1>
      <ul>
        {steps.map(step => (
          <li
            key={step.initialIndex}
            onClick={() => { handleStepClick(step); }}
            style={{
              backgroundColor: selectedStep === step.initialIndex ? 'lightblue' : 'transparent',
              cursor: 'pointer',
            }}
          >
            {step.name}
          </li>
        ))}
      </ul>
      {/* SVG-контейнер под диаграмму */}
      <svg
        width="100%"
        height={Math.max(...steps.map(step => step.y + step.width), 300)}
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
        {steps.map(step => {
          // const isSelected = selectedStep === step.initialIndex;
          const isSelected = true;
          const markerSize = 8;
          const selectedBorderGap = 6; // Отступ рамки выделения от самого блока

          // Вспомогательная функция, чтобы не дублировать логику center - halfSize
          const getMarkerRectCoords = (centerX: number, centerY: number) => ({
            x: centerX - markerSize / 2,
            y: centerY - markerSize / 2,
          });

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
                fill={step.color}
                rx="var(--radius)" // скругление углов
              />

              {/* Текст названия */}
              <text
                x={step.width / 2}
                y={step.height / 2 + 4}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="var(--font-size-primary)"
                fill="var(--text-primary)"
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