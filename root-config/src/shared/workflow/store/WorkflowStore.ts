import { BehaviorSubject } from 'rxjs';
import { type WorkflowStep } from '../interfaces/WorkflowStep';
import { eventBus } from '../../EventBus';


class WorkflowStore {
  /** Поток со списком шагов приложения для изменения */
  private readonly stepsStream = new BehaviorSubject<WorkflowStep[]>([]);
  /** Поток со списком шагов приложения только для чтения (можем только подписаться на изменения, но не менять) */
  public readonly steps = this.stepsStream.asObservable();

  /** Флаг инициализации */
  private initialized = false;

  public constructor() {
    this.init();
  }

  /** Установить новый списко шагов */
  public setSteps(steps: WorkflowStep[]): void {
    this.stepsStream.next(steps);
  }

  /** Очистить список шагов */
  public clear(): void {
    this.stepsStream.next([]);
  }

  /**
   * Добавление нового шага
   * @param step Новый шаг
   */
  public addStep(step: WorkflowStep): void {
    this.stepsStream.next([...this.stepsStream.getValue(), step]);
  }

  /**
   * Обновление шага
   * @param updatedStep Обновленный шаг
   */
  public updateStep(updatedStep: WorkflowStep): void {
    this.stepsStream.next(
      this.stepsStream.getValue().map(s => s.id === updatedStep.id ? updatedStep : s)
    );
  }

  /**
   * Удаление шага
   * @param id Идентификатор шага для удаления
   */
  public removeStep(id: string): void {
    this.stepsStream.next(
      this.stepsStream.getValue().filter(s => s.id !== id)
    );
  }

  /**
   * Уничтожение стора
   * 
   * Отписка от событий изменения данных и завершение потока для отмены подписок всех получателей
   */
  public destroy(): void {
    this.stepsStream.complete();
    eventBus.off('wf-step-created');
    eventBus.off('wf-step-updated');
    eventBus.off('wf-step-deleted');

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

    eventBus.on('wf-step-created', this.addStep.bind(this));
    eventBus.on('wf-step-updated', this.updateStep.bind(this));
    eventBus.on('wf-step-deleted', (id: string) => this.removeStep(id));
  }

  /**
   * Загрузка шагов из API
   */
  async loadFromApi(): Promise<void> {
    const res = await fetch('/api/workflow/steps');
    const steps = await res.json();
    this.setSteps(steps);
  }

  /**
   * Сохранение шагов в API
   */
  async saveToApi(steps: WorkflowStep[]): Promise<void> {
    await fetch('/api/workflow/steps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(steps),
    });
    this.setSteps(steps); // или перезагрузить из API
  }
}

// Экземпляр стора (Singleton)
export const workflowStore = new WorkflowStore();
