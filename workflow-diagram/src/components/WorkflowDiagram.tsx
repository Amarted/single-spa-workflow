
import { useDispatch, useSelector } from 'react-redux';
import type { WorkflowStep } from '@shared/workflow/interfaces/WorkflowStep';
import { selectName, selectSelectedStep, selectSteps, setSelectedStep } from '../store/workflowSlice';
function randomSize(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function WorkflowDiagram() {

  // const steps = useSelector(selectSteps);
  const steps: WorkflowStep[] = [
    {
      initialIndex: 0,
      name: 'Step 0',
      nextSteps: [1],
      x: 0,
      y: 0,
      color: 'red'
    },
    {
      initialIndex: 1,
      name: 'Step 1',
      nextSteps: [2],
      x: 300,
      y: 0,
      color: 'red'
    },
    {
      initialIndex: 2,
      name: 'Step 2',
      nextSteps: [3],
      x: 1600,
      y: 200,
      color: 'red'
    },
    {
      initialIndex: 3,
      name: 'Step 12',
      nextSteps: [4],
      x: 300,
      y: 400,
      color: 'red'
    },
    {
      initialIndex: 4,
      name: 'Step 1',
      nextSteps: [5, 6],
      x: 110,
      y: 400,
      color: 'red'
    },
    {
      initialIndex: 5,
      name: 'Step 1',
      nextSteps: [],
      x: 110,
      y: 600,
      color: 'red'
    },
    {
      initialIndex: 6,
      name: 'Step 1',
      nextSteps: [],
      x: 110,
      y: 200,
      color: 'red'
    },

  ];
  const name = useSelector(selectName);
  const selectedStep = useSelector(selectSelectedStep);
  const dispatch = useDispatch();


  const handleStepClick = (step: WorkflowStep) => {
    dispatch(setSelectedStep(step.initialIndex));
  };
  // Размер шага (можно вынести в константу)
  const STEP_WIDTH = 160;
  const STEP_HEIGHT = 150;

  const connections = steps.flatMap(step => {
    return step.nextSteps.map(nextStepIndex => {
      const nextStep = steps.find(s => s.initialIndex === nextStepIndex);
      if (!nextStep) return null;

      // Из центра → в центр
      const x1 = step.x + STEP_WIDTH / 2;
      const y1 = step.y + STEP_HEIGHT / 2;
      const x2 = nextStep.x + STEP_WIDTH / 2;
      const y2 = nextStep.y + STEP_HEIGHT / 2;

      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);

      if (len === 0) return null;

      const halfWidth = STEP_WIDTH / 2;
      const halfHeight = STEP_HEIGHT / 2;

      const isHorizontal = Math.abs(dy) < 0.1;
      const isVertical = Math.abs(dx) < 0.1;

      if (isHorizontal) {
        // Горизонталь: останавливаемся на halfWidth от центра
        return { x1, y1, x2: x2 - Math.sign(dx) * halfWidth, y2, step, nextStep };
      }

      if (isVertical) {
        // Вертикаль: останавливаемся на halfHeight от центра
        return { x1, y1, x2, y2: y2 - Math.sign(dy) * halfHeight, step, nextStep };
      }

      // Диагональ: проекция на оси
      const ux = dx / len;
      const uy = dy / len;

      // Найдём, где линия пересечёт границы прямоугольника
      // 1. Пересечение с вертикальной границей (x = halfWidth)
      const tX = halfWidth / Math.abs(ux);
      // 2. Пересечение с горизонтальной границей (y = halfHeight)
      const tY = halfHeight / Math.abs(uy);

      // Выбираем наименьший t (ближайшая граница)
      const t = Math.min(tX, tY);

      // Координаты точки на границе
      const x2Adjusted = x2 - ux * t;
      const y2Adjusted = y2 - uy * t;

      return { x1, y1, x2: x2Adjusted, y2: y2Adjusted, step, nextStep };
    }).filter(Boolean);
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
        height={Math.max(...steps.map(s => s.y + STEP_HEIGHT), 300)}
        style={{ display: 'block' }}
      >
        {/* Defs для стрелки */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#ccc" />
          </marker>
        </defs>

        {/* Линии переходов */}
        {connections.map((conn, idx) => {
          if (!conn) return null;
          const isStepSelected = selectedStep === conn.step.initialIndex;
          const isNextSelected = selectedStep === conn.nextStep.initialIndex;
          const isSelected = isStepSelected || isNextSelected;

          return (
            <line
              key={idx}
              x1={conn.x1}
              y1={conn.y1}
              x2={conn.x2}
              y2={conn.y2}
              stroke={isSelected ? '#007bff' : '#ccc'}
              strokeWidth={2}
              strokeDasharray={isSelected ? 'none' : '4'}
              markerEnd="url(#arrowhead)"
            />
          );
        })}

        {steps.map(step => {
          const isSelected = selectedStep === step.initialIndex;

          return (
            <g
              key={step.initialIndex}
              onClick={() => { handleStepClick(step); }}
              style={{ cursor: 'pointer' }}
              transform={`translate(${step.x}, ${step.y})`}
            >
              {/* Прямоугольник шага */}
              <rect
                width={STEP_WIDTH}
                height={STEP_HEIGHT}
                fill={step.color === 'white' ? '#ffffff' : step.color}
                stroke={isSelected ? '#007bff' : '#ccc'}
                strokeWidth={isSelected ? 3 : 1}
                rx={6} // скругление углов
              />

              {/* Текст названия */}
              <text
                x={STEP_WIDTH / 2}
                y={STEP_HEIGHT / 2 + 4}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="14"
                fill="#000"
                pointerEvents="none" // чтобы клики проходили сквозь текст к прямоугольнику
              >
                {step.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}