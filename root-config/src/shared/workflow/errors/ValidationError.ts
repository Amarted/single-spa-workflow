/** Класс ошибки валидации, используется в бизнес логике */
export class ValidationError {
  public constructor(
    /** Сообщение об ошибке */
    public readonly message: string,
    /** Контекст ошибки (любая доп инфа, имя поля) */
    public readonly context: Record<string, unknown> = {}
  ) { }
}