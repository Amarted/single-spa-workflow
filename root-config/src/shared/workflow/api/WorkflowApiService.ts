import { rootConfig } from '../../../config';
import type { Workflow } from '../interfaces/Workflow';
import type { WorkflowStep } from '../interfaces/WorkflowStep';

/** Данные для запроса на получение рабочего процесса */
interface GetWorkflowRequestData {
  /** Название процесса */
  wfName?: string;
}

/** Данные для запроса на создание шага */
interface CreateStepRequestData {
  step: WorkflowStep;
}

/** Данные для запроса на изменение названия шага */
interface ChangeStepNameRequestData {
  /** Название процесса */
  wfName?: string;
  /** index шага процесса, название которого нужно изменить */
  stepInitialIndex: number;
  /** Новое название шага */
  stepName: string;
}

/**
 * Сервис для работы с серверным API процессов
 */
export class WorkflowApiService {
  public constructor(
    /** URL для серверного API процессов */
    private readonly apiUrl: string,
  ) { }

  /**
   * Получение рабочего процесса со списком шагов
   * @param name Название рабочего процесса, который нужно загрузить
   */
  public async getWorkflow(request?: GetWorkflowRequestData): Promise<Workflow> {
    const url = new URL(`${this.apiUrl}/get`);
    if (request?.wfName) {
      url.searchParams.set('wfName', request.wfName);
    }
    console.log('Calll fetch');

    const res = await fetch(url);
    const response = await res.json();
    console.log('resspnse', response);


    return response;
  }

  /**
   * Создание шага рабочего процесса
   */
  public async createStep(step: WorkflowStep): Promise<void> {
    await fetch(`${this.apiUrl}/createStep`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(step),
    });
  }

  /**
   * Изменение названия шага
   * @param step Шаг для изменения 
   */
  public async changeStepName(step: WorkflowStep): Promise<void> {
    await fetch(`${this.apiUrl}/changeStepName`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(step),
    });
  }

  /**
   * Удаление шага
   * @param step Шаг для удаления 
   */
  public async deleteStep(step: WorkflowStep): Promise<void> {
    await fetch(`${this.apiUrl}/deleteStep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(step),
    });
  }
}

/**
 * Сервис для работы с серверным API процессов
 */
export const workflowApiService = new WorkflowApiService(rootConfig.workflowApiUrl);

