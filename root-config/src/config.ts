/**
 * Конфигурация приложения
 * 
 * @todo Сделать генерацию/загрузку конфигурации для разных окружений 
 * @example workflowApiUrl: process.env['workflowApiUrl'] ?? 'http://localhost:3000/workflow',
 */
export const rootConfig = {
  /** URL для серверного API процессов */
  workflowApiUrl: 'http://localhost:3000/workflow',
}
