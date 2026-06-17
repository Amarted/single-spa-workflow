import { BehaviorSubject, type Observable } from 'rxjs';
import { type WorkflowStep } from '../interfaces/WorkflowStep';
import { eventBus, type EventBus } from '../../EventBus';
import { workflowApiService, type WorkflowApiService } from '../api/WorkflowApiService';
import { ValidationError } from '../errors/ValidationError';
import { messageService, type MessageService } from '../../MessageService';
import type { Workflow } from '../interfaces/Workflow';

/**
 * Сервис для управления состоянием рабочего процесса
 * 
 * - Валидирует изменение состояния, чтобы оно всегда оставалось корректным
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

  /** Флаг инициализации */
  private initialized = false;

  public constructor(
    private readonly workflowApi: WorkflowApiService,
    private readonly eventBus: EventBus,
    private readonly messageService: MessageService,
  ) {
    // Автоматически инициализируем (подписка на события)
    this.init();
  }

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
  * Добавление нового шага
  * @param newStep Новый шаг
  * @returns true — если успешно, ValidationError — если ошибка валидации (например, неуникальное название)
  */
  public async addStep(newStep: WorkflowStep): Promise<true | ValidationError> {
    const steps = this.stepsStream.getValue();

    // Клиентская валидация уникальности имени (опционально, чтобы не ходить на сервер лишний раз)
    const nameIsNotUnique = steps.some(step => step.name === newStep.name);
    if (nameIsNotUnique) {
      return new ValidationError(`Шаг с названием ${newStep.name} уже существует`);
    }

    // Валидация уникальности индекса 
    const indexIsNotUnique = steps.some(step => step.initialIndex === newStep.initialIndex);
    if (indexIsNotUnique) {
      return new ValidationError(`Шаг с индексом ${newStep.initialIndex} уже существует`);
    }

    // Оптимистичное обновление UI
    this.stepsStream.next([...steps, newStep]);

    // И синхронизация с сервером
    try {
      await this.workflowApi.createStep(newStep);

      return true;
    } catch (error) {
      // Откат изменений, логирование, оповещение пользователя
      this.stepsStream.next(steps);

      const errorMessage = `Ошибка создания шага. ${error instanceof Error ? error.message : ''}`;
      this.messageService.showToast(errorMessage, 'error');

      throw error;
    }
  }

  /**
   * Изменение названия шага
   * 
   * Название шага должно быть уникальным
   * @param stepIndex Индекс шага
   * @param newName Новое название
   * @returns true - если успешно, ValidationError - если ошибка валидации
   */
  public async changeStepName(stepIndex: number, newName: string): Promise<true | ValidationError> {
    const steps = this.stepsStream.getValue();
    const existingStep = steps.find(s => s.initialIndex === stepIndex);
    if (!existingStep) {
      return new ValidationError('Шаг не существует');
    }

    const nameIsNotUnique = steps.some(step => step.name === newName && step !== existingStep);
    if (nameIsNotUnique) {
      return new ValidationError('Название шага должно быть уникальным');
    }

    // Сохраняем старое состояние для отката
    const oldSteps = [...steps];

    // Оптимистичное обновление
    const updatedStep = { ...existingStep, name: newName };
    this.stepsStream.next(
      steps.map(step => step.initialIndex === updatedStep.initialIndex ? updatedStep : step)
    );

    try {
      await this.workflowApi.changeStepName(updatedStep);

      return true;
    } catch (error) {
      // Откат изменений
      this.stepsStream.next(oldSteps);
      const errorMessage = `Ошибка изменения названия шага. ${error instanceof Error ? error.message : ''}`;
      this.messageService.showToast(errorMessage, 'error');

      throw error;
    }
  }

  /**
    * Удаление шага
    * @param index Индекс шага для удаления
    */
  public async removeStep(index: number): Promise<void> {
    const steps = this.stepsStream.getValue();
    const stepToRemove = steps.find(s => s.initialIndex === index);
    if (!stepToRemove) return;

    // Сохраняем старое состояние для отката
    const oldSteps = [...steps];

    // Оптимистичное удаление
    this.stepsStream.next(
      steps.filter(s => s.initialIndex !== index)
    );

    try {
      await this.workflowApi.deleteStep(stepToRemove);
    } catch (error) {
      // Откат изменений
      this.stepsStream.next(oldSteps);
      const errorMessage = `Ошибка удаления шага. ${error instanceof Error ? error.message : ''}`;
      this.messageService.showToast(errorMessage, 'error');

      throw error;
    }
  }

  /**
   * Уничтожение стора
   * 
   * Отписка от событий изменения данных и завершение потока для отмены подписок всех получателей
   */
  public destroy(): void {
    this.stepsStream.complete();
    this.eventBus.off('wf-step-created');
    this.eventBus.off('wf-step-name-changed');
    this.eventBus.off('wf-step-deleted');

    this.initialized = false;
  }

  /**
   * Инициализация (подписка на события)
   */
  private init(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    this.eventBus.on('wf-step-created', (event) => this.addStep(event.detail.step));
    this.eventBus.on('wf-step-name-changed', (event) => this.changeStepName(event.detail.index, event.detail.name));
    this.eventBus.on('wf-step-deleted', (event) => this.removeStep(event.detail.index));
  }

  /**
   * Загрузка состояния workflow с сервера
   */
  public async loadWorkflow(name?: string): Promise<void> {
    try {
      const workflow = await this.workflowApi.getWorkflow({ wfName: name });

      this.setWorkflow(workflow);
    } catch (error) {
      const errorMessage = `Ошибка загрузки шагов. ${error instanceof Error ? error.message : ''}`;
      this.messageService.showToast(errorMessage, 'error');

      throw error;
    }
  }

}

// Экземпляр стора
export const workflowStore = new WorkflowStore(
  workflowApiService,
  eventBus,
  messageService,
);
