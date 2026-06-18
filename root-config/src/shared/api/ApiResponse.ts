/** Общее описание возможного ответа серверного API (успешного и нет) */

/** Неуспешный API ответ, содержащий ошибки */
export interface ApiErrorResponse {
  error: string;
}

/** Успешный API ответ, содержащий данные */
export type ApiSuccessResponse<T> = T;

/** Общий тип API ответа */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
