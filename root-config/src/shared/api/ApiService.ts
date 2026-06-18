import { ApiError } from '../errors/ApiError';
import { ValidationError } from '../errors/ValidationError';
import type { Result } from '../Result';
import type { ApiErrorResponse } from './ApiResponse';

/**
 * Класс для работы с серверным API, содержащий общие методы обработки ответа/ошибок сервера, конфигурацию и прочее
 * 
 * Реализации для работы с конкретным API должны наследоваться от этого класса
 * @example ```typescript
 * class MyApiService extends ApiService {
 *   async getData(): Promise<ResultType> {
 *     const response = await fetch('https://example.com/api/data');
 *     return this.handleResponse(response);
 *   }
 * }
 */
export abstract class ApiService {
  /**
   * При создании указываем API URL, для использования в остальных методах
   * @param apiUrl URL для серверного API
   */
  public constructor(
    protected readonly apiUrl: string,
  ) { }

  /**
   * Обработка ответа сервера
   * 
   * Ошибки сервера с кодом 400 и 404, рассматриваем как ошибки валидации, как и при валидации на клиенте (не важен источник валидации, важен сам её факт). 
   * Используем для них один тип ValidationError, и возвращаем как результат операции (неуспешный flow).
   * @param response ответ сервера: успешный, со значением `ResponseData`, или неуспешный, с ошибкой валидации
   * @throws {ApiError} Ошибка сети/сервера (не связанная с текущей операцией)
   */
  protected async handleResponse<ResponseData>(response: Response): Promise<Result<ResponseData, ValidationError>> {
    if (response.ok) {
      // Успешный flow - возвращаем данные
      return {
        ok: true,
        value: await response.json(),
      };
    } else {
      // Какая-то ошибка, пытаемся понять - ошибка валидации (как части операции), или что-то ещё

      let errorBody: ApiErrorResponse | null = null;

      try {
        // Пробуем получить JSON с информацией об ошибке, если она была передана сервером
        errorBody = await response.json() as ApiErrorResponse;
      } catch (e) {
        // Если ответ не JSON — игнорируем
      }

      // Рассматриваем 400 и 404 как ошибку процесса ValidationError, и не бросаем её как исключение
      if ([400, 404].includes(response.status)) { // Можем добавить другие статусы, если нужно
        // Неуспешный flow - возвращаем ошибку валидации
        const error = new ValidationError(errorBody?.error ?? 'Ошибка валидации'); // Вторым параметром можем добавлять поле, если бы сервер его передавал {field: body.field}

        return {
          ok: false,
          error,
        }
      } else {
        // Что-то ещё пошло не так - выкидываем ошибку API
        // Если сервер не передавал ошибку — используем текст статуса или дефолтное сообщение
        throw new ApiError(
          errorBody?.error || response.statusText || 'Неизвестная ошибка',
          response.status,
        );
      }
    }
  }
}
