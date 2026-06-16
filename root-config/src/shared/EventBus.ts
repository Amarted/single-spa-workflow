/**
 * Callback для событий в шине
 */
interface EventCallback<T> {
  (event: T): void;
}
/**
 * Шина событий, для обмена данными между компонентами
 */
class EventBus<T = any> {
  private listeners: Map<string, EventCallback<T>[]> = new Map();

  /**
   * Регистрация обработчика события
   * @param eventName Название события 
   * @param callback Обработчик события 
   */
  public on(eventName: string, callback: EventCallback<T>): void {
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
  public emit(eventName: string, event: T): void {
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
  public off(eventName: string, callback?: EventCallback<T>): void {
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
