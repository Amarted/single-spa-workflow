import { addErrorHandler, getAppStatus, LOAD_ERROR, registerApplication, start } from 'single-spa';
import { workflowStore } from '@shared/workflow/store/WorkflowStore';
import { MessageService } from '@shared/MessageService';
import './styles/root-style.scss';

/**
 * Данные одного микро-фронтенда
 */
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
    MessageService.showToast(`Не удалось загрузить приложение ${error.appOrParcelName}`, 'error');
    console.error(error);
  }
});

start();

/**
 * Инициализация общего состояния single-spa приложения.
 */
async function initState(): Promise<void> {
  try {
    // Загрузим состояние шагов рабочего процесса с сервера
    await workflowStore.loadFromApi();
  } catch (error) {
    MessageService.showToast('Не удалось загрузить данные с сервера. Возможно он не доступен', 'error');
    console.error(error);
  }
}
