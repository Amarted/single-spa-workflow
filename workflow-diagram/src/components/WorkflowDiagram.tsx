
import { useMemo, } from 'react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import type { WorkflowStep } from '@shared/workflow/interfaces/WorkflowStep';
import type { DiagramWorflowStep } from '../interfaces/DiagramWorflowStep';
import { createStepForDiagram } from '../services/createStepForDiagram';
import { WorkflowDiagramStep } from './WorkflowDiagramStep';
import { createStepConnections } from '../services/createStepConnections';

export function WorkflowDiagram() {
  const { steps, selectedStep, selectStep } = useWorkflowStore();
  /** Шаги (блоки) для диаграммы. */
  const diagramSteps = useMemo<DiagramWorflowStep[]>(() => {
    return steps.map(step => createStepForDiagram(step, 20));
  }, [steps]);

  /** Линии (стрелки) соединяющие шаги*/
  const connections = useMemo(() => createStepConnections(diagramSteps), [diagramSteps]);

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
    return <div>Нет шагов для отображения</div>;
  }

  /** Обработчик клика по блоку шага (делаем выбор шага) */
  const handleStepClick = (step: WorkflowStep) => {
    selectStep(step.initialIndex);
  };

  return (
    <div>
      <svg
        width="100%"
        height={Math.max(...diagramSteps.map(step => step.y + step.height), 300)}
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
          const isSelected = selectedStep === step.initialIndex;

          return (
            <WorkflowDiagramStep
              key={step.initialIndex}
              step={step}
              isSelected={isSelected}
              onClick={handleStepClick}
            />
          );
        })}
      </svg>
    </div>
  );
}