/** Дополнительная информация о записи */
type LogContext = Record<string, unknown>;

/**
 * Логгер приложения
 * 
 * Текущая реализация через консоль, но мы можем делать отправку на сервер или использовать sentry
 */
export class Logger {
  public log(message: string, context?: LogContext): void {
    console.log(message, { context });
  }
  public error(message: string, context?: LogContext): void {
    console.error(message, { context });
  }
  public warn(message: string, context?: LogContext): void {
    console.warn(message, { context });
  }
  public info(message: string, context?: LogContext): void {
    console.info(message, { context });
  }
}

export const logger = new Logger();