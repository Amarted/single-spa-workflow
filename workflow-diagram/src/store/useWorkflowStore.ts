
import { useSelector } from 'react-redux';
import type { WorkflowStep } from '@shared/workflow/interfaces/WorkflowStep';
import { selectSteps, selectName, selectSelectedStep } from '../store/workflowSlice';
import { workflowStore } from '@shared/workflow/store/WorkflowStore';

interface AppWorkflowStore {
  steps: WorkflowStep[];
  name: string;
  selectedStep: number | null;
  createStep: typeof workflowStore.createStep;
  changeStepName: typeof workflowStore.changeStepName;
  removeStep: typeof workflowStore.removeStep;
  selectStep: typeof workflowStore.selectStep;
}

export function useWorkflowStore(): AppWorkflowStore {
  // Читаем данные из Redux (которые уже синхронизированы с общим workflowStore)
  const steps = useSelector(selectSteps);
  const name = useSelector(selectName);
  const selectedStep = useSelector(selectSelectedStep);

  return {
    steps,
    name,
    selectedStep,

    // Делегируем методы изменения состояния. Компонент не знает про общий workflowStore, он просто вызывает эти функции.
    createStep: workflowStore.createStep.bind(workflowStore),
    changeStepName: workflowStore.changeStepName.bind(workflowStore),
    removeStep: workflowStore.removeStep.bind(workflowStore),
    selectStep: workflowStore.selectStep.bind(workflowStore),
  };
}
