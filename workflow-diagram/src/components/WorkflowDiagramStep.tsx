

import { useMemo, type MouseEvent } from 'react';
import type { DiagramWorflowStep } from '../interfaces/DiagramWorflowStep';

const fontSize = 20;
const resizeMarkerSize = 8;
const selectedBorderGap = 6;

interface WorkflowDiagramStepProps {
  step: DiagramWorflowStep;
  isSelected: boolean;
  onClick: (step: DiagramWorflowStep) => void;
}

export function WorkflowDiagramStep({ step, isSelected, onClick }: WorkflowDiagramStepProps) {
  /** Маркеры для рамки ресайза. */
  const resizeMarkers = useMemo(() => {
    const markers = [
      // Углы
      { name: 'top-left', x: -selectedBorderGap, y: -selectedBorderGap },
      { name: 'top-right', x: step.width + selectedBorderGap, y: -selectedBorderGap },
      { name: 'bottom-right', x: step.width + selectedBorderGap, y: step.height + selectedBorderGap },
      { name: 'bottom-left', x: -selectedBorderGap, y: step.height + selectedBorderGap },
      // Стороны
      { name: 'top', x: step.width / 2, y: -selectedBorderGap },
      { name: 'right', x: step.width + selectedBorderGap, y: step.height / 2 },
      { name: 'bottom', x: step.width / 2, y: step.height + selectedBorderGap },
      { name: 'left', x: -selectedBorderGap, y: step.height / 2 },
    ];

    // Добавляем смещение для отрисовки квадрата маркера (чтобы он был по центру точки)
    return markers.map(m => ({
      ...m,
      rectX: m.x - resizeMarkerSize / 2,
      rectY: m.y - resizeMarkerSize / 2,
    }));
  }, [step.width, step.height]);

  /** Обработчик клика по шагу */
  const handleClick = (e: MouseEvent<SVGGElement>) => {
    e.stopPropagation();
    onClick(step);
  };

  // Определяем цвета
  const fillColor = isSelected ? '#a02c2c' : (step.color === 'white' ? '#f5f5f5' : 'white');
  const strokeColor = isSelected ? '#a02c2c' : step.color;
  const textColor = isSelected ? 'white' : strokeColor;

  return (
    <g
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
      // Трансформация применяется здесь, чтобы координаты внутри группы были относительно (0,0) шага
      transform={`translate(${step.x.toString()}, ${step.y.toString()})`}
    >
      {/* Прямоугольник шага */}
      <rect
        width={step.width}
        height={step.height}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={2}
        rx="var(--radius)"
        style={{ transition: 'all 0.2s ease' }}
      />

      {/* Текст названия */}
      <text
        x={step.width / 2}
        y={step.height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        fontWeight="500"
        fill={textColor}
        pointerEvents="none" // Пропускаем клики сквозь текст
        style={{ userSelect: 'none' }}
      >
        {step.name}
      </text>

      {/* Рамка выделения и маркеры (рендерим только если выбрано) */}
      {isSelected && (
        <g className="resize-frame" pointerEvents="all">
          {/* Сама рамка вокруг блока */}
          <rect
            x={-selectedBorderGap}
            y={-selectedBorderGap}
            width={step.width + selectedBorderGap * 2}
            height={step.height + selectedBorderGap * 2}
            fill="none"
            stroke="#4d4d4d"
            strokeWidth={1}
            style={{ strokeDasharray: '5,5' }} // Пунктирная линия для красоты
          />

          {/* Маркеры ресайза */}
          {resizeMarkers.map((m) => (
            <rect
              key={m.name}
              x={m.rectX}
              y={m.rectY}
              width={resizeMarkerSize}
              height={resizeMarkerSize}
              fill="#4d4d4d"
              className="resize-marker"
              style={{
                cursor: getResizeCursor(m.name),
                opacity: 0.8,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
            />
          ))}
        </g>
      )}
    </g>
  );
}

// Вспомогательная функция для курсора (можно вынести глобально, если нужно)
function getResizeCursor(name: string): string {
  switch (name) {
    case 'top-left': return 'nwse-resize';
    case 'top-right': return 'nesw-resize';
    case 'bottom-right': return 'nwse-resize';
    case 'bottom-left': return 'nesw-resize';
    case 'top': return 'ns-resize';
    case 'right': return 'ew-resize';
    case 'bottom': return 'ns-resize';
    case 'left': return 'ew-resize';
    default: return 'pointer';
  }
}
