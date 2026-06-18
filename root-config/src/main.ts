import { addErrorHandler, getAppStatus, LOAD_ERROR, registerApplication, start } from 'single-spa';
import { workflowStore } from '@shared/workflow/store/WorkflowStore';
import { messageService } from '@shared/MessageService';
import './styles/root-style.scss';
import { workflowApiService } from './shared/workflow/api/WorkflowApiService';

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
    messageService.showToast(`Не удалось загрузить приложение ${error.appOrParcelName}`, 'error');
    console.error(error);
  }
});

start();

/** Инициализация общего состояния single-spa приложения. */
async function initState(): Promise<void> {
  try {
    await loadWorkflow();
  } catch (error) {
    messageService.showToast('Не удалось загрузить данные с сервера. Возможно он не доступен', 'error');
    console.error(error);
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
    messageService.showToast(`Ошибка загрузки рабочего процесса. ${result.error.message}`, 'error');
    console.error('Ошибка загрузки рабочего процесса', result);
  }
}
