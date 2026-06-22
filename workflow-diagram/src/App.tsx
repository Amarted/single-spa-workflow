
import { Provider } from 'react-redux';
import { store } from './store/store';
import { WorkflowDiagram } from './components/WorkflowDiagram';

function App() {
  return (
    <Provider store={store}>
      <WorkflowDiagram />
    </Provider>
  );
}

export default App;
