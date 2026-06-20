import { addErrorHandler, getAppStatus, LOAD_ERROR, registerApplication, start } from 'single-spa';
import { workflowStore } from '@shared/workflow/store/WorkflowStore';
import { messageService } from '@shared/MessageService';
import './styles/styles.scss';
import { workflowApiService } from './shared/workflow/api/WorkflowApiService';
import { logger } from './shared/Logger';
import { ApiError } from './shared/errors/ApiError';

/** Данные микро-фронтенда */
interface Frontend {
  name: string;
  route: string;
  importPath: string;
}

// Запускаем инициализацию состояния в фоне
void initState();

// Регистрируем приложения
const frontends: Frontend[] = [
  {
    name: 'workflow-table',
    route: '/',
    importPath: 'workflow-table',
  },
  {
    name: 'workflow-diagram',
    route: '/',
    importPath: 'workflow-diagram',
  },
];
frontends.forEach((frontend) => {
  registerApplication({
    name: frontend.name,
    app: () => import(/* @vite-ignore */ frontend.importPath),
    activeWhen: (location) => location.pathname === frontend.route,
  });
});

// Оповестить пользователя и сделать лог об ошибке загрузки приложения
addErrorHandler((error) => {
  if (getAppStatus(error.appOrParcelName) === LOAD_ERROR) {
    const message = `Не удалось загрузить приложение ${error.appOrParcelName}`;
    messageService.showToast(message, 'error');
    logger.error(message, { error });
  }
});

start();

/** Инициализация общего состояния single-spa приложения. */
async function initState(): Promise<void> {
  try {
    await loadWorkflow();
  } catch (error) {
    let errorMessage;
    const serverUnavailable = (error instanceof ApiError && error.status === 503) || error instanceof Error && error.message === 'Failed to fetch';
    if (serverUnavailable) {
      errorMessage = 'Сервер недоступен. Попробуйте позже';
    } else {
      errorMessage = 'Не удалось загрузить данные с сервера. Попробуйте обновить страницу';
    }
    // Уведомить пользователя и залогировать ошибку
    messageService.showToast(errorMessage, 'error', 'always');
    logger.error(errorMessage, { error });
  }
}


/** Загрузка workflow с сервера */
async function loadWorkflow(name?: string): Promise<void> {
  const result = await workflowApiService.getWorkflow({ wfName: name });

  if (result.ok) {
    // Всё ок - обновляем состояние загруженными данными
    workflowStore.setWorkflow(result.value);
  } else {
    // Не валидные данные, может ошибка в имени - выдать оповещение и залогировать результат
    const errorMessage = 'Ошибка загрузки рабочего процесса';
    messageService.showToast(`${errorMessage}: ${result.error.message}`, 'error');
    logger.error(errorMessage, result);
  }
}
