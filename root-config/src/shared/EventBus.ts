import type { AppEventMap } from './workflow/WorkflowEvents';

/**
 * Callback для событий в шине
 */
type EventCallback<E> = (event: E) => void;
/**
 * Шина событий, для обмена данными между компонентами
 */
export class EventBus<EventMap = AppEventMap> {
  private listeners = new Map<keyof EventMap, EventCallback<EventMap[any]>[]>(); // ключи из EventMap — это имена событий

  /**
   * Регистрация обработчика события
   * @param eventName Название события 
   * @param callback Обработчик события 
   */
  public on<K extends keyof EventMap>(eventName: K, callback: EventCallback<EventMap[K]>): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(callback);
  }

  /**
   * Генерация события
   * @param eventName Название события 
   * @param event Данные события 
   */
  public emit<K extends keyof EventMap>(eventName: K, event: EventMap[K]): void {
    const callbacks = this.listeners.get(eventName);
    if (callbacks) {
      callbacks.forEach(cb => cb(event));
    }
  }

  /**
   * Отмена регистрации обработчика события
   * 
   * Если не передан обработчик, то удаляется все обработчики для данного события
   * @param eventName Название события 
   * @param callback Обработчик события, котоырй нужно отключить
   */
  public off<K extends keyof EventMap>(eventName: K, callback?: EventCallback<EventMap[K]>): void {
    if (!this.listeners.has(eventName)) return;
    const callbacks = this.listeners.get(eventName)!;
    if (callback) {
      this.listeners.set(eventName, callbacks.filter(cb => cb !== callback));
    } else {
      this.listeners.delete(eventName);
    }
  }
}

// Экземпляр шины событий
export const eventBus = new EventBus();
