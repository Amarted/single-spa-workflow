import { BehaviorSubject } from 'rxjs';
import { type WorkflowStep } from '../interfaces/WorkflowStep';
import { workflowApiService, type WorkflowApiService } from '../api/WorkflowApiService';
import { ValidationError } from '../../errors/ValidationError';
import type { Workflow } from '../interfaces/Workflow';
import type { Result } from '../../Result';

/** Данные для создания без index. Он генерируется автоматически */
type WorkflowStepCreationData = Omit<WorkflowStep, 'initialIndex'>;

/**
 * Сервис для управления состоянием рабочего процесса
 * 
 * - Валидирует изменение состояния, чтобы инварианты были соблюдены
 * - Синхронизирует состояние UI с серверным состоянием
 * - Использует оптимистичное обновление UI
 */
export class WorkflowStore {
  /** Имя процесса для изменения */
  private readonly nameStream = new BehaviorSubject<string>("");
  /** Имя процесса для чтения (можем только подписаться на изменения, но не менять) */
  public readonly name = this.nameStream.asObservable();

  /** Cписок шагов для изменения */
  public readonly stepsStream = new BehaviorSubject<WorkflowStep[]>([]);
  /** Список шагов для чтения */
  public readonly steps = this.stepsStream.asObservable();

  public constructor(
    private readonly workflowApi: WorkflowApiService,
  ) { }

  /** 
   * Установить новый процесс 
   * @param workflow Новый процесс
   */
  public setWorkflow(workflow: Workflow): void {
    // Устанавливаем поля процесса отдельно, для возможности реагировать на изменения каждого поля по отдельности
    this.nameStream.next(workflow.name);
    this.stepsStream.next(workflow.steps);
  }

  /**
  * Создание нового шага
  * @param workflowName Имя рабочего процесса, в котором создаётся новый шаг
  * @param newStepData Новый шаг
  * @returns Результат с обновлённым процессом или ошибкой валидации
  */
  public async createStep(workflowName: string, newStepData: WorkflowStepCreationData): Promise<Result<WorkflowStep, ValidationError>> {
    const steps = this.stepsStream.getValue();

    // Имя должно быть уникально
    const nameIsNotUnique = steps.some(step => step.name === newStepData.name);
    if (nameIsNotUnique) {
      return {
        ok: false,
        error: new ValidationError(`Шаг с названием ${newStepData.name} уже существует`),
      };
    }

    // Индекс должен быть уникальным в пределах процесса. Берём максимальное значение и увеличиваем его
    const newIndex = Math.max(...steps.map(step => step.initialIndex)) + 1;
    const newStep: WorkflowStep = { ...newStepData, initialIndex: newIndex };
    // Оптимистичное обновление состояния. Сохраняем старое, для отката в случае ошибки синхронизации с сервером
    const oldSteps = [...steps];
    return this.withOptimisticUpdate({
      optimisticUpdate: () => this.stepsStream.next([...steps, newStep]),
      rollback: () => this.stepsStream.next(oldSteps),
      action: () => this.workflowApi.createStep({
        wfName: workflowName,
        stepName: newStepData.name,
        x: newStepData.x,
        y: newStepData.y,
        color: newStepData.color,
        nextSteps: newStepData.nextSteps,
      }),
      realUpdate: (realValue) => this.stepsStream.next([...oldSteps, realValue]),
    });
  }

  /**
   * Изменение названия шага
   * 
   * Название шага должно быть уникальным
   * @param stepIndex Индекс шага
   * @param newName Новое название
   * @returns Результат с обновлённым процессом или ошибкой валидации
   */
  public async changeStepName(stepIndex: number, newName: string): Promise<Result<Workflow, ValidationError>> {
    const steps = this.stepsStream.getValue();

    // Шаг должен существовать
    const existingStep = steps.find(step => step.initialIndex === stepIndex);
    if (!existingStep) {
      return {
        ok: false,
        error: new ValidationError('Шаг не существует'),
      };
    }
    // Имя шага должно быть уникальным
    const nameIsNotUnique = steps.some(step => step.name === newName && step.initialIndex !== existingStep.initialIndex);
    if (nameIsNotUnique) {
      return {
        ok: false,
        error: new ValidationError('Название шага должно быть уникальным'),
      };
    }
    // Имя не изменилось, вернём текущие данные без обновлениея, и не дёргая сервер лишний раз
    if (existingStep.name === newName) {
      return {
        ok: true,
        value: {
          name: this.nameStream.getValue(),
          steps: this.stepsStream.getValue(),
        },
      };
    }

    // Оптимистичное обновление состояния.
    const updatedStep = { ...existingStep, name: newName };
    const oldSteps = [...steps];
    return this.withOptimisticUpdate({
      optimisticUpdate: () => this.stepsStream.next(
        steps.map(step => step.initialIndex === updatedStep.initialIndex ? updatedStep : step)
      ),
      rollback: () => this.stepsStream.next(oldSteps),
      action: () => this.workflowApi.changeStepName({
        stepInitialIndex: updatedStep.initialIndex,
        stepName: updatedStep.name,
      }),
      realUpdate: (realValue) => this.stepsStream.next(realValue.steps),
    });
  }

  /**
   * Удаление шага из рабочего процесса
   * @param workflowName Название процесса, в котором нужно удалить шаг
   * @param index Индекс шага для удаления
   */
  public async removeStep(workflowName: string, index: number): Promise<Result<Workflow, ValidationError>> {
    const steps = this.stepsStream.getValue();

    // Шаг должен существовать
    const stepToRemove = steps.find(step => step.initialIndex === index);
    if (!stepToRemove) {
      return {
        ok: false,
        error: new ValidationError('Не найден шаг для удаления'),
      };
    }

    // Оптимистичное обновление состояния.
    const oldSteps = [...steps];
    return this.withOptimisticUpdate({
      optimisticUpdate: () => this.stepsStream.next(
        steps.filter(step => step.initialIndex !== index)
      ),
      rollback: () => this.stepsStream.next(oldSteps),
      action: () => this.workflowApi.deleteStep({
        wfName: workflowName,
        stepInitialIndex: index,
      }),
      realUpdate: (realValue) => this.stepsStream.next(realValue.steps),
    });
  }

  /** Уничтожение стора. Завершение потока для отмены подписок всех получателей */
  public destroy(): void {
    this.stepsStream.complete();
  }

  /**
   * Выполняет действие, с оптимистичным обновлением состояния
   * 
   * Откатывает оптимистичные обновления в случае ошибки в результате действия.
   * @param configuration Конфигурация с функциями обновления/отката состояния, и выполняемым действием 
   * @returns Результат выполнения действия 
   */
  private async withOptimisticUpdate<T, E>(configuration: {
    /** Оптимистичное обновление, выполняемое сразу */
    optimisticUpdate: () => void;
    /** Откат оптимистичного обновления к прежнему состоянию */
    rollback: () => void;
    /** Асинхронное действие, которое выполняется после оптимистичного обновления для получения реального значения */
    action: () => Promise<Result<T, E>>;
    /** Обновление реальным значением, полученным после выполнения действия */
    realUpdate: (realValue: T) => void;
  }): Promise<Result<T, E>> {
    const { optimisticUpdate, rollback, action, realUpdate } = configuration;
    try {
      optimisticUpdate();

      const result = await action();
      if (result.ok) {
        // Обновим реальным значением, полученным с сервера (могут быть серверные изменения)
        realUpdate(result.value);
      } else {
        // Ошибка бизнес-логики (валидация и т.д.) - откат изменений, но не прерываем операцию, а возвращаем результат с ошибкой для обработки в UI
        rollback();
      }

      return result;
    } catch (error) {
      // Что-то пошло не так - откат изменений, и проброс ошибки дальше
      rollback();
      throw error;
    }
  }

}

// Экземпляр стора
export const workflowStore = new WorkflowStore(
  workflowApiService,
);
