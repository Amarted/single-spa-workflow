
import { computed, readonly, ref, type DeepReadonly, type Ref } from 'vue';
import { useObservable } from './useObservable';
import { workflowStore, type WorkflowStore } from '@shared/workflow/store/WorkflowStore';
import type { WorkflowStep } from '../../../root-config/src/shared/workflow/interfaces/WorkflowStep';
import { defineStore } from 'pinia';
import type { Subscription } from 'rxjs';

interface AppWorkflowStore {
  steps: Ref<WorkflowStep[]>;
  name: Ref<string>;
  createStep: WorkflowStore['createStep'];
  changeStepName: WorkflowStore['changeStepName'];
  removeStep: WorkflowStore['removeStep'];
  destroy: () => void;
}

/**
 * Pinia workflow store, синхронизированный с общий wrokflow store
 */
export const useWorkflowStore = defineStore<'workflow', AppWorkflowStore>('workflow', () => {
  const steps = ref<WorkflowStep[]>([]);
  const name = ref<string>('');

  const createStep = workflowStore.createStep.bind(workflowStore);
  const changeStepName = workflowStore.changeStepName.bind(workflowStore);
  const removeStep = workflowStore.removeStep.bind(workflowStore);

  /** Подписки на изменения в общем workflow store */
  const subscriptions: Subscription[] = [];
  if (!subscriptions.length) {
    subscriptions.push(workflowStore.steps.subscribe(val => steps.value = val));
    subscriptions.push(workflowStore.name.subscribe(val => name.value = val));
  }

  /** Функция для очистки подписок */
  const destroy = () => {
    subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  return { steps, name, createStep, changeStepName, removeStep, destroy };
})

/**
 * Пример реализации с помощью composable, если мы не хотим тащить store библиотеки (для минимизации бандла)
 * Только для демонстрации, не используется в приложении
 * Использует главный workflow store, для работы с состоянием рабочего процесса
 * @return состояние в виде реактивных свойст (Ref) и методы для его изменения
 */ /* @ts-ignore */
function useWorkflowStoreWithutPinia(): AppWorkflowStore {
  return {
    // Состояние (state)
    steps: useObservable(workflowStore.steps, []), // Можем использовать readonly() чтобы запретить менять состояние напрямую
    name: useObservable(workflowStore.name, ''),
    // Действия (аctions). Просто используем методы общего стора. Можно обернуть в функцию и добавить свою логику, если нужно.
    createStep: workflowStore.createStep.bind(workflowStore), // Важно сделать bind, иначе методы не будут видеть внутренних свойств workflowStore, а будут искать их в этом объекте
    changeStepName: workflowStore.changeStepName.bind(workflowStore),
    removeStep: workflowStore.removeStep.bind(workflowStore),
    destroy: () => { /* сейчас все отписки происходят автоматически, благодара useObservable */ }
  };
}