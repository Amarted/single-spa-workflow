/* eslint-disable @typescript-eslint/unbound-method */
// root-config/src/shared/workflow/store/WorkflowStore.spec.ts
import { vi, expect, it, describe, beforeEach } from 'vitest';
import { WorkflowStore } from './WorkflowStore';
import { workflowApiService } from '../api/WorkflowApiService';
import type { WorkflowStep } from '../interfaces/WorkflowStep';
import { ValidationError } from '../../errors/ValidationError';

// Мок апи сервиса
vi.mock('../api/WorkflowApiService', () => {
  const workflowApiService = {
    createStep: vi.fn(),
    changeStepName: vi.fn(),
    deleteStep: vi.fn(),
    getWorkflow: vi.fn(),
  };

  return { workflowApiService };
});

const initialSteps: WorkflowStep[] = [
  { initialIndex: 1, name: 'Step 1', x: 0, y: 0, color: '#fff', nextSteps: [] },
];

describe('WorkflowStore', () => {
  let store: WorkflowStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = new WorkflowStore(workflowApiService);
    store.setWorkflow({ name: 'Test', steps: [...initialSteps] });
  });

  // Тестируем создание/добавление шага
  describe('createStep', () => {
    it('не должен создавать шаг при дубликате имени (клиентская валидация)', async () => {
      const duplicateStep: WorkflowStep = { ...initialSteps[0], initialIndex: 99 };

      const result = await store.createStep('wf-name', duplicateStep);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('уже существует');
      }

      expect(workflowApiService.createStep).not.toHaveBeenCalled();
      expect(store.stepsStream.getValue().length).toBe(initialSteps.length);
    });

    it('откатывает изменения при ошибке сервера (ValidationError)', async () => {
      const newStep: WorkflowStep = {
        initialIndex: 2, name: 'New Step', x: 10, y: 20, color: '#000', nextSteps: []
      };

      vi.spyOn(workflowApiService, 'createStep').mockResolvedValue({
        ok: false,
        error: new ValidationError('Server validation error')
      });

      const initialLength = store.stepsStream.getValue().length;
      const result = await store.createStep('wf-name', newStep);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }

      expect(store.stepsStream.getValue().length).toBe(initialLength);
    });

    it('успешно создает шаг при отсутствии ошибок, и получает значение с сервера', async () => {
      const newStep: WorkflowStep = {
        initialIndex: 2, name: 'New Step', x: 10, y: 20, color: 'black', nextSteps: []
      };

      vi.spyOn(workflowApiService, 'createStep').mockResolvedValue({
        ok: true,
        value: { ...newStep, color: 'red' } // Допустим сервер изменил цвет
      });

      const result = await store.createStep('wf-name', newStep);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Ответ должен быть такой, как вернул сервер (x: 100)
        expect(result.value.color).toBe('red');
      }

      const steps = store.stepsStream.getValue();
      // Шаг добавился
      expect(steps.length).toBe(initialSteps.length + 1);
      // UI обновил оптимистичное клиентское значение ('black'), реальным значением с сервера ('red')
      expect(steps[1].color).toEqual('red');
    });
  });


  // Тестируем изменение имени шага
  describe('changeStepName', () => {
    it('не меняет имя, если шаг не найден', async () => {
      const result = await store.changeStepName(999, 'New Name');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Шаг не существует');
      }

      expect(workflowApiService.changeStepName).not.toHaveBeenCalled();
    });

    it('успешно сохраняет без изменений, если имя осталось тем же', async () => {
      const initialName = store.stepsStream.getValue()[0].name;

      const result = await store.changeStepName(1, initialName); // то же имя

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.steps[0].name).toBe(initialName);
      }

      expect(workflowApiService.changeStepName).not.toHaveBeenCalled();
    });

    it('не меняет имя, если оно дублируется у другого шага', async () => {
      // Сначала добавим второй шаг
      store.setWorkflow({
        name: 'Test',
        steps: [
          ...initialSteps,
          { initialIndex: 2, name: 'Step 2', x: 10, y: 10, color: '#000', nextSteps: [] }
        ]
      });

      // Теперь попробуем переименовать Step 1 в Step 2
      const result = await store.changeStepName(1, 'Step 2');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Название шага должно быть уникальным');
      }

      expect(workflowApiService.changeStepName).not.toHaveBeenCalled();
    });

    it('успешно меняет имя шага', async () => {
      vi.spyOn(workflowApiService, 'changeStepName').mockResolvedValue({
        ok: true,
        value: { name: 'Test', steps: [{ ...initialSteps[0], name: 'Updated' }] }
      });

      const result = await store.changeStepName(1, 'Updated');

      expect(result.ok).toBe(true);

      const steps = store.stepsStream.getValue();
      expect(steps[0].name).toBe('Updated');
    });

    it('откатывает изменение имени при ошибке сервера', async () => {
      vi.spyOn(workflowApiService, 'changeStepName').mockResolvedValue({
        ok: false,
        error: new ValidationError('Server error')
      });

      const initialName = store.stepsStream.getValue()[0].name;
      await store.changeStepName(1, 'New Name');

      // Проверяем откат
      expect(store.stepsStream.getValue()[0].name).toBe(initialName);
    });
  });

  // Удаление шага
  describe('removeStep', () => {
    it('не удаляет шаг, если не найден', async () => {
      const result = await store.removeStep('wf-name', 999);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Не найден шаг для удаления');
      }

      expect(workflowApiService.deleteStep).not.toHaveBeenCalled();
    });

    it('успешно удаляет шаг', async () => {
      vi.spyOn(workflowApiService, 'deleteStep').mockResolvedValue({
        ok: true,
        value: { name: 'Test', steps: [] }
      });

      const result = await store.removeStep('wf-name', 1);

      expect(result.ok).toBe(true);

      expect(store.stepsStream.getValue().length).toBe(0);
    });

    it('откатывает удаление при ошибке сервера', async () => {
      vi.spyOn(workflowApiService, 'deleteStep').mockResolvedValue({
        ok: false,
        error: new ValidationError('Server error')
      });

      const initialLength = store.stepsStream.getValue().length;
      await store.removeStep('wf-name', 1);

      expect(store.stepsStream.getValue().length).toBe(initialLength);
    });

  });

  it('откатывает изменения при системной ошибке (ApiError)', async () => {
    const newStep: WorkflowStep = {
      initialIndex: 2, name: 'New Step', x: 10, y: 20, color: '#000', nextSteps: []
    };

    vi.spyOn(workflowApiService, 'createStep').mockRejectedValue(new Error('Network error'));

    const initialLength = store.stepsStream.getValue().length;

    await expect(store.createStep('wf-name', newStep)).rejects.toThrow('Network error');

    expect(store.stepsStream.getValue().length).toBe(initialLength);
  });
});