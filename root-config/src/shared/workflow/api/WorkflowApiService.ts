import { rootConfig } from '../../../config';
import { ApiService } from '../../api/ApiService';
import type { ValidationError } from '../../errors/ValidationError';
import type { Result } from '../../Result';
import type { Workflow } from '../interfaces/Workflow';
import type { WorkflowStep } from '../interfaces/WorkflowStep';

/** Данные для запроса на получение рабочего процесса, включая список шагов */
interface GetWorkflowRequestData {
  /** Название процесса. Если не указано - загружается дефолтный процесс */
  wfName?: string;
}

/** Данные для запроса на создание шага */
interface CreateStepRequestData {
  /** Название процесса */
  wfName: string;
  /** Название шага */
  stepName: string;
  /** Координата x шага на диаграмме */
  x: number;
  /** Координата y шага на диаграмме */
  y: number;
  /** Цвет шага */
  color?: string;
  /** 
   * Связанные шаги
   * @todo добавить сохранение на бэкенде, сейчас там нет nextSteps при создании шага, т.е. он это не сохраняет. */
  nextSteps: number[];
}

/** Данные для запроса на изменение названия шага */
interface ChangeStepNameRequestData {
  /** 
   * Название процесса. Если не указано - используется дефолтный процесс. 
   * @todo лучше сделать явным (обязательным), сейчас опционально, как и на сервере.
   */
  wfName?: string;
  /** index шага процесса, название которого нужно изменить */
  stepInitialIndex: number;
  /** Новое название шага */
  stepName: string;
}

/** Данные для запроса на удаление шага рабочего процесса */
interface DeleteWorkflowStepRequestData {
  /** Название процесса */
  wfName: string;
  /** index шага, который нужно удалить */
  stepInitialIndex: number;
}

/**
 * Сервис для работы с серверным API процессов
 */
export class WorkflowApiService extends ApiService {

  /**
   * Получение рабочего процесса со списком шагов
   * @param data Данные для загрузки.
   * @return Рабочий процесс с сервера, или ошибка валидации
   */
  public async getWorkflow(data?: GetWorkflowRequestData): Promise<Result<Workflow, ValidationError>> {
    const url = new URL(`${this.apiUrl}/get`);
    if (data?.wfName) {
      url.searchParams.set('wfName', data.wfName);
    }

    const response = await fetch(url);

    return this.handleResponse<Workflow>(response);
  }

  /**
   * Создание шага рабочего процесса
   * @param data Данные для создания
   * @return Созданный на сервере шаг, или ошибка валидации
   */
  public async createStep(data: CreateStepRequestData): Promise<Result<WorkflowStep, ValidationError>> {
    const response = await fetch(`${this.apiUrl}/createStep`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return this.handleResponse<WorkflowStep>(response);
  }

  /**
   * Изменение названия шага
   * @param data Данные для изменения
   * @returns Обновлённый на сервере рабочий процесс, или ошибка валидации
   */
  public async changeStepName(data: ChangeStepNameRequestData): Promise<Result<Workflow, ValidationError>> {
    const response = await fetch(`${this.apiUrl}/changeStepName`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return this.handleResponse<Workflow>(response);
  }

  /**
   * Удаление шага
   * @param data Данные для удаления 
   * @returns Рабочий процесс после удаления шага на сервере, или ошибка валидации
   */
  public async deleteStep(data: DeleteWorkflowStepRequestData): Promise<Result<Workflow, ValidationError>> {
    const response = await fetch(`${this.apiUrl}/deleteStep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return this.handleResponse<Workflow>(response);
  }
}

/**
 * Сервис для работы с серверным API процессов
 */
export const workflowApiService = new WorkflowApiService(rootConfig.workflowApiUrl);
