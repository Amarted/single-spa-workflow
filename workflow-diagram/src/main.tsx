import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { startWorkflowStoreSync } from './spa.tsx';
const mountRoot = document.getElementById('workflow-diagram-root');

if (!mountRoot) {
  throw new Error('Не удалось найти элемент для монтирования диаграммы рабочего процесса');
}
void startWorkflowStoreSync();

// Render app
const root = createRoot(mountRoot);
root.render(<App />);