
import { ref, type Ref } from 'vue';
import { workflowStore, type WorkflowStore } from '@shared/workflow/store/WorkflowStore';
import type { WorkflowStep } from '../../../root-config/src/shared/workflow/interfaces/WorkflowStep';
import { defineStore } from 'pinia';
import type { Subscription } from 'rxjs';

interface AppWorkflowStore {
  steps: Ref<WorkflowStep[]>;
  name: Ref<string>;
  selectedStep: Ref<number | null>;
  createStep: WorkflowStore['createStep'];
  changeStepName: WorkflowStore['changeStepName'];
  removeStep: WorkflowStore['removeStep'];
  selectStep: WorkflowStore['selectStep'];
  destroy: () => void;
}

/**
 * Pinia workflow store, синхронизированный с общий wrokflow store
 */
export const useWorkflowStore = defineStore<'workflow', AppWorkflowStore>('workflow', () => {
  const steps = ref<WorkflowStep[]>([]);
  const name = ref<string>('');
  const selectedStep = ref<number | null>(null);

  const createStep = workflowStore.createStep.bind(workflowStore);
  const changeStepName = workflowStore.changeStepName.bind(workflowStore);
  const removeStep = workflowStore.removeStep.bind(workflowStore);
  const selectStep = workflowStore.selectStep.bind(workflowStore);

  // Синхронизируем с общим стором (можно сделать в onMount главного компонента App.vue, но для явности всё расположено в объявлении стора)
  /** Подписки на изменения в общем workflow store */
  const subscriptions: Subscription[] = [];
  if (!subscriptions.length) {
    subscriptions.push(workflowStore.steps.subscribe(val => steps.value = val));
    subscriptions.push(workflowStore.name.subscribe(val => name.value = val));
    subscriptions.push(workflowStore.selectedStep.subscribe(val => selectedStep.value = val));
  }

  /** Функция для очистки подписок (можно сделать в onOnmount главного компонента App.vue) */
  const destroy = () => {
    subscriptions.forEach(subscription => { subscription.unsubscribe(); });
  };

  return {
    steps, name, selectedStep,
    createStep, changeStepName, removeStep, selectStep, destroy,
  };
});
